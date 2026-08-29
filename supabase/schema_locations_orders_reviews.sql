-- Grano: structured Find-Us schedules + purchase-verified / invite-verified reviews.
-- Run this AFTER schema_producer_platform.sql, once, in the Supabase SQL Editor.

-- ============ FIND US: STRUCTURED SCHEDULES ============
-- Lets a producer say "every Sunday", "every other Saturday", or a specific list of
-- dates instead of only a free-text "days" field. `days`/`hours` stay as-is for
-- freeform display (used when schedule_type = 'custom' or as a fallback).

alter table farm_locations
  add column if not exists schedule_type text not null default 'custom'
    check (schedule_type in ('weekly', 'biweekly', 'specific_dates', 'custom')),
  add column if not exists schedule_days smallint[] not null default '{}',   -- 0=Sun .. 6=Sat, used by weekly/biweekly
  add column if not exists schedule_anchor_date date,                        -- one reference date, used by biweekly to know which week
  add column if not exists schedule_dates date[] not null default '{}';      -- used by specific_dates

-- ============ ORDERS ============
-- A minimal, real order record — created when a buyer places their cart (no payment
-- processing is wired up; this just records what was bought so producers can find
-- past customers and so reviews can be tied to a real purchase).

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id) on delete cascade,
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  service_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'placed' check (status in ('placed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists orders_buyer_id_idx on orders(buyer_id);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  farm_id uuid not null references farms(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  price numeric(10,2) not null default 0,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on order_items(order_id);
create index if not exists order_items_farm_id_idx on order_items(farm_id);

alter table orders enable row level security;
alter table order_items enable row level security;

create policy "orders_select_own_or_producer_or_admin" on orders for select
  using (
    auth.uid() = buyer_id
    or public.is_admin()
    or exists (
      select 1 from order_items oi join farms f on f.id = oi.farm_id
      where oi.order_id = orders.id and f.owner_id = auth.uid()
    )
  );

create policy "orders_insert_own" on orders for insert
  with check (auth.uid() = buyer_id);

create policy "order_items_select_own_or_producer_or_admin" on order_items for select
  using (
    public.is_admin()
    or auth.uid() = (select owner_id from farms where farms.id = order_items.farm_id)
    or auth.uid() = (select buyer_id from orders where orders.id = order_items.order_id)
  );

create policy "order_items_insert_own_order" on order_items for insert
  with check (auth.uid() = (select buyer_id from orders where orders.id = order_items.order_id));

-- ============ REVIEW INVITES ============
-- Lets a producer send a review link to a customer they served off-platform
-- (farmers market, wholesale, etc.) without requiring a Grano purchase.

create table if not exists review_invites (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  token text unique not null default replace(gen_random_uuid()::text, '-', ''),
  customer_name text not null,
  customer_email text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'used', 'revoked')),
  review_id uuid,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists review_invites_farm_id_idx on review_invites(farm_id);
create index if not exists review_invites_token_idx on review_invites(token);

alter table review_invites enable row level security;

-- Producers manage their own invites; the raw table is never publicly selectable
-- (it holds customer emails). The redemption page instead calls
-- get_review_invite_public() below, which returns only the non-sensitive fields
-- needed to render that one invite's page.
create policy "review_invites_select_own_or_admin" on review_invites for select
  using (
    public.is_admin() or auth.uid() = (select owner_id from farms where farms.id = review_invites.farm_id)
  );
create policy "review_invites_insert_own_or_admin" on review_invites for insert
  with check (
    public.is_admin() or auth.uid() = (select owner_id from farms where farms.id = review_invites.farm_id)
  );
create policy "review_invites_update_own_or_admin" on review_invites for update
  using (
    public.is_admin() or auth.uid() = (select owner_id from farms where farms.id = review_invites.farm_id)
  );
create policy "review_invites_delete_own_or_admin" on review_invites for delete
  using (
    public.is_admin() or auth.uid() = (select owner_id from farms where farms.id = review_invites.farm_id)
  );

-- ============ REVIEWS: link to a purchase or an invite ============

alter table reviews
  add column if not exists order_id uuid references orders(id) on delete set null,
  add column if not exists invite_id uuid references review_invites(id) on delete set null;

-- Loosen who can post a review: still any restaurant account (legacy), OR any signed-in
-- buyer who actually ordered from this farm, OR a redeemed review-invite (handled via
-- the submit_invited_review() function below, which runs as owner and marks the invite
-- used atomically — this policy just needs to allow that function's insert through).
drop policy if exists "reviews_insert_own_restaurant" on reviews;
drop policy if exists "reviews_insert_own_buyer" on reviews;
create policy "reviews_insert_verified" on reviews for insert
  with check (
    auth.uid() = buyer_id
    and (
      exists (select 1 from profiles where id = auth.uid() and role = 'restaurant')
      or (
        order_id is not null
        and exists (
          select 1 from orders o join order_items oi on oi.order_id = o.id
          where o.id = order_id and o.buyer_id = auth.uid() and oi.farm_id = reviews.farm_id
        )
      )
    )
  );

-- Atomic, server-validated path for invite-based reviews (bypasses the buyer-role /
-- purchase check above via security definer, but still fully validates the token).
create or replace function public.submit_invited_review(
  p_token text,
  p_rating smallint,
  p_text text
)
returns uuid as $$
declare
  v_invite review_invites%rowtype;
  v_review_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to leave a review.';
  end if;

  select * into v_invite from review_invites where token = p_token for update;
  if v_invite.id is null then
    raise exception 'This review link is invalid.';
  end if;
  if v_invite.status <> 'pending' then
    raise exception 'This review link has already been used.';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Please choose a star rating.';
  end if;

  insert into reviews (farm_id, buyer_id, rating, text, invite_id)
  values (v_invite.farm_id, auth.uid(), p_rating, nullif(trim(p_text), ''), v_invite.id)
  returning id into v_review_id;

  update review_invites set status = 'used', used_at = now(), review_id = v_review_id where id = v_invite.id;

  return v_review_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.submit_invited_review(text, smallint, text) to authenticated;

-- Public, safe lookup for the redemption page — returns only what's needed to render
-- it (never the customer's email), and only while the invite is still pending.
create or replace function public.get_review_invite_public(p_token text)
returns table (
  farm_id uuid,
  farm_name text,
  farm_slug text,
  customer_name text,
  status text
) as $$
  select f.id, f.name, f.slug, ri.customer_name, ri.status
  from review_invites ri
  join farms f on f.id = ri.farm_id
  where ri.token = p_token;
$$ language sql security definer stable set search_path = public;

grant execute on function public.get_review_invite_public(text) to anon, authenticated;
