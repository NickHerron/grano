-- Grano: lightweight consumer profile fields + product-level wholesale info, the last
-- two pieces from the three-sided network spec (consumer profile is deliberately
-- minimal per the spec: "Do not require extensive information. Keep this lightweight").
--
-- Run this AFTER schema_follows_restaurants.sql.

alter table profiles
  add column if not exists profile_photo_url text,
  add column if not exists neighborhood text,
  add column if not exists favorite_categories text[] not null default '{}';

alter table products
  add column if not exists wholesale_price numeric(10,2),
  add column if not exists wholesale_unit text,
  add column if not exists wholesale_min_order text,
  add column if not exists wholesale_case_size text,
  add column if not exists wholesale_lead_time_days integer,
  add column if not exists wholesale_notes text;
