// Social Cards data layer — pure data-shaping, no rendering. For a given business,
// computes which card types are unlocked (real data exists to post about) and the
// exact content/stats payload for each — reusing every existing data source as-is
// rather than re-deriving anything:
//   - getPublicNetwork() (networkQueries.js) for Local Network / Our Suppliers / Who
//     We Supply — already filters accepted+public at the query level.
//   - hydrateProductSources() (productSources.js) for Sourcing / Product Story —
//     product_sources has no privacy gate by design, safe to show unconditionally.
//   - resolveWorkOptions()/allowedWorkOptionKeys()/defaultWorkOptionKeys()
//     (workOptions.js) for Work With Us — the exact same computation the public
//     profile pages already do.
//   - nextOccurrence()/formatScheduleLine() (schedule.js) for Upcoming Events.
// Never re-implements a privacy filter or a stat calculation that already exists
// elsewhere in the app.
import { getPublicNetwork } from './networkQueries'
import { hydrateProductSources } from './productSources'
import { resolveWorkOptions, allowedWorkOptionKeys, defaultWorkOptionKeys, WORK_OPTION_DEFS } from './workOptions'
import { nextOccurrence, formatScheduleLine } from './schedule'
import { truncate } from './socialCards/render'

// Long producer_type/restaurant_type values ("Mill / Grain Company") need a shorter
// form for a card's tight typographic space — a display concern, not a taxonomy
// change, so producerOptions.js/restaurantOptions.js stay untouched.
const SHORT_CATEGORY_LABELS = {
  'Mill / Grain Company': 'Mill',
  'Butcher / Meat Producer': 'Butcher',
  'Preserver / Jam Maker': 'Preserver',
  'Chocolate / Candy Maker': 'Chocolate Maker',
  'Garden / Urban Farm': 'Urban Farm',
  'Apiary / Honey Producer': 'Apiary',
  'Cottage Food Business': 'Cottage Food',
  'Granola / Snack Company': 'Snack Maker',
}
export function shortCategoryLabel(raw) {
  if (!raw) return null
  return SHORT_CATEGORY_LABELS[raw] || raw
}

function dedupeByBusiness(list) {
  const seen = new Map()
  for (const b of list) {
    const key = `${b.type}:${b.id}`
    if (!seen.has(key)) seen.set(key, b)
  }
  return [...seen.values()]
}

// Local Network — "we source from", "we supply", "we work with" counts, each
// deduplicated by partner business (the same partner could appear via more than one
// relationship row). Backs both the Local Network card and the "Our Suppliers"/"Who We
// Supply" cards, which are just this same data viewed through one perspective.
export async function computeLocalNetworkStats(supabase, business) {
  const relationships = await getPublicNetwork(supabase, business)
  const partners = dedupeByBusiness(relationships.map(r => r.otherBusiness))
  const sourceFrom = dedupeByBusiness(relationships.filter(r => r.perspective === 'source_from').map(r => r.otherBusiness))
  const suppliesTo = dedupeByBusiness(relationships.filter(r => r.perspective === 'supplies_to').map(r => r.otherBusiness))
  return { total: partners.length, partners, sourceFrom, suppliesTo }
}

// Sourcing — every distinct business this farm's products are tagged as sourced
// from, across its whole catalog (not one product). Farm-only: restaurants have no
// products table, so this always returns empty for a restaurant.
export async function computeSourcingStats(supabase, business) {
  if (business.type !== 'farm') return { total: 0, sources: [], byCategory: {} }
  const { data: products } = await supabase.from('products').select('id').eq('farm_id', business.id)
  const productIds = (products || []).map(p => p.id)
  if (!productIds.length) return { total: 0, sources: [], byCategory: {} }

  const { data: rows } = await supabase.from('product_sources').select('*').in('product_id', productIds)
  if (!rows?.length) return { total: 0, sources: [], byCategory: {} }

  const hydrated = await hydrateProductSources(supabase, rows)
  const distinct = dedupeByBusiness(hydrated.map(s => s.sourceBusiness))
  const byCategory = {}
  for (const b of distinct) {
    const label = shortCategoryLabel(b.type === 'farm' ? b.producer_type : b.restaurant_type) || 'Local Business'
    byCategory[label] = (byCategory[label] || 0) + 1
  }
  return { total: distinct.length, sources: distinct, byCategory }
}

