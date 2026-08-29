-- Wholesale Available to All Business Types — hotfix for schema_wholesale_
-- polymorphic_sourcing.sql (Phase 2). That migration added owner_type/owner_id and
-- said restaurant_id would stay "frozen and unused," but never actually dropped its
-- original NOT NULL constraint — so the moment app code stopped writing restaurant_id
-- (SourcingRequestsManager.jsx now writes owner_type/owner_id only), every new insert
-- started failing with "null value in column restaurant_id violates not-null
-- constraint." Caught live while testing Phase 4. This just makes the column
-- genuinely optional, matching what was actually intended.

alter table sourcing_requests alter column restaurant_id drop not null;
