-- Phase 2 of the Geographic Foundation plan.
--
-- market_areas is a short, deliberately admin-curated list of "areas Grano is
-- tracking as a distinct market" — NOT auto-populated from every city with any
-- activity (mirroring how business_roles' role vocabulary is curated, not
-- exhaustive). It is purely presentational: it decides whether a /locations discovery
-- page shows "Shop Local" language for that area. It is NOT a new purchase gate —
-- src/lib/marketplace.js's getLiveMarketplaceEnabled() (the site_settings row above)
-- remains the sole real checkout gate, completely unchanged by this migration. A
-- discovery page's shop CTA is gated on (global enabled AND this area's enabled) —
-- an AND, never an OR — so this table can only ever narrow what's shown, never widen
-- it beyond what the real global switch already allows.

create table if not exists market_areas (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  state text not null,
  slug text not null,
  marketplace_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists market_areas_state_slug_idx on market_areas(state, slug);

alter table market_areas enable row level security;
create policy "market_areas_select_all" on market_areas for select using (true);
create policy "market_areas_insert_admin" on market_areas for insert with check (public.is_admin());
create policy "market_areas_update_admin" on market_areas for update using (public.is_admin());
create policy "market_areas_delete_admin" on market_areas for delete using (public.is_admin());

-- Seed exactly one row, copying the LIVE current value of the real global switch —
-- production behavior is byte-identical to before this migration the instant it runs.
insert into market_areas (city, state, slug, marketplace_enabled)
select 'Chicago', 'IL', 'chicago', live_marketplace_enabled from site_settings where id = true
on conflict (state, slug) do nothing;
