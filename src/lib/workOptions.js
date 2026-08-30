// "Work With Us" — the ways a visitor can start a structured relationship with a
// business. Options are computed from what a business can actually DO (sells
// wholesale, buys wholesale, has an open sourcing request, has products) — never from
// which table its row happens to live in. A farm and a restaurant read from the exact
// same vocabulary and the exact same allowed/default logic now; only the underlying
// capability signals differ per business. See supabase/schema_wholesale_capabilities.sql
// (sells_wholesale/buys_wholesale) and schema_wholesale_polymorphic_sourcing.sql
// (supplier_pitch, polymorphic sourcing_requests).

export const WORK_OPTION_DEFS = {
  wholesale: {
    label: 'Wholesale',
    prompt: "I'd like to purchase your products for my business.",
  },
  // The direction that never existed before this vocabulary grew: someone offering to
  // SUPPLY a business, rather than someone asking to buy from one. Shown on any
  // business that's declared it buys wholesale, regardless of business type.
  supplier_pitch: {
    label: 'Supplier Inquiry',
    prompt: "I'd like to supply you with products — become a wholesale supplier.",
  },
  product_inquiry: {
    label: 'Product Inquiry',
    prompt: 'I have a question or request about one of your products.',
  },
  event: {
    label: 'Event / Booking',
    prompt: "I'd like to work with you for an event.",
  },
  collaboration: {
    label: 'Collaboration',
    prompt: "I'd like to collaborate with this business.",
  },
  custom_order: {
    label: 'Custom Order',
    prompt: "I'd like to request a custom order.",
  },
  sourcing: {
    label: 'Sourcing Inquiry',
    // Sender-facing copy: shown on a business that's posted an open sourcing_requests
    // want-ad — the sender is offering to fulfill it, not asking to buy from the
    // recipient. Previously worded backwards ("I'd like to source products from this
    // business"), which described the opposite direction from how this option is
    // actually used.
    prompt: "I can help fulfill what you're looking for.",
  },
  general: {
    label: 'General Inquiry',
    prompt: 'A general question or message.',
  },
}

// Replaces the old PRODUCER_WORK_OPTION_KEYS/RESTAURANT_WORK_OPTION_KEYS split — that
// split hardcoded "producers sell, restaurants buy" into the vocabulary itself (both
// arrays contained the same 'wholesale' key with a prompt that only ever made sense
// for a farm-as-seller). allowedWorkOptionKeys() below computes the real per-business
// answer from capability signals instead.
export const ALL_WORK_OPTION_KEYS = ['wholesale', 'supplier_pitch', 'product_inquiry', 'event', 'collaboration', 'custom_order', 'sourcing', 'general']

// Which structured fields the inquiry form shows for each type — deliberately one
// shared field set (see work_inquiries columns) rather than a bespoke form per type.
// supplier_pitch mirrors wholesale's shape: a sender describing what they can supply.
export const FIELDS_BY_TYPE = {
  wholesale: ['product', 'quantity', 'frequency', 'desiredDate', 'message'],
  supplier_pitch: ['product', 'quantity', 'frequency', 'desiredDate', 'message'],
  product_inquiry: ['product', 'subject', 'quantity', 'message'],
  event: ['subject', 'desiredDate', 'eventStartTime', 'eventEndTime', 'eventLocation', 'guestCount', 'budget', 'message'],
  collaboration: ['subject', 'desiredDate', 'product', 'message'],
  custom_order: ['subject', 'quantity', 'desiredDate', 'budget', 'message'],
  sourcing: ['subject', 'product', 'quantity', 'frequency', 'message'],
  general: ['message'],
}

// Category-based defaults for event/custom_order — unrelated to the wholesale
// buy/sell question, so left as category signals (a coffee roaster tends to do
// events; that's a real signal, not an assumption this feature is about removing).
const EVENT_BY_DEFAULT_DETAILED_TYPES = new Set(['Coffee Roaster', 'Tea Company', 'Matcha Brand', 'Beverage Producer'])
const CUSTOM_ORDER_BY_DEFAULT_DETAILED_TYPES = new Set([
  'Bakery', 'Home Bakery', 'Cheesemaker', 'Butcher / Meat Producer', 'Preserver / Jam Maker',
  'Chocolate / Candy Maker', 'Ice Cream Maker', 'Granola / Snack Company', 'Specialty Food',
  'Cottage Food Business', 'Food Producer',
])
// Coarse fallback vocabulary (farms.business_types / restaurants.business_types,
// collected at signup — see producerOptions.js / restaurantOptions.js).
const EVENT_BY_DEFAULT_PRODUCER_TYPES = new Set(['Mobile Food & Beverage', 'Farmers Market Vendor', 'Coffee', 'Matcha & Tea', 'Beverage'])
const CUSTOM_ORDER_BY_DEFAULT_PRODUCER_TYPES = new Set(['Bakery', 'Specialty Foods', 'Food Producer', 'Cottage Food Business'])
const EVENT_BY_DEFAULT_RESTAURANT_TYPES = new Set(['Catering', 'Hospitality & Events'])

