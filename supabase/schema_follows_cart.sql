-- Grano follows + cart — run this AFTER schema.sql.
-- Real, persisted "Follow a producer" and a real per-account shopping cart.

-- ============ FOLLOWS ============

create table follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles(id) on delete cascade,
  farm_id uuid not null references farms(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, farm_id)
);

create index follows_farm_id_idx on follows(farm_id);
create index follows_follower_id_idx on follows(follower_id);

alter table follows enable row level security;

create policy "follows_select_own" on follows for select using (auth.uid() = follower_id);
create policy "follows_insert_own" on follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own" on follows for delete using (auth.uid() = follower_id);

-- ============ CART ============

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index cart_items_user_id_idx on cart_items(user_id);

create trigger cart_items_set_updated_at
  before update on cart_items
  for each row execute procedure set_updated_at();

alter table cart_items enable row level security;

create policy "cart_items_select_own" on cart_items for select using (auth.uid() = user_id);
create policy "cart_items_insert_own" on cart_items for insert with check (auth.uid() = user_id);
create policy "cart_items_update_own" on cart_items for update using (auth.uid() = user_id);
create policy "cart_items_delete_own" on cart_items for delete using (auth.uid() = user_id);
