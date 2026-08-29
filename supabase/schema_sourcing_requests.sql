-- Grano: Sourcing Requests — "What We're Looking For." Lets a restaurant tell Grano
-- what they want to buy (product, quantity, frequency, season, budget, preferences),
-- so producers can discover restaurants actively looking for what they grow or make.
-- This is the restaurant -> producer half of the three-sided discovery loop.
--
-- Per the spec: this phase makes requests discoverable, not a response/inquiry
-- workflow yet (that's a later "Wholesale Inquiries" phase) — producers can see a
-- request and go message the restaurant via existing channels, nothing automated yet.
--
-- Run this AFTER schema_restaurants.sql.

create table if not exists sourcing_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  product_name text not null,
  category text,
  quantity text,                 -- free text, e.g. "50 lbs" — deliberately not a strict number+unit pair
  frequency text not null default 'weekly' check (frequency in ('weekly', 'biweekly', 'monthly', 'seasonal', 'one_time')),
  season_start_month smallint check (season_start_month between 1 and 12),
  season_end_month smallint check (season_end_month between 1 and 12),
  preferred_location text,
  budget_target text,            -- free text, e.g. "$2-3/lb" or "flexible"
  wholesale_only boolean not null default true,
  organic_preference boolean not null default false,
  delivery_preference text not null default 'either' check (delivery_preference in ('pickup', 'delivery', 'either')),
  notes text,
  status text not null default 'open' check (status in ('open', 'fulfilled', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sourcing_requests_restaurant_id_idx on sourcing_requests(restaurant_id);
create index if not exists sourcing_requests_status_idx on sourcing_requests(status);

create trigger sourcing_requests_set_updated_at
  before update on sourcing_requests
  for each row execute procedure set_updated_at();

alter table sourcing_requests enable row level security;

-- Public read (this is a discoverable "want ad" for producers, like a farm's public
-- info) — write restricted to the owning restaurant or an admin.
create policy "sourcing_requests_select_all" on sourcing_requests for select using (true);

create policy "sourcing_requests_insert_own_or_admin" on sourcing_requests for insert
  with check (
    public.is_admin()
    or auth.uid() = (select owner_id from restaurants where restaurants.id = sourcing_requests.restaurant_id)
  );
create policy "sourcing_requests_update_own_or_admin" on sourcing_requests for update
  using (
    public.is_admin()
    or auth.uid() = (select owner_id from restaurants where restaurants.id = sourcing_requests.restaurant_id)
  );
create policy "sourcing_requests_delete_own_or_admin" on sourcing_requests for delete
  using (
    public.is_admin()
    or auth.uid() = (select owner_id from restaurants where restaurants.id = sourcing_requests.restaurant_id)
  );
