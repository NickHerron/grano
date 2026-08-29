-- Product "Sourced From" — Phase 7 of the Producer Onboarding Wizard, SQL only. Lets
-- a producer credit another business as the source of an ingredient in one of their
-- products (e.g. "our bread uses flour from Sunrise Grain Co."). Modeled on
-- business_relationships' polymorphic (type, id) pattern (schema_business_network.sql)
-- for the same reason: farms and restaurants are separate tables, so there's no single
-- "businesses" table to point a plain FK at.
--
-- Per the confirmed decision, this is NOT gated behind the credited business
-- confirming anything — the credit displays publicly the moment the producer saves
-- it. The separate, mutual Local Network relationship (business_relationships) stays
-- fully opt-in and unchanged; relationship_id below is an optional pointer TO one,
-- filled in only if/when the producer already has that connection or explicitly
-- creates one via the "Add to your Local Network?" prompt after tagging (Phase 8).
-- Nothing here ever inserts into business_relationships on its own.

create table if not exists product_sources (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  source_type text not null check (source_type in ('farm', 'restaurant')),
  source_id uuid not null,
  -- Optional: which specific product of the source business this is (e.g. links the
  -- bread's "flour" credit to the actual flour listing on the miller's profile).
  source_product_id uuid references products(id) on delete set null,
  -- Optional free-text label for when there's no matching product to link, or the
  -- ingredient isn't a listed product at all (e.g. "organic eggs").
  ingredient_label text,
  relationship_id uuid references business_relationships(id) on delete set null,
  created_by uuid not null references profiles(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_sources_product_idx on product_sources(product_id);
create index if not exists product_sources_source_idx on product_sources(source_type, source_id);

-- Reused by all three write policies below — "does the signed-in user own the farm
-- that owns this product." One hop further than owns_business() (schema_business_
-- network.sql), which checks farm/restaurant ownership directly by id, not via a
-- product row — named separately rather than overloading that helper's signature.
create or replace function public.owns_product(p_product_id uuid)
returns boolean as $$
  select exists (
    select 1 from products
    join farms on farms.id = products.farm_id
    where products.id = p_product_id
    and farms.owner_id = (select auth.uid())
  );
$$ language sql security definer stable set search_path = public;

grant execute on function public.owns_product(uuid) to authenticated, anon;

alter table product_sources enable row level security;

-- Public read — same as products_select_all (schema.sql), since a source credit is
-- meant to be seen on the public product page.
create policy "product_sources_select_all" on product_sources for select using (true);

create policy "product_sources_insert_own_or_admin" on product_sources for insert
  with check (
    created_by = (select auth.uid())
    and (public.is_admin() or public.owns_product(product_id))
  );

create policy "product_sources_update_own_or_admin" on product_sources for update
  using (public.is_admin() or public.owns_product(product_id));

create policy "product_sources_delete_own_or_admin" on product_sources for delete
  using (public.is_admin() or public.owns_product(product_id));

-- Integrity guard the RLS policies above can't express: a product can't be "sourced
-- from" the same business that sells it, and if a specific source_product_id is
-- given, it actually has to belong to the named source business — otherwise a credit
-- could point at some other business's unrelated listing.
create or replace function public.enforce_product_source_rules()
returns trigger as $$
declare
  v_product_farm_id uuid;
  v_source_product_farm_id uuid;
begin
  select farm_id into v_product_farm_id from products where id = new.product_id;

  if new.source_type = 'farm' and new.source_id = v_product_farm_id then
    raise exception 'A product cannot be sourced from the same business that sells it.';
  end if;

  if new.source_product_id is not null then
    if new.source_type <> 'farm' then
      -- Restaurants don't have their own product listings in this schema — a
      -- restaurant source can never have a source_product_id.
      raise exception 'source_product_id is only valid when the source is a farm.';
    end if;
    select farm_id into v_source_product_farm_id from products where id = new.source_product_id;
    if v_source_product_farm_id is distinct from new.source_id then
      raise exception 'source_product_id must belong to the named source business.';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists product_sources_enforce_rules on product_sources;
create trigger product_sources_enforce_rules
  before insert or update on product_sources
  for each row execute function public.enforce_product_source_rules();
