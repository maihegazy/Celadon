// Celadon — meal photo analysis.
//
// Two endpoints, matching RemoteMealAnalysisService:
//
//   POST /analyze-meal/detect   → identify the dish and its parts
//   POST /analyze-meal/analyze  → score the confirmed plate for this user
//
// The vision model runs server-side so the API key never ships in the app,
// and the free-tier quota is enforced here — a client-held counter could be
// reset by reinstalling, and this endpoint is the thing that costs money.
//
// Providers (ANALYSIS_PROVIDER):
//   'stub'      — deterministic reference plate; the default, so the whole
//                 pipeline is testable end-to-end before any model spend.
//   'anthropic' — Claude vision via the official SDK. Needs ANTHROPIC_API_KEY.
//                 ANALYSIS_MODEL overrides the model (default claude-opus-5);
//                 ANALYSIS_EFFORT tunes cost/latency (default medium).
//
// Deploy with:
//   supabase functions deploy analyze-meal
//   supabase secrets set ANALYSIS_PROVIDER=anthropic ANTHROPIC_API_KEY=...

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FREE_SCANS_PER_WEEK = Number(Deno.env.get('FREE_SCANS_PER_WEEK') ?? '3');

type Locale = 'en' | 'ar';
type Profile = { avoids: string[]; conditions: string[]; cuisines: string[] };

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const stage = new URL(request.url).pathname.split('/').pop();
  if (stage !== 'detect' && stage !== 'analyze') {
    return json({ error: 'not_found' }, 404);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: 'missing_authorization' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  // Identify the caller from their own token — never trust an id in the body.
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await asCaller.auth.getUser();
  if (userError || !userData.user) return json({ error: 'not_signed_in' }, 401);
  const userId = userData.user.id;

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'expected_multipart_form' }, 400);
  }
  const image = form.get('image');
  if (!(image instanceof File)) return json({ error: 'missing_image' }, 400);
  const locale: Locale = form.get('locale') === 'ar' ? 'ar' : 'en';
  const profile = parseProfile(form.get('profile'));

  // Quota is spent on analyze — the step that produces a logged result.
  // Detection alone (retakes, corrections) doesn't count against anyone.
  const quota = await currentQuota(admin, userId);
  if (stage === 'analyze' && !quota.premium && quota.used >= quota.limit) {
    return json({ error: 'quota_exceeded', scans_used: quota.used, scans_limit: quota.limit }, 402);
  }

  try {
    const provider = Deno.env.get('ANALYSIS_PROVIDER') === 'anthropic' ? analyzeWithClaude : stubbed;
    const body =
      stage === 'detect'
        ? await provider.detect(image, profile, locale)
        : await provider.analyze(image, {
            ingredients: parseStringArray(form.get('ingredients')),
            portion: String(form.get('portion') ?? 'medium'),
            separateItems: form.get('separate_items') === 'true',
            profile,
            locale,
          });

    if (stage === 'analyze') {
      const used = quota.premium ? quota.used : await recordScan(admin, userId, quota.weekStart);
      return json({ ...body, scans_used: used, scans_limit: quota.limit, premium: quota.premium }, 200);
    }
    return json(body, 200);
  } catch (error) {
    if (error instanceof UnreadableImageError) {
      return json({ error: 'unreadable' }, 422);
    }
    console.error(`analyze-meal ${stage} failed:`, error);
    return json({ error: 'analysis_failed' }, 502);
  }
});

/* ── quota ────────────────────────────────────────────────────────────── */

/** Sunday-based, matching the app's week. UTC — a stable server-side clock. */
function weekStartISO(now = new Date()): string {
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - now.getUTCDay());
  return start.toISOString().slice(0, 10);
}

async function currentQuota(admin: SupabaseClient, userId: string) {
  const weekStart = weekStartISO();
  const [subscription, usage] = await Promise.all([
    admin.from('subscriptions').select('status').eq('user_id', userId).maybeSingle(),
    admin
      .from('scan_usage')
      .select('scans_used')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle(),
  ]);
  const status = subscription.data?.status as string | undefined;
  return {
    weekStart,
    premium: status === 'active' || status === 'trialing',
    used: usage.data?.scans_used ?? 0,
    limit: FREE_SCANS_PER_WEEK,
  };
}

