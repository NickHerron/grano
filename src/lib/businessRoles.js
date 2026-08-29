// The curated v1 role vocabulary for business_roles (see supabase/schema_business_roles.sql
// and the Person/Organization Multi-Role Foundation plan). One entity (farm, restaurant,
// or organization) can carry several of these — exactly one is_primary, any number of
// additional ones. This is the single place the role→table/account-role/legacy-column
// mapping lives; every other file should go through these helpers rather than
// re-deriving the mapping.
//
// Deliberately NOT the user's full 26-role wishlist — every key below already maps to
// something real (a value in PRODUCER_TYPES/RESTAURANT_TYPES/org_type, or, for
// event_venue, an actual business_work_options capability). The whole "Support"
// category (Supplier/Distributor/etc.) is cut on purpose: sells_wholesale/
// buys_wholesale already are that signal. Adding a role later is one CHECK-constraint
// line plus one entry here, not a redesign.

export const ROLE_CATEGORIES = [
  { key: 'produce', label: 'Produce / Make', blurb: 'You grow or make food.', table: 'farm', accountRole: 'producer' },
  { key: 'sell_serve', label: 'Sell / Serve', blurb: 'You sell or serve food to customers.', table: 'restaurant', accountRole: 'restaurant' },
  { key: 'organize', label: 'Organize / Community', blurb: 'You organize or represent a local food community.', table: 'organization', accountRole: null },
  { key: 'places', label: 'Places / Facilities', blurb: 'You provide a place or facility.', table: 'organization', accountRole: null },
]

export const ROLE_DEFS = {
  // Produce / Make -> farms
  farm: { label: 'Farm', category: 'produce', table: 'farm', legacyValue: 'Farm' },
  bakery: { label: 'Bakery', category: 'produce', table: 'farm', legacyValue: 'Bakery' },
  food_maker: { label: 'Food Maker', category: 'produce', table: 'farm', legacyValue: 'Food Producer' },
  beverage_producer: { label: 'Beverage Producer', category: 'produce', table: 'farm', legacyValue: 'Beverage Producer' },
  coffee_roaster: { label: 'Coffee Roaster', category: 'produce', table: 'farm', legacyValue: 'Coffee Roaster' },

  // Sell / Serve -> restaurants
  restaurant: { label: 'Restaurant', category: 'sell_serve', table: 'restaurant', legacyValue: 'Restaurant' },
  cafe: { label: 'Cafe', category: 'sell_serve', table: 'restaurant', legacyValue: 'Cafe' },
  grocery_retailer: { label: 'Grocery / Retailer', category: 'sell_serve', table: 'restaurant', legacyValue: 'Grocery Store' },
  caterer: { label: 'Caterer', category: 'sell_serve', table: 'restaurant', legacyValue: 'Catering Company' },

  // Organize / Community -> organizations
  farmers_market: { label: 'Farmers Market', category: 'organize', table: 'organization', legacyValue: 'farmers_market' },
  food_hub: { label: 'Food Hub', category: 'organize', table: 'organization', legacyValue: 'food_hub' },
  community_organization: { label: 'Community Organization', category: 'organize', table: 'organization', legacyValue: 'community_organization' },
  food_cooperative: { label: 'Food Cooperative', category: 'organize', table: 'organization', legacyValue: 'food_cooperative' },

  // Places / Facilities -> organizations
  pickup_location: { label: 'Pickup Location', category: 'places', table: 'organization', legacyValue: 'pickup_location' },
  event_venue: { label: 'Event Venue', category: 'places', table: 'organization', legacyValue: 'other' },
}

export const ROLE_KEYS = Object.keys(ROLE_DEFS)

export function roleLabel(roleKey) {
  return ROLE_DEFS[roleKey]?.label || roleKey
}

export function tableForRole(roleKey) {
  return ROLE_DEFS[roleKey]?.table || null
}

export function legacyValueForRole(roleKey) {
  return ROLE_DEFS[roleKey]?.legacyValue || null
}

// The one explicit, one-directional place a PROFILE ROLE touches an ACCOUNT ROLE —
// creating a farms/restaurants row this way must also grant the matching account
// role (via the existing roleActions.addRole()) or the new owner gets middleware-
// blocked from /dashboard/producer or /dashboard/restaurant. Organizations grant no
// account role — "anyone signed in can create one," same as today.
export function accountRoleForTable(table) {
  return ROLE_CATEGORIES.find(c => c.table === table)?.accountRole || null
}

export function rolesInCategory(categoryKey) {
  return Object.entries(ROLE_DEFS).filter(([, def]) => def.category === categoryKey).map(([key, def]) => ({ key, ...def }))
}

// Picks out the primary role's key from a list of { role_key, is_primary } rows.
export function primaryRoleKey(roleRows = []) {
  return roleRows.find(r => r.is_primary)?.role_key || null
}

export function additionalRoles(roleRows = []) {
  return roleRows.filter(r => !r.is_primary)
}

// True for an organization whose roles (or legacy org_type, for one tagged before the
// roles system existed) make it the kind of place that hosts other businesses as
// vendors — a farmers market or food hub. The single source of truth for two
// different callers: RealOrganizationProfile.jsx (does the public profile show a real
// Vendors section, sourced from farm_locations.organization_id) and
// BusinessNetworkManager.jsx (does this organization's dashboard relabel its
// collaboration group "Vendors & Partners"). Those are two different tables/counts —
// see the "Vendors & Partners" comment in BusinessNetworkManager.jsx — but the same
// role condition decides whether either label applies at all.
export function hostsVendors(roleRows = [], orgType) {
  const roleKeys = new Set(roleRows.map(r => r.role_key))
  return roleKeys.size > 0
    ? (roleKeys.has('farmers_market') || roleKeys.has('food_hub'))
    : (orgType === 'farmers_market' || orgType === 'food_hub')
}
