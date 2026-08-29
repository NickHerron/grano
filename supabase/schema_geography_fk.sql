-- Phase 7 of the National Geographic Foundation plan.
--
-- Adds a nullable reference to the real Census place a profile is based in, alongside
-- (never replacing) the existing free-text city/state columns from the prior
-- Geographic Foundation plan. Those stay authoritative for every existing display —
-- three of the five real production farms currently have city=null (their free-text
-- location didn't parse), and a hard cutover would leave them with no location at
-- all. This FK is populated by the admin backfill panel (dry-run/apply, same pattern
-- already shipped), not by hand, and read by nothing yet.

alter table farms add column if not exists city_geography_id uuid references geographies(id) on delete set null;
alter table restaurants add column if not exists city_geography_id uuid references geographies(id) on delete set null;
alter table organizations add column if not exists city_geography_id uuid references geographies(id) on delete set null;
alter table profiles add column if not exists city_geography_id uuid references geographies(id) on delete set null;

create index if not exists farms_city_geography_idx on farms(city_geography_id);
create index if not exists restaurants_city_geography_idx on restaurants(city_geography_id);
create index if not exists organizations_city_geography_idx on organizations(city_geography_id);
create index if not exists profiles_city_geography_idx on profiles(city_geography_id);
