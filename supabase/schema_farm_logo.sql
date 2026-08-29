-- Grano farm logos — run this AFTER schema.sql and schema_storage.sql.
-- Adds a logo photo field to farms; uploads reuse the existing product-photos bucket.

alter table farms add column if not exists logo_url text;
