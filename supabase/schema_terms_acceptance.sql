-- Records when each account agreed to the Terms of Service (src/app/terms/page.jsx),
-- so acceptance has an actual audit trail rather than just a client-side checkbox that
-- leaves no record. Set once, server-side, at the moment handle_new_user() runs — not
-- from a client-supplied timestamp — since the signup form already refuses to call
-- auth.signUp() at all unless the box is checked, so a row being created here means
-- the box was checked at that instant.

alter table profiles add column if not exists terms_accepted_at timestamptz;
comment on column profiles.terms_accepted_at is 'When this account agreed to the Grano Terms of Service, set server-side at signup.';

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

  insert into public.profiles (id, role, full_name, restaurant_name, terms_accepted_at)
  values (
    new.id,
    primary_role,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'restaurant_name',
    now()
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
