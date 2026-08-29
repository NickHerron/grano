-- Phase 8 of the Person/Organization Multi-Role Foundation plan — rounds out the
-- PERSON side of the plan (profiles already had full_name/profile_photo_url/
-- neighborhood/favorite_categories; this adds the handful of fields the plan's
-- "Individual profile" section asks for: bio, location, website, social links).
-- Deliberately independent of every other phase — no relation to business_roles,
-- farms/restaurants/organizations, or anything else in this plan.
alter table profiles
  add column if not exists bio text,
  add column if not exists location text,
  add column if not exists website text,
  add column if not exists instagram text,
  add column if not exists x text;
