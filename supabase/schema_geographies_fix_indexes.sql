-- Fixes schema_geographies.sql's uniqueness indexes. The original partial unique
-- indexes (`where type = 'state'` etc.) are correct in principle but can't be used as
-- an upsert's ON CONFLICT target — Postgres only infers a partial index from a bare
-- column list when the INSERT repeats the same WHERE predicate, which PostgREST/
-- Supabase's upsert() has no way to express. Confirmed empirically: an upsert against
-- the country_code partial index fails with "no unique or exclusion constraint
-- matching the ON CONFLICT specification."
--
-- Fix: fold `type` into each key as a plain (non-partial) composite unique index
-- instead of a predicate. Since `type` is never null and differs across row kinds,
-- this achieves the exact same scoping (a county's key can never collide with a
-- state's) without needing a WHERE clause — and plain composite unique indexes work
-- correctly with upsert's ON CONFLICT out of the box. No table data exists yet, so
-- this is a pure schema correction, nothing to migrate.

drop index if exists geographies_country_key;
drop index if exists geographies_state_key;
drop index if exists geographies_county_key;
drop index if exists geographies_place_key;
drop index if exists geographies_metro_key;

create unique index if not exists geographies_country_key on geographies(type, country_code);
create unique index if not exists geographies_state_key on geographies(type, state_fips);
create unique index if not exists geographies_county_key on geographies(type, state_fips, county_fips);
create unique index if not exists geographies_place_key on geographies(type, state_fips, place_fips);
create unique index if not exists geographies_metro_key on geographies(type, cbsa_code);
