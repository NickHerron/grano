-- Grano Network Layer, Phase 2 — the "organizations" table.
--
-- Farms and restaurants cover producers and restaurants; nothing in the schema
-- represents a farmers market, a standalone pickup point, a food hub, or a community
-- organization as its own entity — today a "farmers market" is only ever a free-text
-- name string on one farm's own farm_locations row, with no shared entity anything
-- else can point at. This table is that shared entity, mirroring restaurants' own
-- shape (same columns, same RLS pattern) rather than inventing a new one.
--
-- Deliberately NOT a new account type in account_roles, and deliberately not given
-- its own onboarding wizard — see the approved plan's "no ten new account types"
-- principle. org_type distinguishes what kind of organization a row is.
--
-- Schedule columns are named to exactly match farm_locations' own schedule columns
-- (schema_locations_orders_reviews.sql / schema_location_date_range.sql /
-- schema_location_exceptions.sql) so src/lib/schedule.js's nextOccurrence(),
-- formatScheduleLine(), upcomingOccurrences(), and inActiveRange() all work against an
-- organization row completely unchanged — no adapter, no duplicated calendar logic.
-- Meaningful for a farmers_market org's own regular market day/hours; simply unused
-- for org_types that have no recurring schedule of their own.
--
-- Run this AFTER schema_account_roles.sql (for is_admin()) and schema.sql (for
-- set_updated_at()).

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  slug text unique not null,
  name text not null,
  org_type text not null default 'other'
    check (org_type in ('farmers_market', 'pickup_location', 'food_hub', 'community_organization', 'other')),
  description text,
  location text,
  neighborhood text,
  address text,
  logo_url text,
  cover_photo_url text,
  website text,
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'verified')),
  profile_view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Schedule columns — see file header. All optional; only meaningful for an org
  -- (typically a farmers_market) that has its own recurring schedule to publish.
  hours text,
  days text,
  schedule_type text not null default 'custom' check (schedule_type in ('weekly', 'biweekly', 'specific_dates', 'custom')),
  schedule_days smallint[] not null default '{}',
  schedule_anchor_date date,
  schedule_dates date[] not null default '{}',
  schedule_exceptions date[] not null default '{}',
  starts_on date,
  ends_on date,
  seasonal_start text,
  seasonal_end text
);

create index if not exists organizations_owner_id_idx on organizations(owner_id);
create index if not exists organizations_org_type_idx on organizations(org_type);
create index if not exists organizations_slug_idx on organizations(slug);

create trigger organizations_set_updated_at
  before update on organizations
  for each row execute procedure set_updated_at();

alter table organizations enable row level security;

-- Same pattern as farms/restaurants: public read (profiles are meant to be
-- discoverable), owner-or-admin write.
create policy "organizations_select_all" on organizations for select using (true);

create policy "organizations_insert_own" on organizations for insert
  with check (auth.uid() = owner_id);

create policy "organizations_update_own_or_admin" on organizations for update
  using (auth.uid() = owner_id or public.is_admin());

create policy "organizations_delete_own_or_admin" on organizations for delete
  using (auth.uid() = owner_id or public.is_admin());

-- No app code reads or writes this table yet — fully verifiable standalone by
-- inserting/reading a test row directly in the SQL editor, or via a disposable
-- service-role script. Phase 3 (app code) and Phase 4 (extending the polymorphic
-- business_relationships pattern to a third type) build on top of this.
