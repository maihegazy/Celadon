-- Celadon — row-level security tests.
--
-- The claim this schema makes is that one account cannot reach another
-- account's health data. That claim is worth testing rather than asserting,
-- so this file creates two users and checks the boundary from both sides.
--
-- Runs inside a transaction and rolls back, so it leaves no rows behind.

begin;

\set alice '11111111-1111-1111-1111-111111111111'
\set bob   '22222222-2222-2222-2222-222222222222'

insert into auth.users (id, email) values
  (:'alice', 'alice@example.test'),
  (:'bob', 'bob@example.test');

/* ── the sign-up trigger provisions each account ──────────────────────── */

do $$
begin
  if (select count(*) from public.profiles
      where id in ('11111111-1111-1111-1111-111111111111',
                   '22222222-2222-2222-2222-222222222222')) <> 2 then
    raise exception 'handle_new_user did not create a profile for each account';
  end if;

  if (select count(*) from public.subscriptions
      where user_id in ('11111111-1111-1111-1111-111111111111',
                        '22222222-2222-2222-2222-222222222222')) <> 2 then
    raise exception 'handle_new_user did not create a subscription for each account';
  end if;
end
$$;

/* ── give each account one of everything, as the service role would ───── */

insert into public.diary_entries (user_id, logged_on, slot, source, name, calories, celadon_score)
values
  (:'alice', current_date, 'lunch', 'manual', 'Alice lunch', 500, 82),
  (:'bob', current_date, 'lunch', 'manual', 'Bob lunch', 600, 70);

insert into public.check_ins (user_id, checked_on, energy, overall, flare)
values
  (:'alice', current_date, 3, 3, false),
  (:'bob', current_date, 1, 1, true);

insert into public.meal_scans (user_id, dish, celadon_score, classification, confidence)
values
  (:'alice', 'Alice scan', 82, 'supportive', 'high'),
  (:'bob', 'Bob scan', 60, 'balanced', 'medium');

insert into public.scan_usage (user_id, week_start, scans_used)
values
  (:'alice', date_trunc('week', current_date)::date, 2),
  (:'bob', date_trunc('week', current_date)::date, 1);

update public.profiles set avoids = array['gluten', 'nightshades'] where id = :'alice';
update public.profiles set avoids = array['dairy'] where id = :'bob';

/* ── as Alice ─────────────────────────────────────────────────────────── */

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

do $$
declare
  affected int;
