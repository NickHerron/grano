-- Expands the producer/product taxonomy so Grano represents the broader local
-- food & beverage ecosystem, not just farms: adds secondary business types
-- (a business can be primarily a Bakery but also a Granola Producer, etc.),
-- and a flexible JSON field for category-specific product attributes
-- (roast level for coffee, grade for matcha, etc.) without a schema migration
-- every time a new specialty category needs a new field.
--
-- Additive only — existing producer_type/category values are untouched and
-- remain valid; the new PRODUCER_TYPE_GROUPS list in src/lib/producerOptions.js
-- is a superset of the old flat PRODUCER_TYPES list.

alter table farms add column if not exists secondary_types text[] default '{}';
alter table products add column if not exists specialty_attributes jsonb default '{}'::jsonb;

comment on column farms.secondary_types is 'Optional additional business types beyond the primary producer_type, e.g. a bakery that also sells granola and operates as a cottage food business.';
comment on column products.specialty_attributes is 'Free-form key/value attributes specific to a product category (e.g. {"roast_level":"Medium","origin":"Ethiopia"} for coffee, {"grade":"Ceremonial","origin":"Uji, Japan"} for matcha). Rendered on the product page when present.';

-- 24 Karat Bakery is Grano's flagship producer profile and genuinely makes
-- granola as a cottage-food side business alongside its core bakery line —
-- this reflects their real product mix, not placeholder data.
update farms
set secondary_types = array['Granola / Snack Company', 'Cottage Food Business']
where slug = '24-karat-bakery-054db1' and (secondary_types is null or secondary_types = '{}');
