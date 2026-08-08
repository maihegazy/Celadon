-- Celadon — server-side scan quota.
--
-- The free tier includes a few meal scans per week. The count must live
-- server-side: a client-held counter can be reset by reinstalling, and the
-- analysis endpoint is the thing that costs money. The analyze-meal edge
-- function (service role) is the only writer; clients can read their own
-- usage but never change it — the same posture as `subscriptions`.

create table if not exists public.scan_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Week of the scan, Sunday-based to match the app's week.
  week_start date not null,
  scans_used smallint not null default 0 check (scans_used >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

comment on table public.scan_usage is
  'Free-tier scan counting. Written only by the analyze-meal edge function.';

alter table public.scan_usage enable row level security;

-- Readable so the app can show "1 free scan left"; writable by no client.
drop policy if exists "scan_usage_select_own" on public.scan_usage;
create policy "scan_usage_select_own" on public.scan_usage
  for select to authenticated using (auth.uid() = user_id);

grant select on public.scan_usage to authenticated;

drop trigger if exists scan_usage_set_updated_at on public.scan_usage;
create trigger scan_usage_set_updated_at before update on public.scan_usage
  for each row execute function public.set_updated_at();
