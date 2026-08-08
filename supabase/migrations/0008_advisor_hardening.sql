-- Celadon — hardening from the Supabase security advisors.
--
-- Three findings, none exploitable today but all worth closing:
--
-- 1. `handle_new_user` is SECURITY DEFINER and, via PostgREST's default
--    grants, callable by anon/authenticated at /rest/v1/rpc/handle_new_user.
--    Calling it out of band is a no-op (it reads `new`, which is null outside
--    a trigger, and errors), but a definer function nobody should call is a
--    definer function nobody *can* call.
-- 2. `set_updated_at` had a role-mutable search_path. It only touches `new`,
--    so pin the path to empty and nothing changes except the attack surface.
-- 3. 0001's `touch_updated_at` was superseded by `set_updated_at` in 0002 but
--    its trigger was never dropped, leaving two triggers writing the same
--    column on profiles. Retire the old pair.

/* ── 1: trigger functions are not API ─────────────────────────────────── */

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

/* ── 2: pin search paths ──────────────────────────────────────────────── */

alter function public.set_updated_at() set search_path = '';

/* ── 3: retire the 0001 duplicate ─────────────────────────────────────── */

drop trigger if exists profiles_touch_updated_at on public.profiles;
drop function if exists public.touch_updated_at();
