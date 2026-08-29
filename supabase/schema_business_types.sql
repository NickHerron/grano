-- "Business type" self-classification for both sides of the marketplace — separate
-- from farms.producer_type/secondary_types (the detailed niche taxonomy that drives
-- document requirements and directory filtering). This is the broader, checkbox-style
-- categorization a business picks at signup ("what kind of producer/vendor are you?")
-- and can revise later from their profile. Additive only — nothing existing changes.

alter table farms add column if not exists business_types text[] default '{}';
comment on column farms.business_types is 'Self-selected business categories chosen at signup / editable in profile — e.g. Farm & Grower, Bakery, Coffee. Multiple allowed. Separate from producer_type/secondary_types.';

alter table restaurants add column if not exists business_types text[] default '{}';
comment on column restaurants.business_types is 'Self-selected business categories chosen at signup / editable in profile — e.g. Restaurant & Dining, Cafe & Coffee. Multiple allowed. Separate from restaurant_type.';

-- Rebuild handle_new_user() (same base as schema_restaurants.sql's version) so signup
-- can also carry farm_business_types / restaurant_business_types (jsonb arrays of
-- strings from the signup form) into the new columns on first insert.
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
  farm_business_types text[];
  restaurant_business_types text[];
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

    if jsonb_typeof(new.raw_user_meta_data->'farm_business_types') = 'array' then
      select array_agg(elem) into farm_business_types from jsonb_array_elements_text(new.raw_user_meta_data->'farm_business_types') as elem;
    end if;

    insert into public.farms (owner_id, slug, name, location, business_types)
    values (new.id, farm_slug, farm_name, new.raw_user_meta_data->>'farm_location', coalesce(farm_business_types, '{}'));
  end if;

  if 'restaurant' = any(role_list) then
    restaurant_name := coalesce(new.raw_user_meta_data->>'restaurant_name', new.raw_user_meta_data->>'full_name', 'New Restaurant');
    restaurant_slug := lower(regexp_replace(restaurant_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 6);

    if jsonb_typeof(new.raw_user_meta_data->'restaurant_business_types') = 'array' then
      select array_agg(elem) into restaurant_business_types from jsonb_array_elements_text(new.raw_user_meta_data->'restaurant_business_types') as elem;
    end if;

    insert into public.restaurants (owner_id, slug, name, business_types)
    values (new.id, restaurant_slug, restaurant_name, coalesce(restaurant_business_types, '{}'));
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
