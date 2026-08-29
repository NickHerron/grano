-- Grano: notifications — a producer gets notified when a message or wholesale inquiry
-- comes in; a restaurant gets notified when a producer responds to their inquiry.
--
-- "Upcoming market date" reminders are deliberately NOT stored here — there's no
-- background job scheduler in this stack (no pg_cron), so a stored "3 days until your
-- market" notification could silently go stale. Instead the dashboard computes it live
-- off farm_locations every time it's viewed (see nextOccurrence() in src/lib/schedule.js)
-- — always accurate, no infrastructure required.
--
-- Run this AFTER schema_consumer_wholesale.sql.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('message', 'wholesale_inquiry', 'inquiry_response')),
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on notifications(user_id);
create index if not exists notifications_user_unread_idx on notifications(user_id) where read_at is null;

alter table notifications enable row level security;

-- Read/update-your-own only. No insert policy for regular clients on purpose — every
-- notification is created by a SECURITY DEFINER trigger function below, which bypasses
-- RLS as the table owner; a plain authenticated user can never write a notification
-- for themselves or anyone else directly.
drop policy if exists "notifications_select_own" on notifications;
create policy "notifications_select_own" on notifications for select using (auth.uid() = user_id);
drop policy if exists "notifications_update_own" on notifications;
create policy "notifications_update_own" on notifications for update using (auth.uid() = user_id);

-- Live in-app delivery via Supabase Realtime (the bell updates without a page refresh).
-- Guarded so this is safe to re-run — ALTER PUBLICATION ... ADD TABLE errors if the
-- table is already a member.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

-- ============ MESSAGE READ TRACKING ============

alter table messages add column if not exists read_at timestamptz;

-- There was no UPDATE policy on messages at all before this — marking a message read
-- needs one. Scoped to the addressed farm's owner (never open/broadcast messages,
-- since read_at is a single shared column and those are visible to every producer).
drop policy if exists "messages_update_own_farm" on messages;
create policy "messages_update_own_farm" on messages for update
  using (farm_id is not null and auth.uid() = (select owner_id from farms where farms.id = messages.farm_id));

-- ============ TRIGGERS: fire a notification on the events that matter ============

create or replace function public.notify_new_message()
returns trigger as $$
declare
  v_owner_id uuid;
  v_sender_name text;
begin
  if new.farm_id is null then
    return new; -- open broadcast to all producers — no single recipient to notify
  end if;

  select owner_id into v_owner_id from farms where id = new.farm_id;
  if v_owner_id is null then
    return new;
  end if;

  select coalesce(restaurant_name, full_name, 'A restaurant') into v_sender_name
  from profiles where id = new.sender_id;

  insert into notifications (user_id, type, title, body, link)
  values (v_owner_id, 'message', v_sender_name || ' sent you a message', left(new.text, 140), '/dashboard/producer/messages');

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_message_created on messages;
create trigger on_message_created
  after insert on messages
  for each row execute procedure public.notify_new_message();

create or replace function public.notify_new_wholesale_inquiry()
returns trigger as $$
declare
  v_owner_id uuid;
  v_restaurant_name text;
begin
  select owner_id into v_owner_id from farms where id = new.farm_id;
  select name into v_restaurant_name from restaurants where id = new.restaurant_id;
  if v_owner_id is null then
    return new;
  end if;

  insert into notifications (user_id, type, title, body, link)
  values (
    v_owner_id, 'wholesale_inquiry',
    coalesce(v_restaurant_name, 'A restaurant') || ' sent a wholesale inquiry',
    new.product_name,
    '/dashboard/producer/inquiries'
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_wholesale_inquiry_created on wholesale_inquiries;
create trigger on_wholesale_inquiry_created
  after insert on wholesale_inquiries
  for each row execute procedure public.notify_new_wholesale_inquiry();

create or replace function public.notify_wholesale_inquiry_response()
returns trigger as $$
declare
  v_owner_id uuid;
  v_farm_name text;
  v_status_label text;
begin
  if new.status is not distinct from old.status then
    return new; -- only notify on an actual status change
  end if;

  select owner_id into v_owner_id from restaurants where id = new.restaurant_id;
  select name into v_farm_name from farms where id = new.farm_id;
  if v_owner_id is null then
    return new;
  end if;

  v_status_label := case new.status
    when 'accepted' then 'accepted'
    when 'declined' then 'declined'
    when 'info_requested' then 'responded to'
    else new.status
  end;

  insert into notifications (user_id, type, title, body, link)
  values (
    v_owner_id, 'inquiry_response',
    coalesce(v_farm_name, 'A producer') || ' ' || v_status_label || ' your inquiry',
    new.product_name,
    '/dashboard/restaurant/inquiries'
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_wholesale_inquiry_updated on wholesale_inquiries;
create trigger on_wholesale_inquiry_updated
  after update on wholesale_inquiries
  for each row execute procedure public.notify_wholesale_inquiry_response();
