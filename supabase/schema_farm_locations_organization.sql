-- Phase 7 of the Network Layer plan: lets a producer link an existing farm_locations
-- row (e.g. a farmers-market entry they already typed in as free text) to a real
-- `organizations` row, so that market's public profile can list its real vendors
-- (Phase 8) instead of launching empty. Nullable and on delete set null — an
-- unlinked location behaves exactly as it does today, and deleting the organization
-- just drops the link, never the producer's own location row.
alter table farm_locations add column if not exists organization_id uuid references organizations(id) on delete set null;
create index if not exists farm_locations_organization_id_idx on farm_locations(organization_id);
