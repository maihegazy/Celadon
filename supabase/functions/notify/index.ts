// Celadon — notification composer and push sender.
//
//   POST /notify   body: { "kind": "meal_reminder" | "weekly_review" | "shopping" }
//
// Runs on a schedule (pg_cron → pg_net, see supabase/CRON.md) and is the only
// writer of the `notifications` table. Each run:
//
//   1. finds the users the given kind currently applies to,
//   2. inserts one notification per user, composed in their language,
//   3. sends a push to each of their registered Expo devices.
//
// Every kind is idempotent per period — a user gets at most one meal reminder
// per day, one weekly review per week, one shopping nudge per day — so an
// extra or repeated trigger composes nothing and sends nothing. That is what
// makes it safe to expose behind the anon-key gateway the scheduler uses.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Locale = 'en' | 'ar';
type Kind = 'meal_reminder' | 'weekly_review' | 'shopping';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const PUSH_CHUNK = 100;

/** Composed per user, in their profile language. */
const COPY = {
  meal_reminder: {
    en: {
      title: 'Lunch is coming up',
      body: (dish: string) => `${dish} is on your plan today. A calm half hour is all it needs.`,
    },
    ar: {
      title: 'اقترب موعد الغداء',
      body: (dish: string) => `${dish} على خطتك اليوم. نصف ساعة هادئة تكفي.`,
    },
  },
  weekly_review: {
    en: {
      title: 'Your week in review',
      body: (count: number) =>
        `${count} check-in${count === 1 ? '' : 's'} logged last week. Your trends are ready when you are.`,
    },
    ar: {
      title: 'أسبوعك في سطور',
      body: (count: number) => `سجّلت ${count} من المتابعات الأسبوع الماضي. اتجاهاتك جاهزة متى شئت.`,
    },
  },
  shopping: {
    en: {
      title: 'Shopping reminder',
      body: (count: number) =>
        `${count} item${count === 1 ? '' : 's'} left on this week's list. It's ready when you are.`,
    },
    ar: {
      title: 'تذكير التسوّق',
      body: (count: number) => `تبقّى ${count} من العناصر على قائمة هذا الأسبوع. القائمة جاهزة متى شئت.`,
    },
  },
} as const;

type Draft = { userId: string; locale: Locale; title: string; body: string; deepLink: string };

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let kind: Kind;
  try {
    const body = await request.json();
    kind = body.kind;
  } catch {
    return json({ error: 'expected_json_body' }, 400);
  }
  if (kind !== 'meal_reminder' && kind !== 'weekly_review' && kind !== 'shopping') {
    return json({ error: 'unknown_kind' }, 400);
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const drafts =
      kind === 'meal_reminder'
        ? await draftMealReminders(admin)
        : kind === 'weekly_review'
          ? await draftWeeklyReviews(admin)
          : await draftShoppingReminders(admin);

    // Idempotency: drop drafts for users already notified this period.
    const since = kind === 'weekly_review' ? daysAgoISO(6) : todayStartISO();
    const fresh = await withoutAlreadyNotified(admin, kind, drafts, since);

    if (fresh.length > 0) {
      const { error } = await admin.from('notifications').insert(
        fresh.map((draft) => ({
          user_id: draft.userId,
          kind,
          locale: draft.locale,
          title: draft.title,
          body: draft.body,
          deep_link: draft.deepLink,
        })),
      );
      if (error) throw error;
    }

    const pushed = await sendPushes(admin, fresh);
    return json({ kind, composed: fresh.length, pushed }, 200);
  } catch (error) {
    console.error(`notify ${kind} failed:`, error);
    return json({ error: 'compose_failed' }, 500);
  }
});

/* ── drafts per kind ──────────────────────────────────────────────────── */

/** Users with an uncompleted planned lunch today get a reminder naming it. */
async function draftMealReminders(admin: SupabaseClient): Promise<Draft[]> {
  const { data, error } = await admin
    .from('planned_meals')
    .select('user_id, custom_name_en, custom_name_ar')
    .eq('scheduled_on', todayISO())
    .eq('slot', 'lunch')
    .eq('completed', false);
  if (error) throw error;

  const locales = await localesFor(admin, (data ?? []).map((row) => row.user_id));
  return (data ?? []).map((row) => {
    const locale = locales.get(row.user_id) ?? 'en';
    const dish =
      locale === 'ar' ? (row.custom_name_ar ?? row.custom_name_en) : row.custom_name_en;
    return {
      userId: row.user_id,
      locale,
      title: COPY.meal_reminder[locale].title,
      body: COPY.meal_reminder[locale].body(dish ?? ''),
      deepLink: 'celadon://plan',
    };
  });
}

