-- Phase 1 of the Geographic Foundation plan.
--
-- Adds structured city/state/country columns alongside the EXISTING free-text
-- location/neighborhood/county/address columns on each table — those stay exactly
-- as they are and remain authoritative for every existing badge/filter/card. This is
-- a pure additive layer: no existing read path changes, no backfill in this file
-- (that's Phase 4, run deliberately from an admin panel so ambiguous rows are never
-- guessed — see src/lib/geography.js), and no app code reads these columns yet.
--
-- state is a 2-letter uppercase code (e.g. 'IL') — matches the "City, IL" convention
-- already used as a placeholder everywhere in the app, gives a clean collision-free
-- URL segment (/locations/il/chicago), and matches Vercel's own geo header format
-- (x-vercel-ip-country-region) with no mapping layer needed later.
--
-- country defaults to 'US' (ISO alpha-2, matching x-vercel-ip-country) rather than
-- 'United States' for the same reason — the header value IS the column value.

alter table farms
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists country text not null default 'US';
create index if not exists farms_state_city_idx on farms(state, city);

alter table restaurants
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists country text not null default 'US';
create index if not exists restaurants_state_city_idx on restaurants(state, city);

alter table organizations
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists country text not null default 'US';
create index if not exists organizations_state_city_idx on organizations(state, city);

alter table profiles
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists country text not null default 'US';
create index if not exists profiles_state_city_idx on profiles(state, city);
