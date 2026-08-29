-- Grano: simple "upcoming market" reminder notifications, without needing a background
-- job scheduler (no pg_cron in this stack). Instead of a true scheduled push, the
-- reminder is generated opportunistically — the dashboard checks on every load whether
-- a market is happening today or tomorrow and, if so, creates a notification the first
-- time that happens each day (deduped so revisiting the dashboard doesn't spam it).
--
-- This needs one thing the existing notifications table didn't allow: a user inserting
-- a notification for themselves. Every other notification type is still only ever
-- created by the SECURITY DEFINER triggers (messages, wholesale inquiries) — this
-- policy is scoped narrowly to type = 'market_reminder' so a client can't fabricate the
-- other kinds.
--
-- Run this AFTER schema_notifications.sql.

alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('message', 'wholesale_inquiry', 'inquiry_response', 'market_reminder'));

drop policy if exists "notifications_insert_own_market_reminder" on notifications;
create policy "notifications_insert_own_market_reminder" on notifications for insert
  with check (auth.uid() = user_id and type = 'market_reminder');
