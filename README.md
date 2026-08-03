# Celadon

A nutrition and wellness app for people living with autoimmune conditions, and
anyone following an anti-inflammatory way of eating. Personalised meal plans,
AI meal scanning from a photo, a Celadon Score for every meal, and progress
tracking that reads as observation rather than verdict.

Built with Expo (React Native + TypeScript) for iOS and Android, from the
approved design in `design/`. Fully bilingual — English and Arabic, with a
right-to-left layout.

## Running it

```bash
npm install
npm start          # then scan the QR code with Expo Go
npm run ios        # or press "i" in the Expo CLI
npm run android    # or press "a"
npm run typecheck  # tsc --noEmit
```

`npm run web` also works and is handy for reviewing layout in a browser,
though the camera path is device-only.

## Accounts and data

Auth and storage run on **Supabase** — Postgres plus an auth service, on a free
tier that covers 50k monthly active users and 500MB of database. Why it fits
this app in particular:

- **Row-level security.** Health data needs per-user isolation enforced by the
  database, not by application code that might forget. Every policy in
  `supabase/migrations/` is `auth.uid() = id`; there is no policy under which
  one account can read another's rows.
- **Postgres, not documents.** Meal plans, diary entries and check-ins are
  relational and will want joins and date-range queries as the app grows.
- **Auth included.** Email/password, Apple and Google, password reset and
  refresh-token handling, without a second vendor or a server to run.
- **An exit.** It's open source and self-hostable, which matters if data
  residency in Egypt or the Gulf becomes a requirement for health data.

Firebase was the alternative; Firestore's data model is the weaker fit here and
per-user isolation ends up spread across security rules that are harder to
audit than four SQL policies.

### Setting it up

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. Run `supabase/migrations/0001_profiles.sql` in the SQL editor — it creates
   the `profiles` table, its RLS policies, and a trigger that gives every new
   account an empty profile.
3. Copy `.env.example` to `.env` and fill in the project URL and **anon** key
   from Project Settings → API. The anon key is meant to ship in the app; the
   service-role key must never appear in this repo.
4. Optional — deploy the account-deletion function:
   `supabase functions deploy delete-account`. Deleting an auth user needs the
   service-role key, so it can't happen from the client.
5. Optional — enable Apple and Google in Authentication → Providers, and add
   `celadon://auth/callback` to the allowed redirect URLs.

Email confirmation is on by default in Supabase. The app handles both settings:
with it on, sign-up shows a "check your inbox" state; with it off, sign-up
signs you straight in.

**Without credentials the app still runs.** `LocalAuthService` and
`LocalProfileRepository` keep accounts and answers on the device so the flows
stay walkable, and the sign-in screen says so. That fallback stores passwords
as given and is a development convenience only — never point it at real users.

## Meal analysis

The scan flow talks to a `MealAnalysisService` (`src/services/mealAnalysis/`)
with two steps — `detect` (what's on the plate, with per-ingredient
confidence) and `analyze` (Celadon Score, classification, macros, reasoning).

Two implementations ship:

| Implementation              | When it's used                                      |
| --------------------------- | --------------------------------------------------- |
| `StubMealAnalysisService`   | Default. Runs on-device, returns the design's reference plate, and covers the failure path. |
| `RemoteMealAnalysisService` | Used when `EXPO_PUBLIC_MEAL_ANALYSIS_URL` is set. Uploads the photo as multipart form data. |

```bash
# .env
EXPO_PUBLIC_MEAL_ANALYSIS_URL=https://api.example.com/v1/meals
EXPO_PUBLIC_MEAL_ANALYSIS_TOKEN=…       # optional bearer token
```

The backend is expected to expose `POST /detect` and `POST /analyze`; the
request and response shapes are documented in
`src/services/mealAnalysis/RemoteMealAnalysisService.ts`. Screens only ever
see the types in `types.ts`, so swapping models changes nothing above the
service layer.

Camera capture uses `expo-camera` and gallery picks use `expo-image-picker`,
both behind a priming dialog that explains the ask before the OS prompt.

## Languages

The app ships in English and Arabic. It opens in the device language on first
launch, and the choice is changeable any time from Profile → Language and
remembered after that.

Switching is **instant** — no restart. Direction comes from the i18n context
(`row` flips to `row-reverse`, text alignment follows the language) rather than
from `I18nManager.forceRTL`, which would require relaunching the app and
behaves differently across platforms. Everything mirrors: rows, headers, the
tab bar, chevrons, progress bars and the week strip.

