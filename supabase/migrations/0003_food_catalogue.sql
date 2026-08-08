-- Celadon — the shared food and recipe catalogue.
--
-- Unlike everything else in this schema, these rows belong to the app rather
-- than to a user: every signed-in account reads the same recipes. So they're
-- readable by all authenticated users and writable only by the service role —
-- there is no policy that lets a client insert a recipe.
--
-- Every name and body carries an `_en` and `_ar` column. The app is bilingual;
-- a catalogue that only speaks English would quietly break half of it.

/* ── foods ────────────────────────────────────────────────────────────── */

create table if not exists public.foods (
  slug text primary key,
  name_en text not null,
  name_ar text not null,
  note_en text,
  note_ar text,
  -- 0–100, how well the food supports an anti-inflammatory pattern.
  celadon_score smallint check (celadon_score between 0 and 100),
  tone public.ingredient_tone not null default 'balanced',
  category text,
  /* Per 100g, for the compare view. All estimates. */
  calories_per_100g numeric(6, 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.foods is
  'Ingredient reference used by Explore, food comparison and scan explanations.';

create index if not exists foods_category_idx on public.foods (category);

/* ── recipes ──────────────────────────────────────────────────────────── */

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ar text not null,
  blurb_en text,
  blurb_ar text,
  -- Why this recipe suits an anti-inflammatory pattern, in plain language.
  why_en text,
  why_ar text,
  minutes smallint not null check (minutes > 0),
  base_servings smallint not null default 2 check (base_servings > 0),
  celadon_score smallint not null check (celadon_score between 0 and 100),
  classification public.celadon_classification not null,
  /* Per serving. Labelled as estimates wherever they're shown. */
  calories integer check (calories >= 0),
  protein_g numeric(5, 1),
  carbs_g numeric(5, 1),
  fat_g numeric(5, 1),
  fibre_g numeric(5, 1),
  cuisine text,
  tags text[] not null default '{}',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_tags_idx on public.recipes using gin (tags);
create index if not exists recipes_cuisine_idx on public.recipes (cuisine);
create index if not exists recipes_minutes_idx on public.recipes (minutes);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  position smallint not null,
  -- Optional link to the catalogue; free-text ingredients are fine too.
  food_slug text references public.foods (slug) on delete set null,
  name_en text not null,
  name_ar text not null,
  -- Quantity for `recipes.base_servings`; the app scales it with the stepper.
  quantity numeric(8, 2),
  unit_en text,
  unit_ar text,
  tone public.ingredient_tone not null default 'balanced',
  unique (recipe_id, position)
);

create table if not exists public.recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  position smallint not null,
  text_en text not null,
  text_ar text not null,
  unique (recipe_id, position)
);

create table if not exists public.recipe_substitutions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  from_en text not null,
  from_ar text not null,
  to_en text not null,
  to_ar text not null
);

/* ── saved recipes (personal) ─────────────────────────────────────────── */

create table if not exists public.saved_recipes (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

/* ── row-level security ───────────────────────────────────────────────── */

alter table public.foods enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.recipe_substitutions enable row level security;
alter table public.saved_recipes enable row level security;

-- Catalogue: readable by any signed-in account, writable by none of them.
-- The service role bypasses RLS, which is how content gets in.
drop policy if exists "foods_read" on public.foods;
create policy "foods_read" on public.foods for select to authenticated using (true);

drop policy if exists "recipes_read" on public.recipes;
create policy "recipes_read" on public.recipes for select to authenticated using (true);

drop policy if exists "recipe_ingredients_read" on public.recipe_ingredients;
create policy "recipe_ingredients_read" on public.recipe_ingredients for select to authenticated using (true);

drop policy if exists "recipe_steps_read" on public.recipe_steps;
create policy "recipe_steps_read" on public.recipe_steps for select to authenticated using (true);

drop policy if exists "recipe_substitutions_read" on public.recipe_substitutions;
create policy "recipe_substitutions_read" on public.recipe_substitutions for select to authenticated using (true);

-- Saved recipes are personal: yours only, in every direction.
drop policy if exists "saved_recipes_select_own" on public.saved_recipes;
create policy "saved_recipes_select_own" on public.saved_recipes
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "saved_recipes_insert_own" on public.saved_recipes;
create policy "saved_recipes_insert_own" on public.saved_recipes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "saved_recipes_delete_own" on public.saved_recipes;
create policy "saved_recipes_delete_own" on public.saved_recipes
  for delete to authenticated using (auth.uid() = user_id);

drop trigger if exists foods_set_updated_at on public.foods;
create trigger foods_set_updated_at before update on public.foods
  for each row execute function public.set_updated_at();

drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at before update on public.recipes
  for each row execute function public.set_updated_at();

grant select on public.foods, public.recipes, public.recipe_ingredients,
  public.recipe_steps, public.recipe_substitutions to authenticated;
grant select, insert, delete on public.saved_recipes to authenticated;
