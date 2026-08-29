-- Phase 1 of the National Geographic Foundation plan.
--
-- A self-referencing hierarchy of REAL US Census geography (country -> state ->
-- county/metro, state -> place) that sits underneath the existing free-text
-- location/neighborhood/city/state columns on farms/restaurants/organizations/
-- profiles — none of those change in this migration. Nothing reads this table yet;
-- it's populated by a script (scripts/seed-geographies.mjs, Phase 3), not by hand.
--
-- Uniqueness is enforced on Census's own natural keys, NOT on slugs — real data has
-- genuine same-state slug collisions (Oakwood city vs. Oakwood village in Ohio;
-- Richmond County vs. Richmond city in Virginia), so a slug unique constraint would
-- be factually wrong. Keying on the natural id also makes the seed idempotent: every
-- insert is an upsert on (state_fips[, county_fips|place_fips]) or cbsa_code, so a
-- partial failure is just re-run, never manually cleaned up.

create table if not exists geographies (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('country', 'state', 'county', 'metro', 'place', 'neighborhood')),
  name text not null,                 -- "Chicago", "Cook County", "Illinois" — Census's own name, suffix included where Census includes it
  normalized_name text not null,      -- lowercase, for prefix/contains search
  slug text not null,                 -- URL segment — NOT unique on its own, see above
  parent_id uuid references geographies(id) on delete set null,
  -- Cross-cutting references, distinct from parent_id (a place's parent is its state,
  -- matching the URL hierarchy; county/metro are separate lookups a place also has).
  county_geography_id uuid references geographies(id) on delete set null,
  metro_id uuid references geographies(id) on delete set null,
  country_code text,
  state_code text,                    -- 'IL' — denormalized onto county/place rows too, for fast filtering without a parent join
  state_fips text,
  county_fips text,                   -- 3-digit, only meaningful on type='county'
  place_fips text,                    -- 5-digit, only meaningful on type='place'
  cbsa_code text,                     -- only meaningful on type='metro'
  lsad text,                          -- Census legal/statistical area code (city/town/village/CDP/etc — see LSAD_LABELS in src/lib/geography.js)
  funcstat text,                      -- 'A' active governmental unit, 'S' statistical entity (CDP) — only meaningful on type='place'
  latitude numeric,
  longitude numeric,
  population integer,                 -- real Census estimate where available; used ONLY to order autocomplete results and break same-name ties — never read by community/activity selection logic
  population_year integer,
  created_at timestamptz not null default now()
);

-- Natural-key uniqueness, one per type, via partial indexes.
create unique index if not exists geographies_country_key on geographies(country_code) where type = 'country';
create unique index if not exists geographies_state_key on geographies(state_fips) where type = 'state';
create unique index if not exists geographies_county_key on geographies(state_fips, county_fips) where type = 'county';
create unique index if not exists geographies_place_key on geographies(state_fips, place_fips) where type = 'place';
create unique index if not exists geographies_metro_key on geographies(cbsa_code) where type = 'metro';

-- Lookup indexes for the actual query patterns: URL resolution by (type, state, slug),
-- hierarchy walks by parent_id, cross-cutting lookups by county/metro, and prefix
-- search on name (text_pattern_ops makes `ilike 'chicago%'` an index scan instead of
-- a full scan across 30k+ rows on every autocomplete keystroke).
create index if not exists geographies_lookup_idx on geographies(type, state_code, slug);
create index if not exists geographies_parent_idx on geographies(parent_id);
create index if not exists geographies_county_idx on geographies(county_geography_id);
create index if not exists geographies_metro_idx on geographies(metro_id);
create index if not exists geographies_name_prefix_idx on geographies(normalized_name text_pattern_ops);

alter table geographies enable row level security;

-- Same shape as market_areas: public read, admin-only write. The seed script itself
-- uses the service-role client (bypasses RLS), same as geographyBackfillActions.js.
create policy "geographies_select_all" on geographies for select using (true);
create policy "geographies_insert_admin" on geographies for insert with check (public.is_admin());
create policy "geographies_update_admin" on geographies for update using (public.is_admin());
create policy "geographies_delete_admin" on geographies for delete using (public.is_admin());
