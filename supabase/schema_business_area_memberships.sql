-- Community membership, separate from home location. A farm/restaurant/organization's
-- own city/state (schema_geography.sql) is where it's physically based; this table is
-- every OTHER community it's chosen to join — e.g. a Waukegan-based producer who
-- actually sells in Chicago can add itself to the Chicago community without its
-- profile claiming to be based there. Discovery pages (getAreaEntities()) union home
-- matches with membership rows, so joining a second community never removes the first.
--
-- Same polymorphic (business_type, business_id) shape as business_roles/
-- business_relationships/business_work_options, reusing owns_business() rather than
-- inventing new ownership logic.

create table if not exists business_area_memberships (
  id uuid primary key default gen_random_uuid(),
  business_type text not null check (business_type in ('farm', 'restaurant', 'organization')),
  business_id uuid not null,
  state text not null,
  city text not null,
  created_at timestamptz not null default now(),
  unique (business_type, business_id, state, city)
);

create index if not exists business_area_memberships_business_idx on business_area_memberships(business_type, business_id);
create index if not exists business_area_memberships_area_idx on business_area_memberships(state, city);

alter table business_area_memberships enable row level security;

create policy "business_area_memberships_select_all" on business_area_memberships for select using (true);
create policy "business_area_memberships_insert_own" on business_area_memberships for insert
  with check (public.owns_business(business_type, business_id) or public.is_admin());
create policy "business_area_memberships_delete_own" on business_area_memberships for delete
  using (public.owns_business(business_type, business_id) or public.is_admin());
