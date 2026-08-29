-- Grano: multi-role accounts. One Grano account can hold multiple roles (producer,
-- restaurant, customer) at once and switch between them, instead of being locked into
-- whichever single role was picked at signup. This is the foundation the restaurant
-- hub, consumer hub, and wholesale marketplace all build on top of later.
--
-- Run this AFTER schema_fix_orders_recursion.sql.

create table if not exists account_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index if not exists account_roles_user_id_idx on account_roles(user_id);

-- Backfill: every existing account keeps the one role it already had.
insert into account_roles (user_id, role)
select id, role from profiles
on conflict (user_id, role) do nothing;

alter table account_roles enable row level security;

create policy "account_roles_select_own_or_admin" on account_roles for select
  using (auth.uid() = user_id or public.is_admin());

-- Self-service: a signed-in user can add themselves a producer/restaurant/customer
-- role at any time (e.g. "Become a Producer" from the dashboard). They can never grant
-- themselves admin that way — admin stays a manual, out-of-band promotion.
create policy "account_roles_insert_own_nonadmin" on account_roles for insert
  with check (auth.uid() = user_id and role <> 'admin');
create policy "account_roles_insert_admin_grant" on account_roles for insert
  with check (public.is_admin());

create policy "account_roles_delete_own_nonadmin_or_admin" on account_roles for delete
  using ((auth.uid() = user_id and role <> 'admin') or public.is_admin());

-- RLS-safe membership check other policies call instead of re-querying account_roles
-- directly inline (keeps this out of the same cross-table recursion trap
-- orders/order_items hit earlier — SECURITY DEFINER here means this function's own
-- internal query bypasses RLS instead of re-triggering it).
create or replace function public.has_role(p_role user_role)
returns boolean as $$
  select exists (select 1 from account_roles where user_id = auth.uid() and role = p_role);
$$ language sql security definer stable set search_path = public;

grant execute on function public.has_role(user_role) to authenticated, anon;

-- ============ MIGRATE EXISTING ROLE-GATED POLICIES ============
-- Previously these checked profiles.role (a single value), so a restaurant that also
-- became a producer would have silently lost restaurant-only permissions. Now they
-- check account_roles membership via has_role(), which supports holding both.

drop policy if exists "reviews_insert_verified" on reviews;
create policy "reviews_insert_verified" on reviews for insert
  with check (
    auth.uid() = buyer_id
    and (
      public.has_role('restaurant')
      or (
        order_id is not null
        and exists (
          select 1 from orders o join order_items oi on oi.order_id = o.id
          where o.id = order_id and o.buyer_id = auth.uid() and oi.farm_id = reviews.farm_id
        )
      )
    )
  );

drop policy if exists "messages_insert_own_restaurant" on messages;
create policy "messages_insert_own_restaurant" on messages for insert
  with check (auth.uid() = sender_id and public.has_role('restaurant'));

-- ============ SIGNUP: SUPPORT SELECTING MULTIPLE ROLES ============
-- Replaces handle_new_user() so a signup can carry a `roles` array (new — one row per
-- selected role) instead of only a single `role` string, and still auto-creates a farm
-- if "producer" is one of the selected roles.
--
-- SECURITY FIX while rewriting this: the previous version trusted
-- raw_user_meta_data->>'role' completely, including the literal string "admin" — any
-- signup could have self-granted admin by passing role: 'admin' in the signup call.
-- This version strips 'admin' out of any self-signup role list before using it; admin
-- can only be granted later, out-of-band, via the one-time SQL promotion at the bottom
-- of schema.sql or by an existing admin.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  roles_json jsonb;
  role_list user_role[];
  r user_role;
  primary_role user_role;
  farm_name text;
  farm_slug text;
begin
  roles_json := new.raw_user_meta_data->'roles';

  if roles_json is not null and jsonb_typeof(roles_json) = 'array' and jsonb_array_length(roles_json) > 0 then
    select array_agg(elem::user_role) into role_list from jsonb_array_elements_text(roles_json) as elem;
  else
    role_list := array[coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')];
  end if;

  -- never let self-signup grant admin
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

  return new;
end;
$$ language plpgsql security definer set search_path = public;
