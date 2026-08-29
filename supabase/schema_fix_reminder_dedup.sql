-- Fixes a real race condition: the app-level "check if today's reminder already
-- exists, then insert" isn't atomic, so two nearly-simultaneous dashboard loads (e.g.
-- a double navigation) could both pass the check before either insert lands, producing
-- duplicate reminders for the same market on the same day. A database-level unique
-- index makes this actually safe regardless of timing — the second insert just no-ops
-- (the app already ignores insert errors on this fire-and-forget call, which is exactly
-- the dedup behavior wanted here).
--
-- Postgres won't allow a plain `created_at::date` in an index expression — that cast
-- depends on the session's timezone setting, so it's only STABLE, not IMMUTABLE, which
-- indexes require. Pinning it to UTC via a tiny wrapper function sidesteps that: UTC
-- has no DST/offset rules that could ever change the result for a given instant.

create or replace function public.utc_date(ts timestamptz)
returns date as $$
  select (ts at time zone 'UTC')::date
$$ language sql immutable;

create unique index if not exists notifications_market_reminder_dedup
  on notifications (user_id, type, title, public.utc_date(created_at))
  where type = 'market_reminder';