// Product Story — sourcing tags for one specific product. Returns null if the product
// has no tags at all, so the caller can show the spec's own suggested fallback
// ("Add local sources to this product to unlock a Product Story card") instead of an
// empty card.
export async function computeProductStory(supabase, product) {
  const { data: rows } = await supabase.from('product_sources').select('*').eq('product_id', product.id).order('sort_order')
  if (!rows?.length) return null
  const hydrated = await hydrateProductSources(supabase, rows)
  return {
    product,
    sources: hydrated.map(s => ({
      ingredientLabel: s.ingredient_label,
      business: s.sourceBusiness,
      sourceProduct: s.sourceProduct,
    })),
  }
}

// Work With Us — exactly what's already enabled, reusing the same resolution the
// public profile itself uses. `ctx` mirrors what the profile pages already compute
// (hasOpenSourcingRequests, hasProducts) — callers pass it through, nothing new here.
export async function computeWorkWithUsStats(supabase, business, businessType, workOptionRows, ctx = {}) {
  const resolved = resolveWorkOptions(
    allowedWorkOptionKeys(business, businessType, ctx),
    defaultWorkOptionKeys(business, businessType, ctx),
    workOptionRows || [],
  )
  const enabled = resolved.filter(o => o.enabled).map(o => WORK_OPTION_DEFS[o.key].label)
  return { enabled, total: enabled.length }
}

// Upcoming Events — the single soonest event location, if any. `locations` is
// whatever the caller already fetched (farm_locations for this business); no new
// query — just picks the nearest occurrence.
export function computeUpcomingEvent(locations) {
  const events = (locations || []).filter(l => l.location_type === 'event')
  const withDates = events
    .map(loc => ({ loc, date: nextOccurrence(loc, { horizonDays: 45 }) }))
    .filter(x => x.date)
    .sort((a, b) => a.date - b.date)
  if (!withDates.length) return null
  const { loc, date } = withDates[0]
  return { location: loc, date, scheduleLine: formatScheduleLine(loc) }
}

// Business Discovery — always available the moment a business exists; needs nothing
// but the business row itself.
export function computeBusinessDiscovery(business, businessType) {
  return {
    name: business.name,
    category: businessType === 'farm' ? business.producer_type : business.restaurant_type,
    place: business.neighborhood || business.location,
    intro: truncate(business.bio || business.story || '', 140),
  }
}

// The single entry point a dashboard/preview page calls: everything needed to render
// the "YOUR STORIES" picker (which cards are unlocked, one line of computed content
// each) in one pass. Individual compute* functions above stay independently callable
// for the actual per-card render (Phase 2/4/5), which needs the fuller payload, not
// just a summary line.
export async function buildAvailableStoryCards(supabase, business, businessType, { workOptionRows, locations, ctx } = {}) {
  const [network, sourcing, workWithUs] = await Promise.all([
    computeLocalNetworkStats(supabase, business),
    computeSourcingStats(supabase, { ...business, type: businessType }),
    computeWorkWithUsStats(supabase, business, businessType, workOptionRows, ctx),
  ])
  const event = computeUpcomingEvent(locations)

  const cards = [
    {
      key: 'business_discovery', label: 'Meet the People Behind the Food', unlocked: true,
      why: 'A quick, always-ready introduction — works even on day one.',
    },
    {
      key: 'local_network', label: `${network.total} Local Business${network.total === 1 ? '' : 'es'} We Work With`,
      unlocked: network.total > 0, why: 'Shows the real relationships behind your business.',
    },
  ]
  if (businessType === 'farm') {
    cards.push({
      key: 'sourcing', label: `Made With Products From ${sourcing.total} Local Business${sourcing.total === 1 ? '' : 'es'}`,
      unlocked: sourcing.total > 0, why: 'Tell the story of what goes into what you make.',
    })
    cards.push({
      key: 'our_suppliers', label: `${network.sourceFrom.length} Local Suppliers`,
      unlocked: network.sourceFrom.length > 0, why: 'Who you source from — a story about your own supply chain.',
    })
  }
  cards.push({
    key: 'who_we_supply', label: `${network.suppliesTo.length} Businesses We Supply`,
    unlocked: network.suppliesTo.length > 0, why: 'Who carries what you make.',
  })
  cards.push({
    key: 'work_with_us', label: 'We’re Open For', unlocked: workWithUs.total > 0,
    why: 'What people can actually reach out to you about.',
  })
  cards.push({
    key: 'upcoming_events', label: event ? `Find Us: ${event.scheduleLine}` : 'Upcoming Events',
    unlocked: Boolean(event), why: 'Where to find you next, ready to post before the date passes.',
  })

  return { cards, network, sourcing, workWithUs, event }
}
