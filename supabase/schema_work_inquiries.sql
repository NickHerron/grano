-- "Work With Us" — Phase 2: the structured inquiry table itself, plus the plumbing
-- that lets it use every existing system instead of building new ones — messages for
-- conversation, notifications for alerts, business_relationships for the eventual
-- "add to network" step. Schema only; no app code reads or writes this yet, so this
-- migration is fully verifiable on its own by inserting a test row in the SQL editor.
--
-- Run this AFTER schema_work_options.sql.

-- ============ WORK_INQUIRIES ============
-- Polymorphic (type, id) on both sides, same shape as business_relationships — a farm
-- and a restaurant are separate tables, and this needs any business <-> any business
-- (plus a signed-in person with no business, for event/custom-order inquiries), which
-- a single FK pair can't express. `to_type`/`to_id` is always a business (the profile
-- the inquiry was sent from); `sender_id` is always the real person; `from_type`/
-- `from_id` are set only when they're acting on behalf of a business they own.

create table if not exists work_inquiries (
  id uuid primary key default gen_random_uuid(),

  to_type text not null check (to_type in ('farm', 'restaurant')),
  to_id uuid not null,

  sender_id uuid not null references profiles(id) on delete cascade,
  from_type text check (from_type in ('farm', 'restaurant')),
  from_id uuid,

  inquiry_type text not null check (inquiry_type in
    ('wholesale', 'product_inquiry', 'event', 'collaboration', 'custom_order', 'sourcing', 'general')),

  subject text,           -- short human-readable snapshot, e.g. a product name — survives the product being deleted later
  message text,

  quantity text,
  frequency text check (frequency in ('weekly', 'biweekly', 'monthly', 'seasonal', 'one_time')),
  desired_date date,

  event_type text,
  event_start_time time,
  event_end_time time,
  event_location text,
  guest_count integer,
  budget text,

  -- Links into systems that already exist. Never a copy of their data.
  sourcing_request_id uuid references sourcing_requests(id) on delete set null,
  farm_location_id uuid references farm_locations(id) on delete set null,
  resulting_relationship_id uuid references business_relationships(id) on delete set null,
  legacy_wholesale_inquiry_id uuid unique references wholesale_inquiries(id) on delete set null,

  status text not null default 'new'
    check (status in ('new', 'responded', 'in_discussion', 'accepted', 'declined', 'closed')),
  response_note text,
  opened_at timestamptz,
  responded_at timestamptz,
  closed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check ((from_type is null) = (from_id is null)),
  check (not (from_type is not null and from_type = to_type and from_id = to_id))
);

create index if not exists work_inquiries_to_idx on work_inquiries(to_type, to_id);
create index if not exists work_inquiries_from_idx on work_inquiries(from_type, from_id);
create index if not exists work_inquiries_sender_idx on work_inquiries(sender_id);
create index if not exists work_inquiries_sourcing_request_idx on work_inquiries(sourcing_request_id);
create index if not exists work_inquiries_status_idx on work_inquiries(status);