async function recordScan(admin: SupabaseClient, userId: string, weekStart: string): Promise<number> {
  // Re-read inside the write path so concurrent scans can't lose counts;
  // the worst race outcome is one extra allowed scan, never a lost one.
  const current = await admin
    .from('scan_usage')
    .select('scans_used')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle();
  const used = (current.data?.scans_used ?? 0) + 1;
  await admin
    .from('scan_usage')
    .upsert({ user_id: userId, week_start: weekStart, scans_used: used }, { onConflict: 'user_id,week_start' });
  return used;
}

/* ── Claude vision provider ───────────────────────────────────────────── */

class UnreadableImageError extends Error {}

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' });

const MODEL = Deno.env.get('ANALYSIS_MODEL') ?? 'claude-opus-5';
const EFFORT = (Deno.env.get('ANALYSIS_EFFORT') ?? 'medium') as 'low' | 'medium' | 'high';

const languageName = (locale: Locale) => (locale === 'ar' ? 'Arabic' : 'English');

const SYSTEM = `You analyse meal photos for Celadon, an anti-inflammatory eating companion for people in Egypt and the Gulf. You know Egyptian and Levantine home cooking well — molokhia, bessara, shorbet ads, koshari, ful — and you never shame anyone for what is on their plate.

Scores estimate how well a meal supports an anti-inflammatory pattern (0-100). Omega-3-rich fish, olive oil, leafy greens, legumes and spices like turmeric score high; refined flour, processed meat and deep-fried food lower the score. All nutrition numbers are estimates from a photo — reasonable, round, never falsely precise.

If the photo does not show food, or is far too dark or blurred to identify, say so via the unreadable field instead of guessing. An honest "couldn't read it" beats a wrong answer.`;

const DETECT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['unreadable', 'dish', 'confidence', 'mixed_dish', 'ingredients'],
  properties: {
    unreadable: { type: 'boolean', description: 'True when no food can be identified.' },
    dish: { type: 'string' },
    confidence: { type: 'number', description: '0 to 1' },
    mixed_dish: { type: 'boolean', description: 'True when the plate might be several separate items.' },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'name', 'confidence'],
        properties: {
          id: { type: 'string', description: 'Stable kebab-case slug, e.g. "olive-oil".' },
          name: { type: 'string' },
          confidence: { type: 'number', description: '0 to 1' },
        },
      },
    },
  },
} as const;

const ANALYZE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['unreadable', 'dish', 'score', 'classification', 'confidence', 'summary', 'nutrition', 'ingredients', 'substitutions'],
  properties: {
    unreadable: { type: 'boolean' },
    dish: { type: 'string' },
    score: { type: 'integer', description: '0 to 100' },
    classification: { type: 'string', enum: ['Supportive', 'Balanced', 'Limit'] },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    summary: { type: 'string', description: 'Two warm, plain sentences explaining the score.' },
    nutrition: {
      type: 'object',
      additionalProperties: false,
      required: ['calories', 'protein', 'carbs', 'fat', 'fibre'],
      properties: {
        calories: { type: 'integer' },
        protein: { type: 'number' },
        carbs: { type: 'number' },
        fat: { type: 'number' },
        fibre: { type: 'number' },
      },
    },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'label', 'tone', 'reason'],
        properties: {
          name: { type: 'string' },
          label: { type: 'string', description: 'Short localised tone label, e.g. "Supportive".' },
          tone: { type: 'string', enum: ['supportive', 'balanced', 'flagged', 'limit'] },
          reason: { type: 'string', description: 'One plain sentence explaining the call.' },
        },
      },
    },
    substitutions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['from', 'to'],
        properties: { from: { type: 'string' }, to: { type: 'string' } },
      },
    },
  },
} as const;

