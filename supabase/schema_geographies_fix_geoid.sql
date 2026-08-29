-- Second correction to schema_geographies.sql. The first fix (composite (type, ...)
-- indexes instead of partial indexes) was necessary but not sufficient — it missed a
-- real structural problem, confirmed by actually running the seed against production:
-- `state_fips` is denormalized onto county AND place rows (so their own composite
-- keys can include it), which means a plain 2-column index on (type, state_fips)
-- doesn't just prevent duplicate states — it mathematically forbids more than ONE
-- county, and more than ONE place, per state, since every county in Illinois shares
-- the identical (type='county', state_fips='17') pair. Real error hit while seeding:
-- "Key (type, state_fips)=(county, 01) already exists."
--
-- Fix: one unified `geoid` column holding Census's own natural identifier per row
-- (state: 2-digit FIPS; county: 5-digit FIPS; place: 7-digit FIPS; metro: CBSA code;
-- country: a fixed sentinel) and ONE unique index on (type, geoid) — replacing the
-- five separate, overlapping-column indexes. A GEOID is unique to the exact row it
-- names by construction (Census designs them that way), so this can't recreate the
-- same class of bug. No data loss: country/states/metros already seeded keep their
-- rows, this just adds the column and re-points uniqueness at it.

alter table geographies add column if not exists geoid text;

drop index if exists geographies_country_key;
drop index if exists geographies_state_key;
drop index if exists geographies_county_key;
drop index if exists geographies_place_key;
drop index if exists geographies_metro_key;

create unique index if not exists geographies_geoid_key on geographies(type, geoid);

-- Backfill the rows already seeded (country + states + metros) so they don't end up
-- with geoid=null once the seed script switches to upserting on (type, geoid).
update geographies set geoid = 'US' where type = 'country' and geoid is null;
update geographies set geoid = state_fips where type = 'state' and geoid is null;
update geographies set geoid = cbsa_code where type = 'metro' and geoid is null;
