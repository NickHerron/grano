-- Adds an organization branch to handle_new_user() — the SECURITY DEFINER trigger on
-- auth.users that already creates a farms/restaurants row at signup when 'producer'/
-- 'restaurant' is selected. Every existing line below is copied verbatim from the
-- current live function (confirmed by direct empirical testing — a disposable signup
-- with producer+restaurant+customer roles was created and its resulting profiles/
-- account_roles/farms/restaurants rows compared against every handle_new_user()
-- definition in the migration history to find the exact one matching live behavior,
-- since "create or replace function" across several files makes the true current
-- definition otherwise ambiguous from file order alone). ONLY the new organization_
-- name/wants_organization handling is added.
--
-- Deliberately does NOT touch account_roles or the roles array/primary_role logic —
-- an organization is not an account role, same principle as
-- dashboard/organization/actions.js's createOrganization(): "creating an organization
-- is not a new account role, it's a business row anyone signed in can create."
-- Deliberately does NOT run the duplicate-name check that the dashboard's
-- organization-creation flow has (organizationNames.js's findSimilarOrganizations) —
-- replicating that logic in PL/pgSQL is real added complexity for the highest-risk
-- function in the app; a signup-created organization with a near-duplicate name is
-- still reachable and fixable afterward through the same admin/dashboard tools that
-- already exist for any organization.

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
  organization_name text;
  organization_slug text;
  new_organization_id uuid;
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

  -- New: a Farmers Market / Organization checkbox on signup, independent of the
  -- roles array above — no account_roles row, matching the dashboard's own
  -- createOrganization(). Hardcoded to 'farmers_market' rather than reading a type
  -- from metadata: that value is the one guaranteed valid against BOTH
  -- organizations.org_type's CHECK constraint and business_roles.role_key's (which
  -- don't share an identical vocabulary — org_type also allows 'other', which
  -- role_key does not — so accepting an arbitrary type here could fail the
  -- business_roles insert and roll back the entire signup transaction). The owner
  -- can change the type/add roles afterward from the org's own dashboard page, same
  -- "fast create, fill in detail after" pattern every other creation path here
  -- already follows.
  if coalesce((new.raw_user_meta_data->>'wants_organization')::boolean, false) then
    organization_name := coalesce(new.raw_user_meta_data->>'organization_name', new.raw_user_meta_data->>'full_name', 'New Organization');
    organization_slug := lower(regexp_replace(organization_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 6);

    insert into public.organizations (owner_id, slug, name, org_type)
    values (new.id, organization_slug, organization_name, 'farmers_market')
    returning id into new_organization_id;

    insert into public.business_roles (business_type, business_id, role_key, is_primary)
    values ('organization', new_organization_id, 'farmers_market', true)
    on conflict do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
