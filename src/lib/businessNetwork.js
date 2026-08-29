import { roleLabel } from './businessRoles'

// "Our Local Network" — real, mutually-confirmed business relationships. Separate
// system from Following (a one-sided "keep me posted" signal) and from Orders (a
// transaction record) on purpose — see schema_business_network.sql for why.

// "We work with them" is deliberately the loosest of the three — it's for real
// relationships that aren't a buy/sell at all: sharing a farmers-market booth,
// co-hosting a pop-up, cross-promoting each other, a farm and a chef collaborating on
// an event. Giving it a real place (not just "collaboration") is what makes those
// relationships as visible as sourcing ones.
export const RELATIONSHIP_TYPES = [
  ['source_from', 'We source from them', "You buy from them — ingredients, product, or supplies."],
  ['supplies_to', 'We supply them', "You sell or provide something to them."],
  ['collaboration', 'We work with them', "Shared market booths, co-hosted events, cross-promotion — even with no buying or selling involved."],
]

export const RELATIONSHIP_TYPE_LABELS = Object.fromEntries(RELATIONSHIP_TYPES.map(([k, l]) => [k, l]))
export const RELATIONSHIP_TYPE_DESCRIPTIONS = Object.fromEntries(RELATIONSHIP_TYPES.map(([k, , d]) => [k, d]))

// Section labels + one-line descriptions for the public "Our Local Network" display —
// worded from the profile owner's point of view ("you"), same three buckets as above.
export const PUBLIC_NETWORK_SECTIONS = {
  source_from: { title: 'We Source From', description: 'Businesses we purchase from.' },
  supplies_to: { title: 'We Supply', description: 'Businesses we sell to.' },
  collaboration: { title: 'We Work With', description: 'Businesses we collaborate with.' },
}

// A relationship's meaning is always stored relative to the initiator. Viewed from an
// arbitrary business's side, it maps onto one of three buckets — this is that mapping.
// Returns null if `business` isn't actually a participant.
export function perspectiveOf(relationship, business) {
  const isInitiator = relationship.initiator_type === business.type && relationship.initiator_id === business.id
  const isTarget = relationship.target_type === business.type && relationship.target_id === business.id
  if (!isInitiator && !isTarget) return null

  if (relationship.relationship_type === 'collaboration') return 'collaboration'
  if (relationship.relationship_type === 'source_from') return isInitiator ? 'source_from' : 'supplies_to'
  // supplies_to
  return isInitiator ? 'supplies_to' : 'source_from'
}

// The *other* business in the relationship, from `business`'s point of view.
export function otherSide(relationship, business) {
  const isInitiator = relationship.initiator_type === business.type && relationship.initiator_id === business.id
  return isInitiator
    ? { type: relationship.target_type, id: relationship.target_id }
    : { type: relationship.initiator_type, id: relationship.initiator_id }
}

// Friendly label for each org_type value — org_type itself is a snake_case DB key,
// this is what a card/profile actually displays.
export const ORG_VERIFICATION_LABELS = {
  unverified: 'Unverified',
  pending_verification: 'Verification Requested',
  verified: 'Grano Verified',
}

export const ORG_TYPE_LABELS = {
  farmers_market: 'Farmers Market',
  pickup_location: 'Pickup Location',
  food_hub: 'Food Hub',
  community_organization: 'Community Organization',
  food_cooperative: 'Food Cooperative',
  other: 'Organization',
}

// Real maps, not binary ternaries — a third business type (organizations, added in
// schema_organizations_relationships.sql) needs its own branch here, not "whatever
// isn't a farm must be a restaurant." Every caller of these two functions already
// works unchanged for the new type since they only ever call through here.
const BUSINESS_TYPE_LABELS = { farm: 'Producer', restaurant: 'Restaurant', organization: 'Organization' }
export function businessTypeLabel(type) {
  return BUSINESS_TYPE_LABELS[type] || 'Business'
}

const BUSINESS_PROFILE_PATHS = { farm: 'producers', restaurant: 'restaurants', organization: 'markets' }
export function businessProfileHref(type, slug) {
  return `/${BUSINESS_PROFILE_PATHS[type] || 'producers'}/${slug}`
}

// Prefers the entity's primary business_roles tag (the detailed vocabulary added in
// schema_business_roles.sql) and falls back to the legacy per-table label when the
// entity hasn't been tagged yet (or the tag is somehow missing) — so this never
// regresses a page that hasn't been touched by the roles system.
export function businessRoleLabel(type, primaryRoleKey, legacyTypeValue) {
  if (primaryRoleKey) return roleLabel(primaryRoleKey)
  if (type === 'organization') return ORG_TYPE_LABELS[legacyTypeValue] || ORG_TYPE_LABELS.other
  return legacyTypeValue || businessTypeLabel(type)
}
