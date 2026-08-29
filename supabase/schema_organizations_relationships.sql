-- Phase 4 of the Network Layer plan: let an `organizations` row (farmers markets,
-- pickup locations, food hubs, community organizations) be a participant in
-- business_relationships, alongside farms and restaurants.
--
-- Deliberately narrow: only the three SECURITY DEFINER helpers below and
-- business_relationships' own CHECK constraints are touched. business_work_options
-- and sourcing_requests stay farm/restaurant-only on purpose — a market doesn't post
-- sourcing requests or receive wholesale inquiries, so extending those tables too
-- would double this migration's blast radius for no real benefit.
--
-- Safe to run any time: adds a third case branch (organizations didn't exist as a
-- relationship participant before, so this can only widen what's accepted, never
-- change existing behavior for farm/restaurant rows).

create or replace function public.owns_business(p_type text, p_id uuid)
returns boolean as $$
  select case p_type
    when 'farm' then exists (select 1 from farms where id = p_id and owner_id = auth.uid())
    when 'restaurant' then exists (select 1 from restaurants where id = p_id and owner_id = auth.uid())
    when 'organization' then exists (select 1 from organizations where id = p_id and owner_id = auth.uid())
    else false
  end;
$$ language sql security definer stable set search_path = public;

create or replace function public.business_name(p_type text, p_id uuid)
returns text as $$
  select case p_type
    when 'farm' then (select name from farms where id = p_id)
    when 'restaurant' then (select name from restaurants where id = p_id)
    when 'organization' then (select name from organizations where id = p_id)
  end;
$$ language sql security definer stable set search_path = public;

create or replace function public.business_owner(p_type text, p_id uuid)
returns uuid as $$
  select case p_type
    when 'farm' then (select owner_id from farms where id = p_id)
    when 'restaurant' then (select owner_id from restaurants where id = p_id)
    when 'organization' then (select owner_id from organizations where id = p_id)
  end;
$$ language sql security definer stable set search_path = public;

alter table business_relationships drop constraint if exists business_relationships_initiator_type_check;
alter table business_relationships add constraint business_relationships_initiator_type_check
  check (initiator_type in ('farm', 'restaurant', 'organization'));

alter table business_relationships drop constraint if exists business_relationships_target_type_check;
alter table business_relationships add constraint business_relationships_target_type_check
  check (target_type in ('farm', 'restaurant', 'organization'));
