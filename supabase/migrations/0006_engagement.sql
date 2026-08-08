-- Celadon — notifications, subscription state, and push registrations.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_kind') then
    create type public.notification_kind as enum
      ('meal_reminder', 'shopping', 'weekly_review', 'new_recipe', 'plan_tweak');
  end if;

  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum
      ('free', 'trialing', 'active', 'canceled', 'expired');
  end if;

  if not exists (select 1 from pg_type where typname = 'subscription_plan') then
    create type public.subscription_plan as enum ('monthly', 'annual');
  end if;
end
$$;

/* ── notifications ────────────────────────────────────────────────────── */

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind public.notification_kind not null,
  -- Composed per user, so already in their language when written.
  locale public.app_language not null default 'en',
  title text not null,
  body text not null,
  -- Where tapping it should land, e.g. celadon://plan.
  deep_link text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  -- Set when cleared from the notification centre; keeps the audit trail.
  dismissed_at timestamptz
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (user_id) where read_at is null;

/* ── subscriptions ────────────────────────────────────────────────────── */

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status public.subscription_status not null default 'free',
  plan public.subscription_plan,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  -- Billing happens in the App Store or Play, never here.
  store text check (store in ('app_store', 'play_store')),
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscriptions is
  'Mirror of store-side billing state. Purchases are verified server-side before this is written.';

/* ── push registrations ───────────────────────────────────────────────── */

create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  locale public.app_language not null default 'en',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists push_devices_user_idx on public.push_devices (user_id);

/* ── row-level security ───────────────────────────────────────────────── */

do $$
declare
  target text;
begin
  foreach target in array array['notifications', 'subscriptions', 'push_devices']
  loop
    execute format('alter table public.%I enable row level security', target);

    execute format('drop policy if exists %I on public.%I', target || '_select_own', target);
    execute format(
      'create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)',
      target || '_select_own', target);

    execute format('drop policy if exists %I on public.%I', target || '_update_own', target);
    execute format(
      'create policy %I on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      target || '_update_own', target);

    execute format('grant select, update on public.%I to authenticated', target);
  end loop;
end
$$;

-- Devices register themselves, so the client needs insert and delete here.
-- Notifications and subscriptions are written server-side only: a client that
-- could insert its own subscription row could grant itself Premium.
drop policy if exists "push_devices_insert_own" on public.push_devices;
create policy "push_devices_insert_own" on public.push_devices
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "push_devices_delete_own" on public.push_devices;
create policy "push_devices_delete_own" on public.push_devices
  for delete to authenticated using (auth.uid() = user_id);

grant insert, delete on public.push_devices to authenticated;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