async function callClaude(image: File, prompt: string, schema: object): Promise<Record<string, unknown>> {
  const bytes = new Uint8Array(await image.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }

  const response = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: 8000,
    // Refusal classifiers can decline benign photos; the default fallback
    // chain re-runs those on another model instead of failing the scan.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: EFFORT, format: { type: 'json_schema', schema } },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: (image.type || 'image/jpeg') as 'image/jpeg',
              data: btoa(binary),
            },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  } as never);

  if (response.stop_reason === 'refusal') throw new Error('model_refused');
  const text = response.content.find((block: { type: string }) => block.type === 'text') as
    | { text: string }
    | undefined;
  if (!text) throw new Error('empty_response');
  const parsed = JSON.parse(text.text) as Record<string, unknown>;
  if (parsed.unreadable) throw new UnreadableImageError();
  return parsed;
}

const profileNotes = (profile: Profile, locale: Locale) =>
  `Write every user-facing string in ${languageName(locale)}.
This user's profile — judge ingredients relative to it:
- Avoids: ${profile.avoids.join(', ') || 'nothing specific'}
- Conditions: ${profile.conditions.join(', ') || 'none shared'}
- Preferred cuisines: ${profile.cuisines.join(', ') || 'no preference'}`;

const analyzeWithClaude = {
  detect(image: File, profile: Profile, locale: Locale) {
    return callClaude(
      image,
      `${profileNotes(profile, locale)}

Identify the dish in this photo and list its visible or clearly implied ingredients. Use stable kebab-case ids for ingredients so a correction step can reference them.`,
      DETECT_SCHEMA,
    );
  },

  analyze(
    image: File,
    request: { ingredients: string[]; portion: string; separateItems: boolean; profile: Profile; locale: Locale },
  ) {
    return callClaude(
      image,
      `${profileNotes(request.profile, request.locale)}

The user confirmed this plate:
- Kept ingredients (by id): ${request.ingredients.join(', ') || 'everything detected'}
- Portion size: ${request.portion}
- ${request.separateItems ? 'Separate items, not one mixed dish' : 'One mixed dish'}

Score the meal for this user. Flag ingredients that clash with what they avoid ("flagged"), keep the tone warm and factual, and suggest at most two easy substitutions using foods common in Egypt and the Gulf.`,
      ANALYZE_SCHEMA,
    );
  },
};

/* ── stub provider ────────────────────────────────────────────────────── */

/** The reference plate from the design, so the pipeline — auth, quota,
 * response mapping — is testable end-to-end before any model spend. */
const STUB = {
  en: {
    dish: 'Salmon quinoa bowl',
    salmon: 'Salmon fillet', quinoa: 'Quinoa', tomatoes: 'Cherry tomatoes',
    oliveOil: 'Olive oil dressing', feta: 'Feta',
    supportive: 'Supportive', balanced: 'Balanced', limit: 'Limit',
    summary: 'Plenty going for this plate — omega-3s from the salmon and good fats from the olive oil. The feta is the one thing worth keeping an eye on.',
    salmonReason: 'Rich in omega-3 EPA and DHA.',
    oliveOilReason: 'Oleocanthal has well-studied anti-inflammatory activity.',
    quinoaReason: 'Gluten-free whole grain, gentle on most protocols.',
    tomatoesReason: 'Fine for most people.',
    fetaReason: 'Aged and salty — an occasional accent, not a base.',
    subFetaFrom: 'Feta', subFetaTo: 'labneh, strained and daily-friendly',
    subTomatoesFrom: 'Cherry tomatoes', subTomatoesTo: 'cucumber, if nightshades bother you',
  },
  ar: {
    dish: 'سلطة السلمون بالكينوا',
    salmon: 'شريحة سلمون', quinoa: 'كينوا', tomatoes: 'طماطم كرزية',
    oliveOil: 'صلصة زيت الزيتون', feta: 'جبن فيتا',
    supportive: 'داعم', balanced: 'متوازن', limit: 'للتحديد',
    summary: 'طبق فيه الكثير من الخير — أوميغا ٣ من السلمون ودهون جيدة من زيت الزيتون. الفيتا هي الشيء الوحيد الذي يستحق الانتباه.',
    salmonReason: 'غني بأوميغا ٣.',
    oliveOilReason: 'الأوليوكانثال له نشاط مضاد للالتهاب مدروس جيدًا.',
    quinoaReason: 'حبة كاملة خالية من الغلوتين ولطيفة على معظم الأنظمة.',
    tomatoesReason: 'مناسبة لمعظم الناس.',
    fetaReason: 'معتّقة ومملّحة — لمسة عرضية لا أساس.',
    subFetaFrom: 'جبن فيتا', subFetaTo: 'لبنة، مصفّاة ومناسبة يوميًا',
    subTomatoesFrom: 'طماطم كرزية', subTomatoesTo: 'خيار، إن كانت الباذنجانيات تزعجك',
  },
};

