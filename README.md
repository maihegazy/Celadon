# Celadon

A nutrition and wellness app for people living with autoimmune conditions, and
anyone following an anti-inflammatory way of eating. Personalised meal plans,
AI meal scanning from a photo, a Celadon Score for every meal, and progress
tracking that reads as observation rather than verdict.

Built with Expo (React Native + TypeScript) for iOS and Android, from the
approved design in `design/`.

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

## Structure

```
App.tsx                      root providers, font loading, safe-area frame
src/
  theme/                     colours, type, radii — lifted from the design
  components/                shared primitives (Text, Card, Chip, ScoreRing, TabBar…)
  screens/                   one file per screen
  navigation/                stack, route types, deep links
  state/AppState.tsx         single store: assessment answers, plan, diary, settings
  services/mealAnalysis/     analysis contract + stub and remote implementations
  data/                      content fixtures (meals, recipes, insights, copy)
design/                      the Claude Design handoff this was built from
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
and insights from the design. They're plain objects, ready to be replaced by
API responses.

## Design source

`design/` is the original Claude Design handoff — the prototype
(`design/project/Celadon App.dc.html`), its shared components, the conversation
that produced it (`design/chats/`), and the original handoff note
(`design/HANDOFF.md`). It stays in the repo as the reference for anything not
yet built; the app itself doesn't read from it.
