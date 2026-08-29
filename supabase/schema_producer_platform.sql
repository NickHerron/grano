-- Grano producer platform — run this AFTER schema.sql, schema_reviews.sql, schema_messages.sql,
-- schema_storage.sql, schema_roles_v2.sql, schema_follows_cart.sql, schema_farm_logo.sql.
--
-- This turns a farm's Grano page into a real "producer profile" — rich enough to be worth
-- having even if the producer never sells a single item through Grano. See conversation
-- notes: profiles = "Producer" in spec language; the underlying table stays named `farms`
-- to avoid a high-risk rename touching every query in the app — same concept, same table.

-- ============ FARMS: PROFILE RICHNESS ============

alter table farms add column if not exists cover_photo_url text;
alter table farms add column if not exists profile_photo_url text;
alter table farms add column if not exists neighborhood text;
alter table farms add column if not exists county text;
alter table farms add column if not exists founded_year integer;
alter table farms add column if not exists website text;
alter table farms add column if not exists instagram text;
alter table farms add column if not exists facebook text;
alter table farms add column if not exists tiktok text;
alter table farms add column if not exists business_email text;
alter table farms add column if not exists phone text;
alter table farms add column if not exists producer_type text;
alter table farms add column if not exists practices jsonb not null default '{}';
alter table farms add column if not exists years_operating integer;
alter table farms add column if not exists num_employees text;
alter table farms add column if not exists delivery_area text;
alter table farms add column if not exists location_hidden boolean not null default false;
alter table farms add column if not exists sell_on_grano boolean not null default false;
alter table farms add column if not exists profile_view_count integer not null default 0;

-- Backfill: any farm that already has products listed was, in practice, already selling
-- through Grano before this toggle existed — flip them on so nothing already live disappears.
update farms set sell_on_grano = true where id in (select distinct farm_id from products);

-- Verification: unverified -> profile_complete -> verified. Only admins may change this —
-- enforced below with a trigger, since RLS can't restrict a single column on its own.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type verification_status as enum ('unverified', 'profile_complete', 'verified');
  end if;
end $$;

alter table farms add column if not exists verification_status verification_status not null default 'unverified';

create or replace function public.protect_verification_status()
returns trigger as $$
begin
  if new.verification_status is distinct from old.verification_status and not public.is_admin() then
    new.verification_status := old.verification_status;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists farms_protect_verification on farms;
create trigger farms_protect_verification
  before update on farms
  for each row execute procedure public.protect_verification_status();

-- ============ PRODUCTS: "LISTED" vs "FOR SALE" ============
-- A product can exist on a profile purely to say "we make this" (for_sale = false),
-- or actually be orderable through Grano (for_sale = true AND the farm's sell_on_grano
-- is also true AND is_available = true). Existing real listings default to for_sale = true
-- so nothing already live changes behavior.

alter table products add column if not exists for_sale boolean not null default true;
alter table products add column if not exists is_available boolean not null default true;
alter table products add column if not exists is_preorder boolean not null default false;
alter table products add column if not exists season_start_month smallint check (season_start_month between 1 and 12);
alter table products add column if not exists season_end_month smallint check (season_end_month between 1 and 12);
alter table products add column if not exists view_count integer not null default 0;

-- ============ PHOTO GALLERY ============

create table if not exists farm_photos (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists farm_photos_farm_id_idx on farm_photos(farm_id);

-- ============ FIND US (markets, retail, pickup, CSA, events) ============

create table if not exists farm_locations (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  name text not null,
  location_type text not null default 'farmers_market', -- farmers_market | retail | restaurant | farm_stand | csa | event | pickup
  address text,
  days text,
  hours text,
  link text,
  seasonal_start text,
  seasonal_end text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists farm_locations_farm_id_idx on farm_locations(farm_id);

-- ============ POSTS / UPDATES ============

create table if not exists farm_posts (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  text text not null,
  photo_url text,
  product_tags text[] not null default '{}',
  seasonal_tag text,
  created_at timestamptz not null default now()
);

create index if not exists farm_posts_farm_id_idx on farm_posts(farm_id);

-- ============ ROW LEVEL SECURITY ============

alter table farm_photos enable row level security;
alter table farm_locations enable row level security;
alter table farm_posts enable row level security;

create policy "farm_photos_select_all" on farm_photos for select using (true);
create policy "farm_photos_write_own" on farm_photos for all
  using (public.is_admin() or auth.uid() = (select owner_id from farms where farms.id = farm_photos.farm_id))
  with check (public.is_admin() or auth.uid() = (select owner_id from farms where farms.id = farm_photos.farm_id));

create policy "farm_locations_select_all" on farm_locations for select using (true);
create policy "farm_locations_write_own" on farm_locations for all
  using (public.is_admin() or auth.uid() = (select owner_id from farms where farms.id = farm_locations.farm_id))
  with check (public.is_admin() or auth.uid() = (select owner_id from farms where farms.id = farm_locations.farm_id));

create policy "farm_posts_select_all" on farm_posts for select using (true);
create policy "farm_posts_write_own" on farm_posts for all
  using (public.is_admin() or auth.uid() = (select owner_id from farms where farms.id = farm_posts.farm_id))
  with check (public.is_admin() or auth.uid() = (select owner_id from farms where farms.id = farm_posts.farm_id));
