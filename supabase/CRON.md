# Scheduling the `notify` function

The `notify` edge function composes the notification centre's content and
sends pushes. It is triggered on a schedule with `pg_cron` + `pg_net`,
which run inside the hosted database. Every kind is idempotent per period,
so an extra trigger composes nothing — the schedule can be re-run safely.

Times are UTC; Cairo is UTC+2 (UTC+3 in summer), the Gulf UTC+3/+4, so the
hours below land in the local late morning / early morning.

Run once in the SQL editor of the hosted project (replace `<PROJECT-REF>`
and `<ANON-KEY>` — the anon key is public, it only passes the function
gateway; the function itself uses its service-role environment):

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Daily lunch reminder, ~10:30–12:30 local.
select cron.schedule(
  'notify-meal-reminder', '30 8 * * *',
  $$ select net.http_post(
       url     := 'https://<PROJECT-REF>.supabase.co/functions/v1/notify',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer <ANON-KEY>'),
       body    := '{"kind":"meal_reminder"}'::jsonb) $$);

-- Weekly review, Monday ~07:00–09:00 local.
select cron.schedule(
  'notify-weekly-review', '0 5 * * 1',
  $$ select net.http_post(
       url     := 'https://<PROJECT-REF>.supabase.co/functions/v1/notify',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer <ANON-KEY>'),
       body    := '{"kind":"weekly_review"}'::jsonb) $$);

-- Shopping nudge, Saturday ~08:00–10:00 local, before the Sunday week starts.
select cron.schedule(
  'notify-shopping', '0 6 * * 6',
  $$ select net.http_post(
       url     := 'https://<PROJECT-REF>.supabase.co/functions/v1/notify',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer <ANON-KEY>'),
       body    := '{"kind":"shopping"}'::jsonb) $$);
```

Inspect with `select * from cron.job;`, remove with
`select cron.unschedule('notify-meal-reminder');`.

This lives here rather than in `supabase/migrations/` because `pg_cron`
and `pg_net` only exist on hosted Supabase — the throwaway Postgres the CI
suite runs against has neither, and schedules are environment config, not
schema.
