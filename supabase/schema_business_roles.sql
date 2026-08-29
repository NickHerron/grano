-- Phase 1 of the Person/Organization Multi-Role Foundation plan.
--
-- A polymorphic role-tagging layer over farms/restaurants/organizations — the same
-- (business_type, business_id) shape as business_relationships/business_work_options,
-- reusing owns_business() rather than inventing new ownership logic. This does NOT
-- replace producer_type/restaurant_type/org_type — those stay authoritative for every
-- existing badge, filter, and document requirement. business_roles is an additive,
-- coarser, queryable overlay: one entity can now say "I'm a Bakery AND a Caterer"
-- without needing a second account or a second table row.
--
-- Deliberately named business_roles, not profile_roles — the repo's whole polymorphic
-- vocabulary is already "business" (business_relationships, business_work_options,
-- owns_business()), and profile_roles next to profiles.role/account_roles.role would
-- be the most confusing possible name for a system whose entire point is keeping
-- ACCOUNT ROLE (what the user can do) and PROFILE ROLE (what an entity does in the
-- real world) distinct.
--
-- Curated v1 vocabulary (15 keys) — each one maps to something that already exists in
-- the schema or already has a real capability behind it. The whole Support category
-- (Supplier/Distributor/etc.) is deliberately cut: sells_wholesale/buys_wholesale
-- already are that signal. Adding a role later costs one CHECK-constraint line, not a
-- redesign.

create table if not exists business_roles (
  id uuid primary key default gen_random_uuid(),
  business_type text not null check (business_type in ('farm', 'restaurant', 'organization')),
  business_id uuid not null,
  role_key text not null check (role_key in (
    -- Produce / Make -> farms.producer_type
    'farm', 'bakery', 'food_maker', 'beverage_producer', 'coffee_roaster',
    -- Sell / Serve -> restaurants.restaurant_type
    'restaurant', 'cafe', 'grocery_retailer', 'caterer',
    -- Organize / Community -> organizations.org_type
    'farmers_market', 'food_hub', 'community_organization', 'food_cooperative',
    -- Places / Facilities -> organizations.org_type
    'pickup_location', 'event_venue'
  )),
  -- Exactly one primary role per entity — enforced below by a partial unique index,
  -- not app code. The primary role drives default presentation/search category/icon
  -- and is mirrored into the entity's legacy type column by app code (see
  -- src/lib/businessRoles.js); additional roles unlock additional sections/filters
  -- without changing what the entity fundamentally is.
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (business_type, business_id, role_key)
);

create index if not exists business_roles_business_idx on business_roles(business_type, business_id);

create unique index if not exists business_roles_one_primary_idx
  on business_roles(business_type, business_id) where is_primary;

alter table business_roles enable row level security;

-- Public read — role chips and role-based search need to work for signed-out visitors.
create policy "business_roles_select_all" on business_roles for select using (true);

create policy "business_roles_insert_own" on business_roles for insert
  with check (public.owns_business(business_type, business_id) or public.is_admin());
create policy "business_roles_update_own" on business_roles for update
  using (public.owns_business(business_type, business_id) or public.is_admin());
create policy "business_roles_delete_own" on business_roles for delete
  using (public.owns_business(business_type, business_id) or public.is_admin());

-- "Food Cooperative" is one of the plan's worked examples (a co-op that's also a Food
-- Hub, Pickup Location, and Community Organization) — added here so its role_key maps
-- 1:1 onto org_type instead of collapsing into a different value.
alter table organizations drop constraint if exists organizations_org_type_check;
alter table organizations add constraint organizations_org_type_check
  check (org_type in ('farmers_market', 'pickup_location', 'food_hub', 'community_organization', 'food_cooperative', 'other'));