/** Users who checked in at least once in the past 7 days get a review nudge. */
async function draftWeeklyReviews(admin: SupabaseClient): Promise<Draft[]> {
  const { data, error } = await admin
    .from('check_ins')
    .select('user_id')
    .gte('checked_on', daysAgoISO(7).slice(0, 10));
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  }

  const locales = await localesFor(admin, [...counts.keys()]);
  return [...counts.entries()].map(([userId, count]) => {
    const locale = locales.get(userId) ?? 'en';
    return {
      userId,
      locale,
      title: COPY.weekly_review[locale].title,
      body: COPY.weekly_review[locale].body(count),
      deepLink: 'celadon://progress',
    };
  });
}

/** Users with unchecked items on this week's list get a count. */
async function draftShoppingReminders(admin: SupabaseClient): Promise<Draft[]> {
  const { data: lists, error } = await admin
    .from('grocery_lists')
    .select('id, user_id')
    .eq('week_start', weekStartISO());
  if (error) throw error;
  if (!lists || lists.length === 0) return [];

  const { data: items, error: itemsError } = await admin
    .from('grocery_items')
    .select('list_id')
    .in('list_id', lists.map((list) => list.id))
    .eq('checked', false)
    .eq('dismissed', false);
  if (itemsError) throw itemsError;

  const remaining = new Map<string, number>();
  for (const item of items ?? []) {
    remaining.set(item.list_id, (remaining.get(item.list_id) ?? 0) + 1);
  }

  const withItems = lists.filter((list) => (remaining.get(list.id) ?? 0) > 0);
  const locales = await localesFor(admin, withItems.map((list) => list.user_id));
  return withItems.map((list) => {
    const locale = locales.get(list.user_id) ?? 'en';
    const count = remaining.get(list.id) ?? 0;
    return {
      userId: list.user_id,
      locale,
      title: COPY.shopping[locale].title,
      body: COPY.shopping[locale].body(count),
      deepLink: 'celadon://grocery',
    };
  });
}

/* ── shared helpers ───────────────────────────────────────────────────── */

async function localesFor(admin: SupabaseClient, userIds: string[]): Promise<Map<string, Locale>> {
  if (userIds.length === 0) return new Map();
  const { data, error } = await admin
    .from('profiles')
    .select('id, language')
    .in('id', [...new Set(userIds)]);
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row.language === 'ar' ? 'ar' : 'en']));
}

async function withoutAlreadyNotified(
  admin: SupabaseClient,
  kind: Kind,
  drafts: Draft[],
  sinceISO: string,
): Promise<Draft[]> {
  if (drafts.length === 0) return drafts;
  const { data, error } = await admin
    .from('notifications')
    .select('user_id')
    .eq('kind', kind)
    .gte('created_at', sinceISO)
    .in('user_id', drafts.map((draft) => draft.userId));
  if (error) throw error;
  const notified = new Set((data ?? []).map((row) => row.user_id));
  return drafts.filter((draft) => !notified.has(draft.userId));
}

/** Sends via the Expo push service; prunes tokens Expo reports as dead. */
async function sendPushes(admin: SupabaseClient, drafts: Draft[]): Promise<number> {
  if (drafts.length === 0) return 0;

  const byUser = new Map(drafts.map((draft) => [draft.userId, draft]));
  const { data: devices, error } = await admin
    .from('push_devices')
    .select('token, user_id')
    .in('user_id', [...byUser.keys()]);
  if (error) throw error;
  if (!devices || devices.length === 0) return 0;

  const messages = devices.map((device) => {
    const draft = byUser.get(device.user_id)!;
    return {
      to: device.token,
      title: draft.title,
      body: draft.body,
      data: { deepLink: draft.deepLink },
    };
  });

  let sent = 0;
  for (let i = 0; i < messages.length; i += PUSH_CHUNK) {
    const chunk = messages.slice(i, i + PUSH_CHUNK);
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk),
    });
    if (!response.ok) {
      console.error('expo push rejected chunk:', await response.text());
      continue;
    }
    const { data: tickets } = (await response.json()) as {
      data?: { status: string; details?: { error?: string } }[];
    };
    for (const [index, ticket] of (tickets ?? []).entries()) {
      if (ticket.status === 'ok') {
        sent += 1;
      } else if (ticket.details?.error === 'DeviceNotRegistered') {
        // The app was uninstalled or the token rotated — stop sending to it.
        await admin.from('push_devices').delete().eq('token', chunk[index].to);
      }
    }
  }
  return sent;
}

/* ── dates (UTC — cron picks hours that suit Cairo/Gulf mornings) ─────── */

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function todayStartISO(): string {
  return `${todayISO()}T00:00:00Z`;
}

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/** Sunday-based, matching the app's week. */
function weekStartISO(now = new Date()): string {
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - now.getUTCDay());
  return start.toISOString().slice(0, 10);
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
