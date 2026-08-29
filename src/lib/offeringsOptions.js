// Vocabulary for the onboarding wizard's "What You Offer" step, backing
// farms.offerings/farms.serves (see supabase/schema_producer_onboarding.sql). Kept
// deliberately separate from PRACTICE_OPTIONS (producerOptions.js) — those are public
// trust/ownership badges, this is "what kind of engagement is this business open to."
// Where the two genuinely overlap (Pickup/CSA already exist as practices), each
// entry's third element names the matching practices key so OfferingsStep can write
// it back automatically instead of asking the same question twice — see
// src/components/onboarding/steps/OfferingsStep.jsx. A "Wholesale" option used to
// live here too — removed in favor of the dedicated Wholesale step (WholesaleStep.jsx,
// schema_wholesale_capabilities.sql), which asks the sell/buy question properly
// instead of a single retail-framed checkbox.
export const OFFERING_OPTIONS = [
  ['retail', 'Retail sales / farmers markets', null],
  ['pickup', 'Pickup orders', 'pickup_available'],
  ['csa', 'CSA / subscription boxes', 'csa_available'],
  ['custom_orders', 'Custom orders', null],
  ['events', 'Events & catering', null],
]

export const SERVES_OPTIONS = [
  ['consumers', 'Individual shoppers', null],
  ['restaurants', 'Restaurants', 'restaurant_sales'],
  ['other_producers', 'Other local producers', null],
  ['retailers', 'Retail stores', null],
  ['institutions', 'Schools & institutions', null],
]