create table if not exists work_inquiry_products (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references work_inquiries(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (inquiry_id, product_id)
);

create index if not exists wip_inquiry_idx on work_inquiry_products(inquiry_id);

-- Mirrors owns_business()/business_name()/business_owner() from schema_business_network.sql
-- — "does the current user have any legitimate stake in this inquiry."
create or replace function public.is_inquiry_participant(p_inquiry_id uuid)
returns boolean as $$
  select exists (
    select 1 from work_inquiries i
    where i.id = p_inquiry_id
      and ( i.sender_id = (select auth.uid())
            or public.owns_business(i.to_type, i.to_id)
            or (i.from_type is not null and public.owns_business(i.from_type, i.from_id)) )
  );
$$ language sql security definer stable set search_path = public;

grant execute on function public.is_inquiry_participant(uuid) to authenticated, anon;

-- Same "reset whatever this actor isn't allowed to touch" shape as
-- enforce_relationship_update_rules(). The recipient drives the lifecycle (status,
-- response note, opened/resulting-relationship bookkeeping); the sender can only
-- withdraw a still-open inquiry. Capability gating (does this business even accept
-- this inquiry_type) happens in the server action, not here — it's derived from JS
-- defaults that can't be reproduced in SQL, and a bypass just means an unwanted
-- inquiry, the same threat model messages already accepts.
create or replace function public.enforce_work_inquiry_update_rules()
returns trigger as $$
begin
  new.updated_at := now();

  if public.owns_business(old.to_type, old.to_id) then
    if new.status not in ('new', 'responded', 'in_discussion', 'accepted', 'declined', 'closed') then
      raise exception 'Invalid status.';
    end if;
    new.to_type := old.to_type;
    new.to_id := old.to_id;
    new.sender_id := old.sender_id;
    new.from_type := old.from_type;
    new.from_id := old.from_id;
    new.inquiry_type := old.inquiry_type;
    new.subject := old.subject;
    new.message := old.message;
    new.quantity := old.quantity;
    new.frequency := old.frequency;
    new.desired_date := old.desired_date;
    new.event_type := old.event_type;
    new.event_start_time := old.event_start_time;
    new.event_end_time := old.event_end_time;
    new.event_location := old.event_location;
    new.guest_count := old.guest_count;
    new.budget := old.budget;
    new.sourcing_request_id := old.sourcing_request_id;
    new.legacy_wholesale_inquiry_id := old.legacy_wholesale_inquiry_id;
    new.created_at := old.created_at;
    new.responded_at := case when old.status = 'new' and new.status <> 'new' then now() else old.responded_at end;
    new.closed_at := case when new.status = 'closed' and old.status <> 'closed' then now() else old.closed_at end;
  elsif old.sender_id = (select auth.uid()) or (old.from_type is not null and public.owns_business(old.from_type, old.from_id)) then
    if old.status = 'closed' then
      raise exception 'This inquiry is already closed.';
    end if;
    if new.status <> 'closed' then
      raise exception 'You can only withdraw (close) your own inquiry.';
    end if;
    new.to_type := old.to_type;
    new.to_id := old.to_id;
    new.sender_id := old.sender_id;
    new.from_type := old.from_type;
    new.from_id := old.from_id;
    new.inquiry_type := old.inquiry_type;
    new.subject := old.subject;
    new.message := old.message;
    new.quantity := old.quantity;
    new.frequency := old.frequency;
    new.desired_date := old.desired_date;
    new.event_type := old.event_type;
    new.event_start_time := old.event_start_time;
    new.event_end_time := old.event_end_time;
    new.event_location := old.event_location;
    new.guest_count := old.guest_count;
    new.budget := old.budget;
    new.sourcing_request_id := old.sourcing_request_id;
    new.legacy_wholesale_inquiry_id := old.legacy_wholesale_inquiry_id;
    new.response_note := old.response_note;
    new.resulting_relationship_id := old.resulting_relationship_id;
    new.opened_at := old.opened_at;
    new.responded_at := old.responded_at;
    new.created_at := old.created_at;
    new.closed_at := now();
  else
    raise exception 'Not authorized to update this inquiry.';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists work_inquiries_update_guard on work_inquiries;
create trigger work_inquiries_update_guard
  before update on work_inquiries
  for each row execute function public.enforce_work_inquiry_update_rules();

alter table work_inquiries enable row level security;

create policy "work_inquiries_select" on work_inquiries for select
  using (
    public.is_admin()
    or sender_id = (select auth.uid())
    or public.owns_business(to_type, to_id)
    or (from_type is not null and public.owns_business(from_type, from_id))
  );

create policy "work_inquiries_insert" on work_inquiries for insert
  with check (
    sender_id = (select auth.uid())
    and status = 'new'
    and (from_type is null or public.owns_business(from_type, from_id))
    and not public.owns_business(to_type, to_id)
  );

create policy "work_inquiries_update" on work_inquiries for update
  using (public.is_admin() or public.is_inquiry_participant(id));

create policy "work_inquiries_delete" on work_inquiries for delete
  using (
    public.is_admin()
    or (status = 'new' and sender_id = (select auth.uid()))
    or public.owns_business(to_type, to_id)
  );

alter table work_inquiry_products enable row level security;

-- Same "product must actually belong to a farm on one side of this record" shape as
-- brp_select/brp_insert/brp_delete on business_relationship_products.
create policy "wip_select" on work_inquiry_products for select
  using (
    exists (
      select 1 from work_inquiries i where i.id = inquiry_id and public.is_inquiry_participant(i.id)
    ) or public.is_admin()
  );

create policy "wip_insert" on work_inquiry_products for insert
  with check (
    exists (
      select 1 from work_inquiries i join products p on p.id = product_id
      where i.id = inquiry_id
      and (i.sender_id = (select auth.uid()) or (i.from_type is not null and public.owns_business(i.from_type, i.from_id)))
      and ( (i.to_type = 'farm' and i.to_id = p.farm_id) or (i.from_type = 'farm' and i.from_id = p.farm_id) )
    )
  );

create policy "wip_delete" on work_inquiry_products for delete
  using (
    exists (select 1 from work_inquiries i where i.id = inquiry_id and public.is_inquiry_participant(i.id))
  );

-- ============ MESSAGES: attach a conversation to an inquiry ============
-- One nullable column, not a new chat system. The inquiry row is what supplies the
-- authorization context that messages' own restaurant<->farm-only policies can't
-- express for the new business<->business directions this system needs.

alter table messages add column if not exists inquiry_id uuid references work_inquiries(id) on delete cascade;
create index if not exists messages_inquiry_id_idx on messages(inquiry_id);

-- SECURITY FIX bundled into this migration: the existing "open broadcast to every
-- producer" branch (`farm_id is null and has_role('producer')`) was written when
-- farm_id could only be null for that one broadcast case. An inquiry TO a restaurant
-- also has farm_id = null — without the `inquiry_id is null` guard below, every
-- producer on Grano could read those. This closes that as part of adding the column
-- that makes it possible, not as a separate patch.
drop policy if exists "messages_select" on messages;
create policy "messages_select" on messages for select using (
  (select auth.uid()) = sender_id
  or (select auth.uid()) = recipient_id
  or public.is_admin()
  or (farm_id is null and inquiry_id is null and public.has_role('producer'))
  or (farm_id is not null and inquiry_id is null and (select auth.uid()) = (select owner_id from farms where farms.id = messages.farm_id))
  or (inquiry_id is not null and public.is_inquiry_participant(inquiry_id))
);

create policy "messages_insert_inquiry_participant" on messages for insert
  with check (
    (select auth.uid()) = sender_id
    and inquiry_id is not null
    and public.is_inquiry_participant(inquiry_id)
  );

create policy "messages_update_inquiry_participant" on messages for update
  using (inquiry_id is not null and public.is_inquiry_participant(inquiry_id));

-- ============ NOTIFICATIONS ============

alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('message', 'wholesale_inquiry', 'inquiry_response', 'network_invite', 'network_response', 'work_inquiry', 'work_inquiry_response'));