begin
  -- Reads are scoped to the caller.
  if (select count(*) from public.diary_entries) <> 1 then
    raise exception 'diary_entries: Alice sees % rows, expected only her own',
      (select count(*) from public.diary_entries);
  end if;
  if (select name from public.diary_entries) <> 'Alice lunch' then
    raise exception 'diary_entries: Alice sees the wrong row';
  end if;
  if (select count(*) from public.check_ins) <> 1 then
    raise exception 'check_ins leaked across accounts';
  end if;
  if (select count(*) from public.meal_scans) <> 1 then
    raise exception 'meal_scans leaked across accounts';
  end if;
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'profiles leaked across accounts';
  end if;

  -- Bob's rows are invisible, so an update aimed at them changes nothing.
  update public.diary_entries set name = 'hijacked'
  where user_id = '22222222-2222-2222-2222-222222222222';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'Alice updated % of Bob''s diary rows', affected;
  end if;

  -- …and a delete aimed at them removes nothing.
  delete from public.check_ins where user_id = '22222222-2222-2222-2222-222222222222';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'Alice deleted % of Bob''s check-ins', affected;
  end if;

  -- Writing a row *as* Bob must be refused by the insert policy.
  begin
    insert into public.diary_entries (user_id, logged_on, slot, source, name)
    values ('22222222-2222-2222-2222-222222222222', current_date, 'dinner', 'manual', 'forged');
    raise exception 'Alice was allowed to write a row owned by Bob';
  exception
    when insufficient_privilege then null; -- expected
  end;

  -- Her own writes work.
  insert into public.diary_entries (user_id, logged_on, slot, source, name)
  values ('11111111-1111-1111-1111-111111111111', current_date, 'dinner', 'manual', 'Alice dinner');

  if (select count(*) from public.diary_entries) <> 2 then
    raise exception 'Alice could not write her own diary entry';
  end if;

  -- The shared catalogue is readable by any signed-in account.
  if (select count(*) from public.recipes) = 0 then
    raise exception 'recipes should be readable by authenticated users';
  end if;
  if (select count(*) from public.foods) = 0 then
    raise exception 'foods should be readable by authenticated users';
  end if;

  -- But not writable: content comes in through the service role only.
  begin
    insert into public.recipes (slug, name_en, name_ar, minutes, celadon_score, classification)
    values ('forged', 'Forged', 'مزوّر', 10, 99, 'supportive');
    raise exception 'a client was allowed to insert into the shared catalogue';
  exception
    when insufficient_privilege then null; -- expected
  end;

  -- Granting yourself Premium must not be possible from the client.
  begin
    insert into public.subscriptions (user_id, status, plan)
    values ('11111111-1111-1111-1111-111111111111', 'active', 'annual');
    raise exception 'a client was allowed to insert its own subscription row';
  exception
    when insufficient_privilege then null; -- expected
    when unique_violation then null;       -- also fine: the row already exists
  end;

  -- Scan usage is readable (the app shows "1 free scan left")…
  if (select count(*) from public.scan_usage) <> 1 then
    raise exception 'scan_usage leaked across accounts';
  end if;
  if (select scans_used from public.scan_usage) <> 2 then
    raise exception 'Alice sees the wrong scan_usage row';
  end if;

  -- …but never writable: a client that could reset its own counter would
  -- give itself unlimited free scans.
  begin
    update public.scan_usage set scans_used = 0
    where user_id = '11111111-1111-1111-1111-111111111111';
    raise exception 'a client was allowed to reset its own scan counter';
  exception
    when insufficient_privilege then null; -- expected
  end;
  begin
    insert into public.scan_usage (user_id, week_start, scans_used)
    values ('11111111-1111-1111-1111-111111111111', date_trunc('week', current_date)::date + 7, 0);
    raise exception 'a client was allowed to insert its own scan_usage row';
  exception
    when insufficient_privilege then null; -- expected
  end;

  -- The derived views inherit the same scoping.
  if (select count(*) from public.daily_totals) <> 1 then
    raise exception 'daily_totals exposed more than the caller''s own days';
  end if;
end
$$;

/* ── as Bob ───────────────────────────────────────────────────────────── */

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

do $$
begin
  if (select count(*) from public.diary_entries) <> 1 then
    raise exception 'Bob sees % diary rows, expected only his own',
      (select count(*) from public.diary_entries);
  end if;
  if (select name from public.diary_entries) <> 'Bob lunch' then
    raise exception 'Bob sees the wrong diary row';
  end if;
  if (select avoids from public.profiles) <> array['dairy'] then
    raise exception 'Bob sees the wrong profile';
  end if;
  -- Alice's flare-free check-in must not be visible; his own must be.
  if (select flare from public.check_ins) is distinct from true then
    raise exception 'Bob sees the wrong check-in';
  end if;
end
$$;

/* ── signed out ───────────────────────────────────────────────────────── */

set local role anon;
set local request.jwt.claim.sub = '';

-- Two layers stop an anonymous caller, and which one bites depends on the
-- host: Supabase grants `anon` broad table privileges by default, so RLS is
-- what returns nothing; a bare Postgres refuses at the grant layer first.
-- Either is a pass — reading another person's health data is not.
do $$
declare
  visible int;
begin
  begin
    select count(*) into visible from public.diary_entries;
    if visible <> 0 then
      raise exception 'anonymous callers can read % diary entries', visible;
    end if;
  exception
    when insufficient_privilege then null;
  end;

  begin
    select count(*) into visible from public.profiles;
    if visible <> 0 then
      raise exception 'anonymous callers can read % profiles', visible;
    end if;
  exception
    when insufficient_privilege then null;
  end;
end
$$;

reset role;
rollback;
