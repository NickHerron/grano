-- Grano schema: roles, profiles, farms, products, RLS
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> Run)
-- After this succeeds, also run schema_reviews.sql, then schema_storage.sql (see that file for a prerequisite step).

-- ============ ROLES & PROFILES ============

create type user_role as enum ('admin', 'buyer', 'producer');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'buyer',
  full_name text,
  restaurant_name text,
  created_at timestamptz not null default now()
);

-- ============ FARMS ============

create table farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  slug text unique not null,
  name text not null,
  location text,
  miles integer,
  bio text,
  story text,
  tags text[] not null default '{}',
  avatar_bg text not null default '#F7F5F1',
  created_at timestamptz not null default now()
);

create index farms_owner_id_idx on farms(owner_id);

-- ============ PRODUCTS ============

create table products (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  slug text unique not null,
  name text not null,
  description text,
  category text,
  price numeric(10,2) not null default 0,
  unit text not null default 'unit',
  unit_detail text,
  stock integer,
  stock_unit text,
  image_url text,
  img_bg text not null default '#F7F5F1',
  badge text,
  badge_color text not null default 'green',
  harvested_at text,
  season_ends text,
  miles integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_farm_id_idx on products(farm_id);

create function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_set_updated_at
  before update on products
  for each row execute procedure set_updated_at();

-- ============ AUTO-CREATE PROFILE (+ FARM) ON SIGNUP ============

create function public.handle_new_user()
returns trigger as $$
declare
  new_role user_role;
  farm_name text;
  farm_slug text;
begin
  new_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'buyer');

  insert into public.profiles (id, role, full_name, restaurant_name)
  values (
    new.id,
    new_role,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'restaurant_name'
  );

  if new_role = 'producer' then
    farm_name := coalesce(new.raw_user_meta_data->>'farm_name', new.raw_user_meta_data->>'full_name', 'New Farm');
    farm_slug := lower(regexp_replace(farm_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 6);

    insert into public.farms (owner_id, slug, name, location)
    values (new.id, farm_slug, farm_name, new.raw_user_meta_data->>'farm_location');
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ HELPER: is the current user an admin? ============

create function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ============ ROW LEVEL SECURITY ============

alter table profiles enable row level security;
alter table farms enable row level security;
alter table products enable row level security;

-- Profiles: everyone can read (needed to show farm owner names etc.), only owner or admin can update
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_own_or_admin" on profiles for update
  using (auth.uid() = id or public.is_admin());

-- Farms: public read, owner or admin can insert/update/delete
create policy "farms_select_all" on farms for select using (true);
create policy "farms_insert_own_or_admin" on farms for insert
  with check (auth.uid() = owner_id or public.is_admin());
create policy "farms_update_own_or_admin" on farms for update
  using (auth.uid() = owner_id or public.is_admin());
create policy "farms_delete_own_or_admin" on farms for delete
  using (auth.uid() = owner_id or public.is_admin());

-- Products: public read, only the owning producer (via their farm) or admin can write
create policy "products_select_all" on products for select using (true);
create policy "products_insert_own_or_admin" on products for insert
  with check (
    public.is_admin() or
    auth.uid() = (select owner_id from farms where farms.id = products.farm_id)
  );
create policy "products_update_own_or_admin" on products for update
  using (
    public.is_admin() or
    auth.uid() = (select owner_id from farms where farms.id = products.farm_id)
  );
create policy "products_delete_own_or_admin" on products for delete
  using (
    public.is_admin() or
    auth.uid() = (select owner_id from farms where farms.id = products.farm_id)
  );

-- Storage (product photo uploads) is set up separately in schema_storage.sql —
-- run that one AFTER you've opened the Storage tab in the dashboard at least once.

-- ============ ONE-TIME: promote your own account to admin ============
-- After you sign up once through the site, run this (replace the email):
--
-- update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
