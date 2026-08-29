-- Lets a producer reply to a message from a restaurant. Wholesale inquiries already
-- support a producer_response; free-text messages ("any tomatoes?") had no way for
-- the farm to write back — this adds that.
--
-- While in here: fixes messages_insert_own_buyer and reviews_insert_own_buyer, which
-- have been silently broken since schema_roles_v2.sql renamed the 'buyer' enum value
-- to 'restaurant'. Both policies still compared role to the now-nonexistent 'buyer'
-- label, so no restaurant account could ever satisfy them — meaning sending a new
-- message or submitting a review has been blocked at the database level since that
-- rename. Rewritten to use has_role('restaurant'), matching the pattern already used
-- for wholesale_inquiries and everything else built after the account_roles system.

alter table messages add column if not exists recipient_id uuid references profiles(id) on delete set null;
create index if not exists messages_recipient_id_idx on messages(recipient_id);
comment on column messages.recipient_id is 'Set when a producer replies to a specific restaurant, so that restaurant can see the reply. Null on the original restaurant -> farm message (farm_id already identifies the recipient there).';

drop policy if exists "messages_select" on messages;
create policy "messages_select" on messages for select using (
  auth.uid() = sender_id
  or auth.uid() = recipient_id
  or public.is_admin()
  or (farm_id is null and public.has_role('producer'))
  or (farm_id is not null and auth.uid() = (select owner_id from farms where farms.id = messages.farm_id))
);

drop policy if exists "messages_insert_own_buyer" on messages;
create policy "messages_insert_restaurant_to_farm" on messages for insert
  with check (
    auth.uid() = sender_id
    and recipient_id is null
    and public.has_role('restaurant')
  );

create policy "messages_insert_farm_reply" on messages for insert
  with check (
    auth.uid() = sender_id
    and farm_id is not null
    and recipient_id is not null
    and auth.uid() = (select owner_id from farms where farms.id = messages.farm_id)
  );

drop policy if exists "reviews_insert_own_buyer" on reviews;
create policy "reviews_insert_own_restaurant" on reviews for insert
  with check (
    auth.uid() = buyer_id
    and public.has_role('restaurant')
  );