function eventDefaultOn(business, businessType) {
  if (businessType === 'restaurant') {
    const types = new Set(business?.business_types || [])
    return [...types].some(t => EVENT_BY_DEFAULT_RESTAURANT_TYPES.has(t))
  }
  const detailedTypes = new Set([business?.producer_type, ...(business?.secondary_types || [])].filter(Boolean))
  if (detailedTypes.size > 0) return [...detailedTypes].some(t => EVENT_BY_DEFAULT_DETAILED_TYPES.has(t))
  const signupTypes = new Set(business?.business_types || [])
  return [...signupTypes].some(t => EVENT_BY_DEFAULT_PRODUCER_TYPES.has(t))
}

function customOrderDefaultOn(business, businessType) {
  if (businessType === 'restaurant') return false // restaurants have no product catalog, so custom_order is never allowed for them anyway
  const detailedTypes = new Set([business?.producer_type, ...(business?.secondary_types || [])].filter(Boolean))
  if (detailedTypes.size > 0) return [...detailedTypes].some(t => CUSTOM_ORDER_BY_DEFAULT_DETAILED_TYPES.has(t))
  const signupTypes = new Set(business?.business_types || [])
  return [...signupTypes].some(t => CUSTOM_ORDER_BY_DEFAULT_PRODUCER_TYPES.has(t))
}

// Which options a business could ever turn on — computed from capability signals it
// actually has, never from business type. ctx.hasProducts gates product_inquiry/
// custom_order (today only ever true for a farm, since only farms can own products,
// but expressed as a capability rather than hardcoded to "is this a farm" — the day
// another business type gets a product catalog, this needs no change).
export function allowedWorkOptionKeys(business, businessType, ctx = {}) {
  const { hasProducts = false } = ctx
  const allowed = new Set(['general', 'collaboration', 'event', 'sourcing'])
  if (business?.sells_wholesale) allowed.add('wholesale')
  if (business?.buys_wholesale) allowed.add('supplier_pitch')
  if (hasProducts) {
    allowed.add('product_inquiry')
    allowed.add('custom_order')
  }
  return ALL_WORK_OPTION_KEYS.filter(k => allowed.has(k))
}

// Which of the allowed options default to ON before any explicit business_work_options
// override exists — a business can always flip any allowed option on/off from Work
// Options settings regardless of what it defaults to. Deliberately NOT category-based
// for `sourcing` (previously some restaurant types defaulted it on even with zero open
// requests) — an inquiry type that means "responding to your posted want-ad" should
// only default on when there's actually a want-ad to respond to, not because of what
// kind of business posted it. That's the same "don't assume from category" principle
// this whole capability rework is built around.
export function defaultWorkOptionKeys(business, businessType, ctx = {}) {
  const { hasOpenSourcingRequests = false, hasProducts = false } = ctx
  const on = new Set(['general', 'collaboration'])
  if (business?.sells_wholesale) on.add('wholesale')
  if (business?.buys_wholesale) on.add('supplier_pitch')
  if (hasOpenSourcingRequests) on.add('sourcing')
  if (hasProducts) on.add('product_inquiry')
  if (eventDefaultOn(business, businessType)) on.add('event')
  if (hasProducts && customOrderDefaultOn(business, businessType)) on.add('custom_order')
  return on
}

// Merges the computed defaults with whatever explicit business_work_options rows
// exist, returning one entry per allowed key in a stable order. `rows` is the raw
// business_work_options select for this business (any order).
export function resolveWorkOptions(allowedKeys, defaultKeys, rows) {
  const overrides = new Map((rows || []).map(r => [r.option_key, r]))
  return allowedKeys.map(key => {
    const override = overrides.get(key)
    return {
      key,
      // An open sourcing request is a public B2B want-ad. Don't let a work-option
      // override hide the path for a supplier to compare price.
      enabled: (key === 'sourcing' && defaultKeys.has('sourcing')) ? true : (override ? override.enabled : defaultKeys.has(key)),
      headline: override?.headline || null,
      instructions: override?.instructions || null,
    }
  })
}