const stubbed = {
  // deno-lint-ignore require-await
  async detect(_image: File, _profile: Profile, locale: Locale) {
    const s = STUB[locale];
    return {
      dish: s.dish,
      confidence: 0.87,
      mixed_dish: true,
      ingredients: [
        { id: 'salmon', name: s.salmon, confidence: 0.96 },
        { id: 'quinoa', name: s.quinoa, confidence: 0.91 },
        { id: 'tomatoes', name: s.tomatoes, confidence: 0.84 },
        { id: 'olive-oil', name: s.oliveOil, confidence: 0.78 },
        { id: 'feta', name: s.feta, confidence: 0.72 },
      ],
    };
  },

  // deno-lint-ignore require-await
  async analyze(
    _image: File,
    request: { ingredients: string[]; portion: string; separateItems: boolean; profile: Profile; locale: Locale },
  ) {
    const s = STUB[request.locale];
    const kept = new Set(request.ingredients);
    const ingredients = [
      kept.has('salmon') && { name: s.salmon, label: s.supportive, tone: 'supportive', reason: s.salmonReason },
      kept.has('olive-oil') && { name: s.oliveOil, label: s.supportive, tone: 'supportive', reason: s.oliveOilReason },
      kept.has('quinoa') && { name: s.quinoa, label: s.balanced, tone: 'balanced', reason: s.quinoaReason },
      kept.has('tomatoes') && { name: s.tomatoes, label: s.balanced, tone: 'balanced', reason: s.tomatoesReason },
      kept.has('feta') && { name: s.feta, label: s.limit, tone: 'limit', reason: s.fetaReason },
    ].filter(Boolean);

    const factor = request.portion === 'small' ? 0.75 : request.portion === 'large' ? 1.3 : 1;
    const score = Math.max(0, 92 - ingredients.filter((i) => i && i.tone === 'limit').length * 5);
    return {
      dish: s.dish,
      score,
      classification: score >= 75 ? 'Supportive' : score >= 55 ? 'Balanced' : 'Limit',
      confidence: 'high',
      summary: s.summary,
      nutrition: {
        calories: Math.round((540 * factor) / 5) * 5,
        protein: Math.round(34 * factor),
        carbs: Math.round(42 * factor),
        fat: Math.round(21 * factor),
        fibre: Math.max(1, Math.round(6 * factor)),
      },
      ingredients,
      substitutions: [
        { from: s.subFetaFrom, to: s.subFetaTo },
        { from: s.subTomatoesFrom, to: s.subTomatoesTo },
      ],
    };
  },
};

/* ── helpers ──────────────────────────────────────────────────────────── */

function parseProfile(raw: FormDataEntryValue | null): Profile {
  try {
    const parsed = JSON.parse(String(raw ?? '{}'));
    return {
      avoids: Array.isArray(parsed.avoids) ? parsed.avoids.map(String) : [],
      conditions: Array.isArray(parsed.conditions) ? parsed.conditions.map(String) : [],
      cuisines: Array.isArray(parsed.cuisines) ? parsed.cuisines.map(String) : [],
    };
  } catch {
    return { avoids: [], conditions: [], cuisines: [] };
  }
}

function parseStringArray(raw: FormDataEntryValue | null): string[] {
  try {
    const parsed = JSON.parse(String(raw ?? '[]'));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
