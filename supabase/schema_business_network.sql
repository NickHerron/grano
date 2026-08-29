-- "Our Local Network" — real, mutually-confirmed business-to-business relationships
-- (who a producer/restaurant sources from, who they supply), distinct from Following
-- (a one-sided "keep me posted" signal) and from Orders (a transaction record). A
-- business explicitly invites another business into its network; the relationship
-- only becomes public once the other side accepts.
--
-- Farms and restaurants are separate tables in this schema, and a relationship can be
-- between any combination of them (farm<->farm, farm<->restaurant, restaurant<->
-- restaurant), so each side is stored as a (type, id) pair rather than a single FK —
-- there's no single "businesses" table to point at. owns_business() below is the
-- RLS-safe way every policy checks "does the current user control this side."

create or replace function public.owns_business(p_type text, p_id uuid)
returns boolean as $$
  select case p_type
    when 'farm' then exists (select 1 from farms where id = p_id and owner_id = auth.uid())
    when 'restaurant' then exists (select 1 from restaurants where id = p_id and owner_id = auth.uid())
    else false
  end;
$$ language sql security definer stable set search_path = public;

grant execute on function public.owns_business(text, uuid) to authenticated, anon;

-- Looks up the display name + owner of either side, used by the notification triggers
-- below (kept as one small helper instead of duplicating the case/exists twice).
create or replace function public.business_name(p_type text, p_id uuid)
returns text as $$
  select case p_type
    when 'farm' then (select name from farms where id = p_id)
    when 'restaurant' then (select name from restaurants where id = p_id)
  end;
$$ language sql security definer stable set search_path = public;

create or replace function public.business_owner(p_type text, p_id uuid)
returns uuid as $$
  select case p_type
    when 'farm' then (select owner_id from farms where id = p_id)
    when 'restaurant' then (select owner_id from restaurants where id = p_id)
  end;
$$ language sql security definer stable set search_path = public;

