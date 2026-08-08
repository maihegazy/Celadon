-- Celadon — meal plans and the shopping list built from them.
--
-- Every table here carries `user_id` even where it could be reached through a
-- parent, so each RLS policy is a direct `auth.uid() = user_id` check rather
-- than a join. Cheaper to evaluate, and much easier to be sure about.

/* ── meal plans ───────────────────────────────────────────────────────── */

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Plans are weekly; the design's week runs Sunday to Saturday.
  week_start date not null,
  generated_at timestamptz not null default now(),
  -- "Why this week works", already localised when generated.
  rationale_en text,
  rationale_ar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists public.planned_meals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.meal_plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  scheduled_on date not null,
  slot public.meal_slot not null,
  position smallint not null default 0,
  recipe_id uuid references public.recipes (id) on delete set null,
  -- Free-text meals (a swap for something not in the catalogue) are allowed,
  -- so one of recipe_id / custom_name must be present.
  custom_name_en text,
  custom_name_ar text,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint planned_meals_has_subject
    check (recipe_id is not null or custom_name_en is not null)
);

create index if not exists planned_meals_user_date_idx
  on public.planned_meals (user_id, scheduled_on);
create index if not exists planned_meals_plan_idx on public.planned_meals (plan_id);

/* ── shopping list ────────────────────────────────────────────────────── */

create table if not exists public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid references public.meal_plans (id) on delete set null,
  week_start date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.grocery_lists (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  name_en text not null,
  name_ar text,
  quantity_en text,
  quantity_ar text,
  position smallint not null default 0,
  checked boolean not null default false,
  -- "I already have this" — hidden from the list without deleting history.
  dismissed boolean not null default false,
  -- Items the user typed in themselves.
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists grocery_items_list_idx on public.grocery_items (list_id);
create index if not exists grocery_items_user_idx on public.grocery_items (user_id);

/* ── row-level security ───────────────────────────────────────────────── */

alter table public.meal_plans enable row level security;
alter table public.planned_meals enable row level security;
alter table public.grocery_lists enable row level security;
alter table public.grocery_items enable row level security;

do $$
declare
  target text;
begin
  -- Same four policies on each personal table; writing them once keeps them
  -- from drifting apart.
  foreach target in array array[
    'meal_plans', 'planned_meals', 'grocery_lists', 'grocery_items'
  ]
  loop
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

drop trigger if exists meal_plans_set_updated_at on public.meal_plans;
create trigger meal_plans_set_updated_at before update on public.meal_plans
  for each row execute function public.set_updated_at();

drop trigger if exists grocery_lists_set_updated_at on public.grocery_lists;
create trigger grocery_lists_set_updated_at before update on public.grocery_lists
  for each row execute function public.set_updated_at();
