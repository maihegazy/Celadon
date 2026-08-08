-- Celadon — shared enums, and the profile as typed columns.
--
-- 0001 stored the whole assessment as one JSON blob. That was fine for getting
-- sign-up working, but the answers drive meal planning and analytics, so they
-- become real columns here: typed, constrained and queryable ("how many users
-- avoid nightshades?" shouldn't need a JSON scan).

/* ── enums ────────────────────────────────────────────────────────────── */

do $$
begin
  if not exists (select 1 from pg_type where typname = 'meal_slot') then
    create type public.meal_slot as enum ('breakfast', 'lunch', 'dinner', 'snack');
  end if;

  -- How well a meal supports an anti-inflammatory pattern.
  if not exists (select 1 from pg_type where typname = 'celadon_classification') then
    create type public.celadon_classification as enum ('supportive', 'balanced', 'limit');
  end if;

  -- Per-ingredient verdict. `flagged` means "on this user's avoid list",
  -- which is personal; `limit` is a property of the food itself.
  if not exists (select 1 from pg_type where typname = 'ingredient_tone') then
    create type public.ingredient_tone as enum ('supportive', 'balanced', 'flagged', 'limit');
  end if;

  -- Whether numbers are shown at all. `gentle` exists for people in
  -- eating-disorder recovery and must be respected everywhere.
  if not exists (select 1 from pg_type where typname = 'comfort_mode') then
    create type public.comfort_mode as enum ('full', 'gentle', 'minimal');
  end if;

  if not exists (select 1 from pg_type where typname = 'app_language') then
    create type public.app_language as enum ('en', 'ar');
  end if;

  if not exists (select 1 from pg_type where typname = 'activity_level') then
    create type public.activity_level as enum ('seated', 'light', 'high');
  end if;

  if not exists (select 1 from pg_type where typname = 'weight_goal') then
    create type public.weight_goal as enum ('maintain', 'gentle_loss', 'unset');
  end if;

  if not exists (select 1 from pg_type where typname = 'diary_source') then
    create type public.diary_source as enum ('scan', 'manual', 'plan');
  end if;

  if not exists (select 1 from pg_type where typname = 'analysis_confidence') then
    create type public.analysis_confidence as enum ('high', 'medium', 'low');
  end if;
end
$$;

/* ── shared helpers ───────────────────────────────────────────────────── */

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

/* ── profiles ─────────────────────────────────────────────────────────── */

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists language public.app_language not null default 'en',
  add column if not exists country text,
  add column if not exists goal text,
  add column if not exists activity public.activity_level not null default 'light',
  -- The four options the assessment offers, as slugs. A plain count would
  -- lose the distinction between "3 meals" and "3 + snacks", which changes
  -- how the plan is built.
  add column if not exists meal_pattern text not null default 'three',
  add column if not exists weight_goal public.weight_goal not null default 'unset',
  add column if not exists comfort public.comfort_mode not null default 'full',
  -- Multi-selects, as slugs. Arrays keep the profile a single row while
  -- staying queryable through the GIN indexes below.
  add column if not exists conditions text[] not null default '{}',
  add column if not exists concerns text[] not null default '{}',
  add column if not exists avoids text[] not null default '{}',
  add column if not exists cuisines text[] not null default '{}',
  add column if not exists onboarding_complete boolean not null default false;

-- Carry over anything written while the profile was a JSON blob, then retire
-- it. Guarded so the whole migration stays safe to re-run.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'assessment'
  ) then
    update public.profiles
    set onboarding_complete = coalesce((assessment ->> 'onboardingComplete')::boolean, false)
    where assessment ? 'onboardingComplete'
      and onboarding_complete = false;

    alter table public.profiles drop column assessment;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_meal_pattern_known'
  ) then
    alter table public.profiles
      add constraint profiles_meal_pattern_known
      check (meal_pattern in ('two', 'three', 'three_plus_snacks', 'four_five_small'));
  end if;
end
$$;

create index if not exists profiles_avoids_idx on public.profiles using gin (avoids);
create index if not exists profiles_conditions_idx on public.profiles using gin (conditions);
create index if not exists profiles_cuisines_idx on public.profiles using gin (cuisines);

comment on column public.profiles.goal is
  'Primary goal, as a slug (calm_inflammation, autoimmune, energy, weight, eat_better).';
comment on column public.profiles.country is
  'Where the user is based, as a slug — drives which regional dishes are planned.';
comment on column public.profiles.avoids is
  'Foods to plan around, as slugs (gluten, nightshades, …). Not medical advice — the user chose these.';
comment on column public.profiles.comfort is
  'gentle/minimal hide calories and weights app-wide. Treat as a hard constraint.';

-- Grants are declared rather than inherited: Supabase sets permissive
-- defaults on `public`, but a schema that only works because of them is a
-- schema that breaks on a self-hosted instance.
grant select, insert, update, delete on public.profiles to authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
