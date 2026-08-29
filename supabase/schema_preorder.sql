-- Preorder products — a producer can flag a product as a preorder (not yet regular
-- stock) with an optional free-text note (e.g. "Ships early September"), matching the
-- existing free-text convention for similar fields like products.season_ends rather
-- than a structured date, since producers often don't know an exact date.
--
-- Behavior lives entirely in app code (src/app/page.jsx, ProductCard.jsx), gated on
-- the existing site_settings.live_marketplace_enabled admin toggle:
--   - While the marketplace is paused: preorder products get their own "Preorder
--     Soon" section on the homepage instead of the generic "Not sold on Grano yet"
--     fallback every other product shows.
--   - Once the marketplace is live: preorder products stay in the regular grid
--     (still gated by their farm's own sell_on_grano, same as any product) but carry
--     a "Preorder" badge and CTA instead of a plain "Add to Cart" — there's no
--     separate payment/fulfillment mechanism to build since the marketplace itself
--     has no live payment processing wired up yet (see marketplace.js).
alter table products add column if not exists is_preorder boolean not null default false;
alter table products add column if not exists preorder_note text;

comment on column products.is_preorder is 'Producer-flagged as a preorder item — featured on the homepage while the marketplace is paused, badged as Preorder once live.';
comment on column products.preorder_note is 'Optional free-text availability note, e.g. "Ships early September" — shown wherever the preorder badge shows.';