create or replace function public.notify_new_work_inquiry()
returns trigger as $$
declare
  v_owner_id uuid;
  v_sender_name text;
begin
  v_owner_id := public.business_owner(new.to_type, new.to_id);
  if v_owner_id is null then
    return new;
  end if;

  select coalesce(restaurant_name, full_name, 'Someone') into v_sender_name
  from profiles where id = new.sender_id;

  insert into notifications (user_id, type, title, body, link)
  values (
    v_owner_id, 'work_inquiry',
    coalesce(v_sender_name, 'Someone') || ' sent a ' || replace(new.inquiry_type, '_', ' ') || ' inquiry',
    coalesce(new.subject, left(new.message, 140)),
    '/dashboard/inquiries/' || new.id
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_work_inquiry_created on work_inquiries;
create trigger on_work_inquiry_created
  after insert on work_inquiries
  for each row execute procedure public.notify_new_work_inquiry();

create or replace function public.notify_work_inquiry_status()
returns trigger as $$
declare
  v_business_name text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  v_business_name := public.business_name(new.to_type, new.to_id);

  insert into notifications (user_id, type, title, body, link)
  values (
    new.sender_id, 'work_inquiry_response',
    coalesce(v_business_name, 'A business') || ' ' || new.status || ' your inquiry',
    coalesce(new.response_note, new.subject),
    '/dashboard/inquiries/' || new.id
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_work_inquiry_updated on work_inquiries;
create trigger on_work_inquiry_updated
  after update on work_inquiries
  for each row execute procedure public.notify_work_inquiry_status();

-- notify_new_message() gets one new branch at the top: if this message belongs to an
-- inquiry, skip notifying when it's the very first message on that inquiry (the
-- on_work_inquiry_created trigger above already notified the recipient for it) —
-- otherwise notify whichever participant didn't send it. Everything below is
-- unchanged from schema_notifications.sql.
create or replace function public.notify_new_message()
returns trigger as $$
declare
  v_owner_id uuid;
  v_sender_name text;
  v_recipient_id uuid;
begin
  if new.inquiry_id is not null then
    if exists (select 1 from messages m where m.inquiry_id = new.inquiry_id and m.id <> new.id) then
      select coalesce(restaurant_name, full_name, 'Someone') into v_sender_name from profiles where id = new.sender_id;
      select case
        when i.sender_id = new.sender_id then public.business_owner(i.to_type, i.to_id)
        else i.sender_id
      end into v_recipient_id
      from work_inquiries i where i.id = new.inquiry_id;

      if v_recipient_id is not null and v_recipient_id <> new.sender_id then
        insert into notifications (user_id, type, title, body, link)
        values (v_recipient_id, 'message', coalesce(v_sender_name, 'Someone') || ' replied', left(new.text, 140), '/dashboard/inquiries/' || new.inquiry_id);
      end if;
    end if;
    return new;
  end if;

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

-- ============ BACKFILL: wholesale_inquiries history, for the Phase 5 cutover ============
-- Invisible to the app today — nothing reads work_inquiries yet. This just gets
-- history in place early so Phase 5 is a UI flip, not a data migration. Trigger
-- disabled around the insert so historical rows don't spam every producer's bell;
-- `on conflict do nothing` on legacy_wholesale_inquiry_id makes this safe to re-run
-- (Phase 5 re-runs it to catch anything sent between now and then).

alter table work_inquiries disable trigger on_work_inquiry_created;

insert into work_inquiries (
  to_type, to_id, sender_id, from_type, from_id, inquiry_type, subject, message,
  quantity, frequency, desired_date, response_note, status,
  legacy_wholesale_inquiry_id, created_at, updated_at
)
select
  'farm', w.farm_id, r.owner_id, 'restaurant', w.restaurant_id, 'wholesale', w.product_name, w.message,
  w.quantity, w.frequency, w.start_date, w.producer_response,
  case w.status
    when 'pending' then 'new'
    when 'accepted' then 'accepted'
    when 'declined' then 'declined'
    when 'info_requested' then 'responded'
    else 'new'
  end,
  w.id, w.created_at, w.updated_at
from wholesale_inquiries w
join restaurants r on r.id = w.restaurant_id
where r.owner_id is not null
on conflict (legacy_wholesale_inquiry_id) do nothing;

insert into work_inquiry_products (inquiry_id, product_id)
select i.id, w.product_id
from work_inquiries i
join wholesale_inquiries w on w.id = i.legacy_wholesale_inquiry_id
where w.product_id is not null
on conflict do nothing;

alter table work_inquiries enable trigger on_work_inquiry_created;
