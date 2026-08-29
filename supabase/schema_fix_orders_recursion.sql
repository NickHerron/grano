-- Fixes "infinite recursion detected in policy for relation 'orders'" — the orders and
-- order_items RLS policies each queried the other table to check buyer/producer
-- ownership, and each of those subqueries re-triggers the other table's RLS policy,
-- which queries back again, forever. Run this AFTER schema_locations_orders_reviews.sql.
--
-- Fix: two small SECURITY DEFINER helper functions do the cross-table ownership checks
-- internally (bypassing RLS, since they're owned by the table owner), so the policies
-- that call them no longer trigger the other table's policy evaluation.

create or replace function public.order_belongs_to_buyer(p_order_id uuid)
returns boolean as $$
  select exists (select 1 from orders where id = p_order_id and buyer_id = auth.uid());
$$ language sql security definer stable set search_path = public;

create or replace function public.order_contains_farm_owned_by_caller(p_order_id uuid)
returns boolean as $$
  select exists (
    select 1 from order_items oi join farms f on f.id = oi.farm_id
    where oi.order_id = p_order_id and f.owner_id = auth.uid()
  );
$$ language sql security definer stable set search_path = public;

drop policy if exists "orders_select_own_or_producer_or_admin" on orders;
create policy "orders_select_own_or_producer_or_admin" on orders for select
  using (
    auth.uid() = buyer_id
    or public.is_admin()
    or public.order_contains_farm_owned_by_caller(orders.id)
  );

drop policy if exists "order_items_select_own_or_producer_or_admin" on order_items;
create policy "order_items_select_own_or_producer_or_admin" on order_items for select
  using (
    public.is_admin()
    or auth.uid() = (select owner_id from farms where farms.id = order_items.farm_id)
    or public.order_belongs_to_buyer(order_items.order_id)
  );

drop policy if exists "order_items_insert_own_order" on order_items;
create policy "order_items_insert_own_order" on order_items for insert
  with check (public.order_belongs_to_buyer(order_items.order_id));
