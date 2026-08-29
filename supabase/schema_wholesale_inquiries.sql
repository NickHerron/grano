-- Grano: Wholesale Inquiries + "My Vendors." The producer -> restaurant half of the
-- three-sided discovery loop (sourcing_requests was restaurant -> producer). A
-- restaurant can send a structured wholesale inquiry about a specific producer/product;
-- the producer can accept, decline, or respond. "My Vendors" itself needs no new
-- table — it's just the existing `follows` table read back from the restaurant's side.
--
-- Per the spec: "Do not build a complex messaging system yet. Create the architecture
-- for future messaging." This is intentionally a status-tracked inquiry, not a thread —
-- the existing `messages` table remains the freeform contact channel.
--
-- Run this AFTER schema_sourcing_requests.sql.

create table if not exists wholesale_inquiries (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  farm_id uuid not null references farms(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text,             -- snapshot so the inquiry still reads sensibly if the product is later removed
  quantity text,
  frequency text check (frequency in ('weekly', 'biweekly', 'monthly', 'seasonal', 'one_time')),
  start_date date,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'info_requested')),
  producer_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wholesale_inquiries_restaurant_id_idx on wholesale_inquiries(restaurant_id);
create index if not exists wholesale_inquiries_farm_id_idx on wholesale_inquiries(farm_id);

create trigger wholesale_inquiries_set_updated_at
  before update on wholesale_inquiries
  for each row execute procedure set_updated_at();

alter table wholesale_inquiries enable row level security;

create policy "wholesale_inquiries_select_own_either_side_or_admin" on wholesale_inquiries for select
  using (
    public.is_admin()
    or auth.uid() = (select owner_id from restaurants where restaurants.id = wholesale_inquiries.restaurant_id)
    or auth.uid() = (select owner_id from farms where farms.id = wholesale_inquiries.farm_id)
  );

-- Only a restaurant-role account can open an inquiry, and only as their own restaurant
-- (mirrors the existing "only restaurants can message" rule).
create policy "wholesale_inquiries_insert_own_restaurant" on wholesale_inquiries for insert
  with check (
    public.has_role('restaurant')
    and auth.uid() = (select owner_id from restaurants where restaurants.id = wholesale_inquiries.restaurant_id)
  );

-- The producer decides status/response; the restaurant can only withdraw (delete)
-- while it's still pending.
create policy "wholesale_inquiries_update_farm_owner_or_admin" on wholesale_inquiries for update
  using (
    public.is_admin()
    or auth.uid() = (select owner_id from farms where farms.id = wholesale_inquiries.farm_id)
  );

create policy "wholesale_inquiries_delete_own_pending_or_admin" on wholesale_inquiries for delete
  using (
    public.is_admin()
    or (status = 'pending' and auth.uid() = (select owner_id from restaurants where restaurants.id = wholesale_inquiries.restaurant_id))
    or auth.uid() = (select owner_id from farms where farms.id = wholesale_inquiries.farm_id)
  );
