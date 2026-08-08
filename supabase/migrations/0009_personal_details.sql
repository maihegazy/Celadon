-- Celadon — the optional personal details from the "About you" step.
--
-- Every column here is nullable on purpose: the step is skippable in full,
-- and an absent answer is an answer. Nothing below is required for the app
-- to work — these refine portion and energy estimates, no more.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_sex') then
    create type public.profile_sex as enum ('female', 'male', 'other', 'prefer_not_to_say');
  end if;
end
$$;

alter table public.profiles
  add column if not exists birth_date date
    check (birth_date is null or birth_date >= date '1900-01-01'),
  add column if not exists sex public.profile_sex,
  -- Bounds are sanity checks against typos, not judgments.
  add column if not exists height_cm numeric(5, 1)
    check (height_cm is null or height_cm between 50 and 250),
  add column if not exists weight_kg numeric(5, 1)
    check (weight_kg is null or weight_kg between 20 and 350);

comment on column public.profiles.birth_date is
  'Optional. Refines energy estimates; never shown back as an age.';
comment on column public.profiles.sex is
  'Optional, self-reported, includes prefer_not_to_say. Informs content only.';
comment on column public.profiles.weight_kg is
  'Optional. Hidden everywhere — including the asking screen — in gentle mode.';