create table if not exists business_relationships (
  id uuid primary key default gen_random_uuid(),
  initiator_type text not null check (initiator_type in ('farm', 'restaurant')),
  initiator_id uuid not null,
  target_type text not null check (target_type in ('farm', 'restaurant')),
  target_id uuid not null,
  -- Meaning is always relative to the initiator: source_from = "we source from
  -- target", supplies_to = "we supply target". collaboration has no direction.
  relationship_type text not null check (relationship_type in ('source_from', 'supplies_to', 'collaboration')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  description text,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  check (not (initiator_type = target_type and initiator_id = target_id))
);

create index if not exists business_relationships_initiator_idx on business_relationships(initiator_type, initiator_id);
create index if not exists business_relationships_target_idx on business_relationships(target_type, target_id);

-- Same pair of businesses can't have two relationships of the same type stacked on
-- top of each other (e.g. two separate "we source from them" invitations).
create unique index if not exists business_relationships_unique_pair
  on business_relationships(initiator_type, initiator_id, target_type, target_id, relationship_type);

create table if not exists business_relationship_products (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references business_relationships(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (relationship_id, product_id)
);

create index if not exists brp_relationship_idx on business_relationship_products(relationship_id);

alter table business_relationships enable row level security;
alter table business_relationship_products enable row level security;

-- SELECT: both participants always see their own relationship (any status, any
-- visibility); everyone else only sees it once it's accepted AND public.
create policy "business_relationships_select" on business_relationships for select
  using (
    (status = 'accepted' and visibility = 'public')
    or public.owns_business(initiator_type, initiator_id)
    or public.owns_business(target_type, target_id)
    or public.is_admin()
  );

create policy "business_relationships_insert" on business_relationships for insert
  with check (
    created_by = auth.uid()
    and public.owns_business(initiator_type, initiator_id)
    and status = 'pending'
  );

-- UPDATE is allowed for either participant at the RLS layer; the trigger below is
-- what actually restricts *what* each side is allowed to change (a business can't
-- silently self-accept its own outgoing invitation, and the receiving side can't
-- rewrite the relationship's terms, only accept or decline it).
create policy "business_relationships_update_participant" on business_relationships for update
  using (public.owns_business(initiator_type, initiator_id) or public.owns_business(target_type, target_id));

create policy "business_relationships_delete_participant" on business_relationships for delete
  using (public.owns_business(initiator_type, initiator_id) or public.owns_business(target_type, target_id));

create or replace function public.enforce_relationship_update_rules()
returns trigger as $$
begin
  new.updated_at := now();

  if public.owns_business(old.initiator_type, old.initiator_id) then
    -- The initiator can edit the terms (visibility, description) at any time, but
    -- can never move status themselves — no self-accepting your own invitation —
    -- and can't reassign which two businesses or which direction it's about.
    new.initiator_type := old.initiator_type;
    new.initiator_id := old.initiator_id;
    new.target_type := old.target_type;
    new.target_id := old.target_id;
    new.relationship_type := old.relationship_type;
    new.status := old.status;
    new.accepted_at := old.accepted_at;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  elsif public.owns_business(old.target_type, old.target_id) then
    -- The receiving side can only respond — accept or decline a still-pending
    -- invitation — nothing else about the relationship is theirs to change.
    if old.status <> 'pending' then
      raise exception 'This invitation has already been responded to.';
    end if;
    if new.status not in ('accepted', 'declined') then
      raise exception 'Invalid status transition.';
    end if;
    new.initiator_type := old.initiator_type;
    new.initiator_id := old.initiator_id;
    new.target_type := old.target_type;
    new.target_id := old.target_id;
    new.relationship_type := old.relationship_type;
    new.visibility := old.visibility;
    new.description := old.description;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.accepted_at := case when new.status = 'accepted' then now() else old.accepted_at end;
  else
    raise exception 'Not authorized to update this relationship.';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists business_relationships_update_guard on business_relationships;
create trigger business_relationships_update_guard
  before update on business_relationships
  for each row execute function public.enforce_relationship_update_rules();

-- A product can only be attached to a relationship if it actually belongs to
-- whichever side of that relationship is a farm — stops a business from decorating
-- a relationship with a product that has nothing to do with either party.
create policy "brp_select" on business_relationship_products for select
  using (
    exists (
      select 1 from business_relationships r where r.id = relationship_id
      and (
        (r.status = 'accepted' and r.visibility = 'public')
        or public.owns_business(r.initiator_type, r.initiator_id)
        or public.owns_business(r.target_type, r.target_id)
        or public.is_admin()
      )
    )
  );

create policy "brp_insert" on business_relationship_products for insert
  with check (
    exists (
      select 1 from business_relationships r
      join products p on p.id = product_id
      where r.id = relationship_id
      and (public.owns_business(r.initiator_type, r.initiator_id) or public.owns_business(r.target_type, r.target_id))
      and (
        (r.initiator_type = 'farm' and r.initiator_id = p.farm_id)
        or (r.target_type = 'farm' and r.target_id = p.farm_id)
      )
    )
  );

create policy "brp_delete" on business_relationship_products for delete
  using (
    exists (
      select 1 from business_relationships r where r.id = relationship_id
      and (public.owns_business(r.initiator_type, r.initiator_id) or public.owns_business(r.target_type, r.target_id))
    )
  );

-- ============ NOTIFICATIONS ============
-- Same pattern as the rest of the app (schema_notifications.sql): every notification
-- is written by a SECURITY DEFINER trigger, never inserted directly by a client.

alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('message', 'wholesale_inquiry', 'inquiry_response', 'network_invite', 'network_response'));

create or replace function public.notify_new_network_invite()
returns trigger as $$
declare
  v_owner_id uuid;
  v_initiator_name text;
begin
  v_owner_id := public.business_owner(new.target_type, new.target_id);
  v_initiator_name := public.business_name(new.initiator_type, new.initiator_id);
  if v_owner_id is null then
    return new;
  end if;

  insert into notifications (user_id, type, title, body, link)
  values (
    v_owner_id, 'network_invite',
    coalesce(v_initiator_name, 'A business') || ' wants to add you to their local network',
    new.description,
    '/dashboard/following?section=network'
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_network_invite_created on business_relationships;
create trigger on_network_invite_created
  after insert on business_relationships
  for each row execute procedure public.notify_new_network_invite();

create or replace function public.notify_network_response()
returns trigger as $$
declare
  v_owner_id uuid;
  v_target_name text;
begin
  if new.status is not distinct from old.status or new.status = 'pending' then
    return new;
  end if;

  v_owner_id := public.business_owner(new.initiator_type, new.initiator_id);
  v_target_name := public.business_name(new.target_type, new.target_id);
  if v_owner_id is null then
    return new;
  end if;

  insert into notifications (user_id, type, title, body, link)
  values (
    v_owner_id, 'network_response',
    coalesce(v_target_name, 'A business') || ' ' || new.status || ' your local network invitation',
    null,
    '/dashboard/following?section=network'
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_network_response on business_relationships;
create trigger on_network_response
  after update on business_relationships
  for each row execute procedure public.notify_network_response();
