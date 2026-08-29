-- Wholesale Available to All Business Types — Phase 1: capability columns + backfill.
--
-- Today "sells wholesale" lives only on farms.practices.wholesale_available, and
-- nothing on restaurants declares "buys wholesale" explicitly — it's just assumed
-- from having a restaurant account at all. This adds two plain, symmetric booleans
-- directly to BOTH farms and restaurants — the same shape as practices/business_types/
-- verification_status, which are already plain columns on each table rather than a
-- separate polymorphic table, since a business's own capability flag describes that
-- one business, not a relationship between two businesses (unlike business_relationships/
-- business_work_options, which genuinely are about two parties or an inbound channel).
--
-- No app code reads these yet — this migration is purely additive and safe to run
-- standalone. Phase 3 onward wires the rest of the app onto these columns.

alter table farms
  add column if not exists sells_wholesale boolean not null default false,
  add column if not exists buys_wholesale boolean not null default false;

alter table restaurants
  add column if not exists sells_wholesale boolean not null default false,
  add column if not exists buys_wholesale boolean not null default false;

comment on column farms.sells_wholesale is 'Independent of producer_type — a farm/bakery/coffee roaster/etc. declares this explicitly, never assumed from category.';
comment on column farms.buys_wholesale is 'A producer can also be a buyer (e.g. a bakery sourcing flour) — not mutually exclusive with sells_wholesale.';
comment on column restaurants.sells_wholesale is 'A restaurant-type business (bakery-cafe, caterer, etc.) can also be a wholesale seller — never assumed from restaurant_type.';
comment on column restaurants.buys_wholesale is 'Whether this business buys wholesale — previously only implied by having a restaurant account at all; now explicit and independent of type.';

-- Backfill from real, already-collected signals — never fabricate a capability from
-- business type alone, per the explicit "don't assume from category" principle this
-- feature is built around.
--
-- Farms: practices.wholesale_available is an existing, explicitly-set signal (checked
-- in Basic Info or the onboarding "What You Offer" step) — a direct match.
update farms
set sells_wholesale = true
where practices ->> 'wholesale_available' = 'true';

-- Restaurants: having ever posted a sourcing_requests row is a real, unambiguous
-- signal of buying intent — including closed/fulfilled historical requests, since
-- those still demonstrate the capability, not just current activity.
update restaurants
set buys_wholesale = true
where id in (select distinct restaurant_id from sourcing_requests);

-- restaurants.sells_wholesale and farms.buys_wholesale intentionally stay false for
-- every existing row — no prior signal exists for either, and this feature's whole
-- point is to stop assuming capability from type. Both become opt-in going forward
-- via the new onboarding step / restaurant settings tab (Phase 5).
