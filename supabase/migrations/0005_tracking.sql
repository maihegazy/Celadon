-- Celadon — what the user logs: scans, the food diary, check-ins, water and
-- the reintroduction tracker.
--
-- This is the most sensitive data in the app. Every table is RLS-locked to its
-- owner, and everything cascades from `auth.users` so deleting an account
-- really does erase it — the app promises that in writing.

/* ── meal scans ───────────────────────────────────────────────────────── */

create table if not exists public.meal_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Photos are analysed and discarded by default. This is only set when the
  -- user explicitly saves one; it points into a private storage bucket.
  image_path text,
  dish text not null,
  celadon_score smallint not null check (celadon_score between 0 and 100),
  classification public.celadon_classification not null,
  confidence public.analysis_confidence not null,
  summary text,
  /* Estimates from a photo — never presented as measurements. */
  calories integer check (calories >= 0),
  protein_g numeric(5, 1),
  carbs_g numeric(5, 1),
  fat_g numeric(5, 1),
  fibre_g numeric(5, 1),
  portion text not null default 'medium',
  separate_items boolean not null default false,
  -- The per-ingredient verdicts and suggested swaps, as returned by the
  -- analyser and already written in the user's language.
  ingredients jsonb not null default '[]'::jsonb,
  substitutions jsonb not null default '[]'::jsonb,
  locale public.app_language not null default 'en'
);

create index if not exists meal_scans_user_created_idx
  on public.meal_scans (user_id, created_at desc);

/* ── food diary ───────────────────────────────────────────────────────── */

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_on date not null,
  logged_at timestamptz not null default now(),
  slot public.meal_slot not null,
  source public.diary_source not null,
  recipe_id uuid references public.recipes (id) on delete set null,
  scan_id uuid references public.meal_scans (id) on delete set null,
  name text not null,
  portion text,
  calories integer check (calories >= 0),
  protein_g numeric(5, 1),
  carbs_g numeric(5, 1),
  fat_g numeric(5, 1),
  fibre_g numeric(5, 1),
  celadon_score smallint check (celadon_score between 0 and 100),
  created_at timestamptz not null default now()
);

create index if not exists diary_entries_user_day_idx
  on public.diary_entries (user_id, logged_on desc);

/* ── daily check-in ───────────────────────────────────────────────────── */

create table if not exists public.check_ins (
  user_id uuid not null references auth.users (id) on delete cascade,
  checked_on date not null,
  /* Each scale is 0–4, matching the five taps in the design. */
  energy smallint check (energy between 0 and 4),
  digestion smallint check (digestion between 0 and 4),
  sleep smallint check (sleep between 0 and 4),
  stress smallint check (stress between 0 and 4),
  joint_comfort smallint check (joint_comfort between 0 and 4),
  overall smallint check (overall between 0 and 4),
  flare boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, checked_on)
);

comment on table public.check_ins is
  'Self-reported, and treated as observation only. Nothing here is a diagnosis.';

create table if not exists public.water_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_on date not null,
  glasses smallint not null default 0 check (glasses between 0 and 20),
  updated_at timestamptz not null default now(),
  primary key (user_id, logged_on)
);

/* ── reintroduction tracker ───────────────────────────────────────────── */

do $$
begin
  if not exists (select 1 from pg_type where typname = 'reintroduction_status') then
    create type public.reintroduction_status as enum
      ('queued', 'testing', 'passed', 'reacted', 'paused');
  end if;
end
$$;

create table if not exists public.reintroductions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  food_slug text references public.foods (slug) on delete set null,
  name_en text not null,
  name_ar text not null,
  -- Foods are reintroduced in stages; stage 1 first, and only one at a time.
  stage smallint not null default 1,
  status public.reintroduction_status not null default 'queued',
  trial_days smallint not null default 5 check (trial_days > 0),
  started_on date,
  finished_on date,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reintroductions_user_idx on public.reintroductions (user_id, stage, position);

create table if not exists public.reintroduction_checks (
  id uuid primary key default gen_random_uuid(),
  reintroduction_id uuid not null references public.reintroductions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  day_index smallint not null check (day_index >= 1),
  checked_on date not null,
  felt_fine boolean not null,
  note text,
  created_at timestamptz not null default now(),
  unique (reintroduction_id, day_index)
);

/* ── row-level security ───────────────────────────────────────────────── */

do $$
declare
  target text;
begin
  foreach target in array array[
    'meal_scans', 'diary_entries', 'check_ins', 'water_logs',
    'reintroductions', 'reintroduction_checks'
  ]
  loop
    execute format('alter table public.%I enable row level security', target);

    execute format('drop policy if exists %I on public.%I', target || '_select_own', target);
    execute format(
      'create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)',
      target || '_select_own', target);

    execute format('drop policy if exists %I on public.%I', target || '_insert_own', target);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (auth.uid() = user_id)',
      target || '_insert_own', target);

    execute format('drop policy if exists %I on public.%I', target || '_update_own', target);
    execute format(
      'create policy %I on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      target || '_update_own', target);

    execute format('drop policy if exists %I on public.%I', target || '_delete_own', target);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (auth.uid() = user_id)',
      target || '_delete_own', target);

    execute format('grant select, insert, update, delete on public.%I to authenticated', target);
  end loop;
end
$$;

drop trigger if exists check_ins_set_updated_at on public.check_ins;
create trigger check_ins_set_updated_at before update on public.check_ins
  for each row execute function public.set_updated_at();

drop trigger if exists water_logs_set_updated_at on public.water_logs;
create trigger water_logs_set_updated_at before update on public.water_logs
  for each row execute function public.set_updated_at();

drop trigger if exists reintroductions_set_updated_at on public.reintroductions;
create trigger reintroductions_set_updated_at before update on public.reintroductions
  for each row execute function public.set_updated_at();
