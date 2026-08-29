-- Grano: Restaurant / Buyer public profiles — the first real piece of Part 2 from the
-- three-sided network spec. Mirrors how `farms` works for producers: one row per
-- restaurant-role account, public read, owner-only write, auto-created on signup or
-- when a user self-adds the restaurant role from the dashboard.
--
-- Run this AFTER schema_account_roles.sql.

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  slug text unique not null,
  name text not null,
  legal_name text,
  restaurant_type text,        -- Restaurant | Cafe | Bakery | Bar | Catering Company | Hotel | Grocery Store | Specialty Retailer | Food Truck | Institution | School / University | Other
  cuisine text,
  location text,
  neighborhood text,
  address text,
  hours text,
  website text,
  instagram text,
  logo_url text,
  cover_photo_url text,
  about text,
  chef_name text,
  years_operating integer,
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'verified')),
  profile_view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists restaurants_owner_id_idx on restaurants(owner_id);

create trigger restaurants_set_updated_at
  before update on restaurants
  for each row execute procedure set_updated_at();

alter table restaurants enable row level security;

create policy "restaurants_select_all" on restaurants for select using (true);
create policy "restaurants_insert_own_or_admin" on restaurants for insert
  with check (auth.uid() = owner_id or public.is_admin());
create policy "restaurants_update_own_or_admin" on restaurants for update
  using (auth.uid() = owner_id or public.is_admin());
create policy "restaurants_delete_own_or_admin" on restaurants for delete
  using (auth.uid() = owner_id or public.is_admin());

-- Only an admin can flip verification_status — same column-level-protection trick used
-- for farms.verification_status, since RLS can't restrict a single column.
create or replace function public.protect_restaurant_verification_status()
returns trigger as $$
begin
  if new.verification_status is distinct from old.verification_status and not public.is_admin() then
    new.verification_status := old.verification_status;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger restaurants_protect_verification_status
  before update on restaurants
  for each row execute procedure public.protect_restaurant_verification_status();

-- ============ AUTO-CREATE A RESTAURANT PROFILE ALONGSIDE THE FARM LOGIC ============
-- Mirrors the "producer -> farm" auto-create in handle_new_user(): if "restaurant" is
-- one of the roles selected at signup, create a starter restaurant profile too.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  roles_json jsonb;
  role_list user_role[];
  r user_role;
  primary_role user_role;
  farm_name text;
  farm_slug text;
  restaurant_name text;
  restaurant_slug text;
begin
  roles_json := new.raw_user_meta_data->'roles';

  if roles_json is not null and jsonb_typeof(roles_json) = 'array' and jsonb_array_length(roles_json) > 0 then
    select array_agg(elem::user_role) into role_list from jsonb_array_elements_text(roles_json) as elem;
  else
    role_list := array[coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')];
  end if;

  role_list := array(select unnest(role_list) except select 'admin'::user_role);
  if role_list is null or array_length(role_list, 1) is null then
    role_list := array['customer'::user_role];
  end if;

  primary_role := role_list[1];

  insert into public.profiles (id, role, full_name, restaurant_name)
  values (
    new.id,
    primary_role,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'restaurant_name'
  );

  foreach r in array role_list loop
    insert into public.account_roles (user_id, role) values (new.id, r) on conflict do nothing;
  end loop;

  if 'producer' = any(role_list) then
    farm_name := coalesce(new.raw_user_meta_data->>'farm_name', new.raw_user_meta_data->>'full_name', 'New Farm');
    farm_slug := lower(regexp_replace(farm_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 6);

    insert into public.farms (owner_id, slug, name, location)
    values (new.id, farm_slug, farm_name, new.raw_user_meta_data->>'farm_location');
  end if;

  if 'restaurant' = any(role_list) then
    restaurant_name := coalesce(new.raw_user_meta_data->>'restaurant_name', new.raw_user_meta_data->>'full_name', 'New Restaurant');
    restaurant_slug := lower(regexp_replace(restaurant_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 6);

    insert into public.restaurants (owner_id, slug, name)
    values (new.id, restaurant_slug, restaurant_name);
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