Adding or editing copy:

```
src/i18n/en.ts     source catalogue — add the key here first
src/i18n/ar.ts     typed against en.ts, so a missing key is a compile error
src/i18n/index.tsx provider, t/tp/n helpers, direction tokens
```

```tsx
const { t, tp, n, row, isRTL } = useI18n();

t('home.greeting')                          // plain lookup
t('recipe.calTotal', { calories: 540 })     // {{placeholder}} interpolation
tp('grocery.subtitle', count)               // plural forms (Arabic has six)
n(1560)                                     // ١٬٥٦٠ under Arabic
```

Notes for whoever edits the Arabic:

- Numerals are Arabic-Indic (٠١٢٣٤٥٦٧٨٩), as the design specified. Any number
  rendered inside Arabic copy goes through `n()`.
- Actions use nominal forms (`إضافة`, `استبدال`) rather than imperatives, so the
  copy doesn't address the reader as male or female. The design's preview used
  feminine imperatives; those were adapted so the app reads correctly for
  everyone. Worth a review pass by a native copywriter before launch.
- Content fixtures in `src/data/` hold translation keys, not text — a dish is
  `meal.molokhia`, which renders as "Molokhia with grilled chicken" or
  "ملوخية بالدجاج المشوي".
- The analysis service takes a `locale` and returns results already written in
  that language, so scan results are localised too.

## Structure

```
App.tsx                      root providers, font loading, safe-area frame
src/
  theme/                     colours, type, radii — lifted from the design
  components/                shared primitives (Text, Card, Chip, ScoreRing, TabBar…)
  screens/                   one file per screen
  navigation/                stack, route types, deep links
  state/AppState.tsx         single store: assessment answers, plan, diary, settings
  services/auth/             auth contract + Supabase and local implementations
  services/profile/          per-user health profile storage
  services/mealAnalysis/     analysis contract + stub and remote implementations
  i18n/                      en/ar catalogues, provider, direction tokens
  data/                      content fixtures (meals, recipes, insights) as keys
design/                      the Claude Design handoff this was built from
supabase/migrations/         SQL schema and row-level security policies
supabase/functions/          edge functions (account deletion)
```

Deep links follow the route table in `src/navigation/RootNavigator.tsx` —
`celadon://plan`, `celadon://scan`, `celadon://check-in`, and so on — so a
meal reminder can open the right screen.

## Things worth knowing before you change anything

**Gentle mode is not a cosmetic toggle.** `comfort` in `AppState` decides
whether calories, macros and weight appear anywhere in the app. Read
`numbersOn` from `useAppState()` rather than rendering numbers directly, or
they'll leak into a mode built for people in eating-disorder recovery.

**Photo-derived numbers are always labelled as estimates.** Every surface that
shows calories or portions from a scan says so. That wording is a product
commitment, not filler.

**The app never diagnoses.** Copy throughout describes patterns and
observations. Correlations on the Progress screen are framed as things worth
watching, never as findings — and the doctor report says the same in writing.

**Food photography is stubbed.** `<Hatch>` stands in for imagery everywhere a
photo will eventually go. Replacing it with `<Image>` is a per-call-site swap;
sizes and radii already match the design.

**Content is fixtures.** `src/data/` holds the meals, recipes, shopping list
and insights from the design, as translation keys. They're plain objects, ready
to be replaced by API responses.

**Auth errors are translated, not passed through.** `AuthService` returns a
translation key rather than a provider message, so a failed sign-in reads the
same way in Arabic as in English and doesn't leak vendor wording.

**Sign-out keeps device state.** `dispatch({ type: 'signOut' })` clears the
account's answers but leaves `permissionsSeen` alone — the OS prompts were
answered by the device, not the account.

**No hardcoded copy.** Every user-visible string — including accessibility
labels — goes through `t()`. Adding a literal to a screen breaks the Arabic
build silently, so add the key to `en.ts` first and let the type system ask for
the translation.

## Design source

`design/` is the original Claude Design handoff — the prototype
(`design/project/Celadon App.dc.html`), its shared components, the conversation
that produced it (`design/chats/`), and the original handoff note
(`design/HANDOFF.md`). It stays in the repo as the reference for anything not
yet built; the app itself doesn't read from it.

One deliberate departure: the design included an Arabic *preview* screen with
four sample surfaces. That's been replaced by real localisation — the whole app
speaks Arabic — and the Language row in Profile now opens a picker rather than
the preview.
