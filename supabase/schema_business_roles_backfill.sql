-- Phase 2 of the Person/Organization Multi-Role Foundation plan — one-time backfill.
--
-- Inserts one is_primary=true business_roles row per existing farm/restaurant/
-- organization, mapped from the entity's existing detailed type column (falling back
-- to the coarser business_types array when the detailed type is null/empty, which is
-- common in real data), plus additional non-primary rows for farms' existing
-- secondary_types. Every mapping below collapses to whichever role_key best fits —
-- it deliberately loses detail (e.g. "Cheesemaker" and "Granola / Snack Company" both
-- become 'food_maker'); producer_type/restaurant_type/org_type are untouched and stay
-- the authoritative detailed value for every existing badge/filter/document
-- requirement. This is purely additive and fully reversible with one delete.
--
-- Primary rows are inserted first, so the additional-roles insert's
-- "on conflict do nothing" correctly skips any secondary_type that would just
-- duplicate the entity's own primary role.

-- FARMS — primary role from producer_type, falling back to business_types.
insert into business_roles (business_type, business_id, role_key, is_primary)
select 'farm', id,
  case
    when producer_type in ('Farm', 'Garden / Urban Farm', 'Flower Farm', 'Mushroom Grower', 'Apiary / Honey Producer') then 'farm'
    when producer_type in ('Bakery', 'Home Bakery') then 'bakery'
    when producer_type = 'Coffee Roaster' then 'coffee_roaster'
    when producer_type in ('Tea Company', 'Matcha Brand', 'Beverage Producer') then 'beverage_producer'
    when producer_type is not null and producer_type <> '' then 'food_maker' -- every other detailed type (Cheesemaker, Butcher, Granola, Cottage Food Business, etc.)
    when 'Bakery' = any(business_types) then 'bakery'
    when 'Coffee' = any(business_types) then 'coffee_roaster'
    when 'Matcha & Tea' = any(business_types) or 'Beverage' = any(business_types) then 'beverage_producer'
    when 'Farm & Grower' = any(business_types) then 'farm'
    else 'food_maker'
  end,
  true
from farms
on conflict (business_type, business_id, role_key) do nothing;

-- RESTAURANTS — primary role from restaurant_type.
insert into business_roles (business_type, business_id, role_key, is_primary)
select 'restaurant', id,
  case
    when restaurant_type in ('Cafe', 'Coffee Shop', 'Tea Shop') then 'cafe'
    when restaurant_type = 'Catering Company' then 'caterer'
    when restaurant_type in ('Grocery Store', 'Specialty Retailer') then 'grocery_retailer'
    else 'restaurant' -- every other detailed type, including null and Bakery-flavored restaurants (Bakery-as-a-role_key routes to farms, so this stays 'restaurant' here)
  end,
  true
from restaurants
on conflict (business_type, business_id, role_key) do nothing;

-- ORGANIZATIONS — 1:1 with org_type, except the 'other' catch-all which maps to the
-- closest real role.
insert into business_roles (business_type, business_id, role_key, is_primary)
select 'organization', id,
  case when org_type = 'other' then 'community_organization' else org_type end,
  true
from organizations
on conflict (business_type, business_id, role_key) do nothing;

-- FARMS — additional (non-primary) roles from the existing secondary_types array,
-- e.g. 24 Karat Bakery's real secondary_types ('Granola / Snack Company',
-- 'Cottage Food Business') both collapse to 'food_maker', landing exactly on the
-- plan's own worked example: PRIMARY Bakery, ADDITIONAL Producer.
insert into business_roles (business_type, business_id, role_key, is_primary)
select 'farm', f.id,
  case
    when st in ('Farm', 'Garden / Urban Farm', 'Flower Farm', 'Mushroom Grower', 'Apiary / Honey Producer') then 'farm'
    when st in ('Bakery', 'Home Bakery') then 'bakery'
    when st = 'Coffee Roaster' then 'coffee_roaster'
    when st in ('Tea Company', 'Matcha Brand', 'Beverage Producer') then 'beverage_producer'
    else 'food_maker'
  end,
  false
from farms f, unnest(f.secondary_types) as st
on conflict (business_type, business_id, role_key) do nothing;
