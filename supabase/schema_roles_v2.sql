-- Grano roles v2 — run this AFTER schema.sql, schema_reviews.sql, schema_messages.sql.
-- Splits the old single "buyer" role into two: "customer" (a general account with no
-- special marketplace permissions yet) and "restaurant" (can message producers and
-- leave reviews — this is what "buyer" always meant in practice). Existing buyer
-- accounts are automatically carried over as "restaurant".

alter type user_role rename value 'buyer' to 'restaurant';
alter type user_role add value 'customer';

-- Signup trigger: new accounts default to "customer" now, not "restaurant"
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_role user_role;
  farm_name text;
  farm_slug text;
begin
  new_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer');

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

-- Reviews: only restaurants (not plain customers) can post one
drop policy if exists "reviews_insert_own_buyer" on reviews;
create policy "reviews_insert_own_restaurant" on reviews for insert
  with check (
    auth.uid() = buyer_id
    and exists (select 1 from profiles where id = auth.uid() and role = 'restaurant')
  );

-- Messages: only restaurants (not plain customers) can send one
drop policy if exists "messages_insert_own_buyer" on messages;
create policy "messages_insert_own_restaurant" on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (select 1 from profiles where id = auth.uid() and role = 'restaurant')
  );
