-- Celadon — derived views, the sign-up trigger, and the photo bucket.

/* ── new accounts ─────────────────────────────────────────────────────── */

-- Replaces the version in 0001: a new account now also gets a subscription
-- row, so the paywall never has to reason about a missing record.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, status)
  values (new.id, 'free')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

/* ── derived views ────────────────────────────────────────────────────── */

-- Views run with the caller's privileges (security_invoker), so the RLS on the
-- underlying tables still applies and a user only ever sees their own days.
create or replace view public.daily_totals
with (security_invoker = true)
as
select
  d.user_id,
  d.logged_on,
  count(*)::int                       as entries,
  sum(d.calories)::int                as calories,
  sum(d.protein_g)                    as protein_g,
  sum(d.carbs_g)                      as carbs_g,
  sum(d.fat_g)                        as fat_g,
  sum(d.fibre_g)                      as fibre_g,
  round(avg(d.celadon_score))::int    as celadon_score
from public.diary_entries d
group by d.user_id, d.logged_on;

comment on view public.daily_totals is
  'Per-day diary roll-up. Values are estimates, as everything photo-derived is.';

-- Free tier allows three scans a week; this is what the scan screen counts.
create or replace view public.weekly_scan_usage
with (security_invoker = true)
as
select
  s.user_id,
  date_trunc('week', s.created_at)::date as week_start,
  count(*)::int                          as scans
from public.meal_scans s
group by s.user_id, date_trunc('week', s.created_at);

grant select on public.daily_totals, public.weekly_scan_usage to authenticated;

/* ── meal photo storage (optional) ────────────────────────────────────── */

-- Photos are analysed and discarded by default. The bucket exists only for
-- the case where a user chooses to keep one, and it is private: objects are
-- readable by their owner and nobody else.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('meal-photos', 'meal-photos', false)
    on conflict (id) do nothing;

    execute $pol$
      drop policy if exists "meal_photos_own" on storage.objects;
    $pol$;
    execute $pol$
      create policy "meal_photos_own" on storage.objects
        for all to authenticated
        using (bucket_id = 'meal-photos' and owner = auth.uid())
        with check (bucket_id = 'meal-photos' and owner = auth.uid());
    $pol$;
  end if;
end
$$;
