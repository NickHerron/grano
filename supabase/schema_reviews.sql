-- Grano reviews system — run this AFTER schema.sql, once, in the Supabase SQL Editor.
-- Adds real buyer reviews that drive each farm's rating and restaurant count.

create table reviews (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  buyer_id uuid not null references profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  text text,
  flavor smallint check (flavor between 1 and 5),
  consistency smallint check (consistency between 1 and 5),
  shelf_life smallint check (shelf_life between 1 and 5),
  communication smallint check (communication between 1 and 5),
  created_at timestamptz not null default now()
);

create index reviews_farm_id_idx on reviews(farm_id);

-- Aggregated per-farm stats derived from real reviews
create view farm_stats as
select
  farm_id,
  round(avg(rating)::numeric, 1) as avg_rating,
  count(distinct buyer_id) as restaurant_count,
  count(*) as review_count
from reviews
group by farm_id;

grant select on farm_stats to anon, authenticated;

-- ============ ROW LEVEL SECURITY ============

alter table reviews enable row level security;

create policy "reviews_select_all" on reviews for select using (true);

create policy "reviews_insert_own_buyer" on reviews for insert
  with check (
    auth.uid() = buyer_id
    and exists (select 1 from profiles where id = auth.uid() and role = 'buyer')
  );

create policy "reviews_update_own_or_admin" on reviews for update
  using (auth.uid() = buyer_id or public.is_admin());

create policy "reviews_delete_own_or_admin" on reviews for delete
  using (auth.uid() = buyer_id or public.is_admin());
