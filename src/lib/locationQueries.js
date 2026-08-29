import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slugify'
import { resolveLocation, DEFAULT_AREA } from '@/lib/resolveLocation'

// A plain, tunable count threshold — explicitly NOT a scoring algorithm. Nothing
// downstream depends on the exact numbers; they're a starting heuristic for how an
// area's stage badge reads, freely adjustable as real activity grows.
export const NETWORK_STAGE_THRESHOLDS = [
  [0, 'Coming Soon'],
  [1, 'Emerging'],
  [5, 'Growing'],
  [20, 'Established'],
]

export function networkStage(count) {
  let stage = NETWORK_STAGE_THRESHOLDS[0][1]
  for (const [min, label] of NETWORK_STAGE_THRESHOLDS) {
    if (count >= min) stage = label
  }
  return stage
}

// Every distinct (state, city) with real activity across farms/restaurants/
// organizations — either the entity's own home city/state, or a
// business_area_memberships row it's explicitly joined — joined against market_areas
// for tracked-area status. Powers both the /locations index and the homepage's
// "Explore Communities" section — deliberately not filtered to "tracked" areas only,
// since both surfaces want every real place Grano has any activity, whether or not an
// admin has added a market_areas row yet.
export const getActiveAreas = cache(async () => {
  const supabase = createClient()
  const [{ data: farms }, { data: restaurants }, { data: orgs }, { data: areas }, { data: memberships }] = await Promise.all([
    supabase.from('farms').select('id, city, state').not('city', 'is', null).not('state', 'is', null),
    supabase.from('restaurants').select('id, city, state').not('city', 'is', null).not('state', 'is', null),
    supabase.from('organizations').select('id, city, state').not('city', 'is', null).not('state', 'is', null),
    supabase.from('market_areas').select('*'),
    supabase.from('business_area_memberships').select('business_type, business_id, city, state'),
  ])

  const byKey = new Map()
  const seenEntitiesByKey = new Map() // dedupes a home match + an explicit membership row for the same area

  function addEntity(state, city, entityKey) {
    const key = `${state}|${slugify(city)}`
    if (!byKey.has(key)) {
      byKey.set(key, { city, state, citySlug: slugify(city), count: 0 })
      seenEntitiesByKey.set(key, new Set())
    }
    const seen = seenEntitiesByKey.get(key)
    if (!seen.has(entityKey)) {
      seen.add(entityKey)
      byKey.get(key).count++
    }
  }

  for (const f of farms || []) addEntity(f.state, f.city, `farm:${f.id}`)
  for (const r of restaurants || []) addEntity(r.state, r.city, `restaurant:${r.id}`)
  for (const o of orgs || []) addEntity(o.state, o.city, `organization:${o.id}`)
  for (const m of memberships || []) addEntity(m.state, m.city, `${m.business_type}:${m.business_id}`)

  // A market_areas row with zero matching entities still surfaces (e.g. an admin adds
  // a new area before any real profile exists there yet) — this is exactly what makes
  // "Chicago active, Detroit coming soon" possible with zero hardcoding.
  for (const area of areas || []) {
    const key = `${area.state}|${slugify(area.city)}`
    if (!byKey.has(key)) byKey.set(key, { city: area.city, state: area.state, citySlug: slugify(area.city), count: 0 })
  }

  const areaByKey = new Map((areas || []).map(a => [`${a.state}|${slugify(a.city)}`, a]))
  return [...byKey.values()]
    .map(a => ({ ...a, marketArea: areaByKey.get(`${a.state}|${a.citySlug}`) || null }))
    .sort((a, b) => b.count - a.count)
})

// Validates the raw resolveLocation() signal against real Grano activity. Two
// distinct null-ish cases, handled differently on purpose:
//  - No signal at all (local dev, non-Vercel request, no cookie) -> falls back to the
//    site's implicit default (Chicago), matching what every visitor effectively sees
//    today.
//  - A real, detected location that just isn't an active area (e.g. a Boise visitor)
//    -> returns null. Callers show honest "explore" framing, never a fabricated local
//    network for a place Grano has no data in.
export async function resolveArea() {
  const raw = resolveLocation()
  const areas = await getActiveAreas()

  if (!raw) {
    return areas.find(a => a.state === DEFAULT_AREA.state && a.citySlug === slugify(DEFAULT_AREA.city)) || null
  }
  return areas.find(a => a.state === raw.state && a.citySlug === slugify(raw.city)) || null
}

// Full entity + stats fetch for one /locations/[state]/[city] page. Fetches every
// geography-tagged entity in the state and filters to this city in JS rather than
// reverse-parsing the slug back into a city name (lossy — "st-louis" could be
// "St. Louis" or "St Louis") — this also naturally collapses spelling variants onto
// one page. Also pulls in any entity that isn't home-based here but has explicitly
// joined this community via business_area_memberships (e.g. a Waukegan producer who
// actually sells in Chicago) — a membership match works across state lines too, since
// joining a community is a deliberate choice, not a location fact. Tripwire: past
// ~1,000 entities in one state, replace the home-match half of this with a city_slug
// generated column or a dedicated view.
export async function getAreaEntities(state, citySlug) {
  const supabase = createClient()
  const stateUpper = state.toUpperCase()
  const [{ data: farms }, { data: restaurants }, { data: orgs }, { data: memberships }] = await Promise.all([
    supabase.from('farms').select('*').eq('state', stateUpper).not('city', 'is', null),
    supabase.from('restaurants').select('*').eq('state', stateUpper).not('city', 'is', null),
    supabase.from('organizations').select('*').eq('state', stateUpper).not('city', 'is', null),
    supabase.from('business_area_memberships').select('business_type, business_id, city').eq('state', stateUpper),
  ])

  const homeFarms = (farms || []).filter(f => slugify(f.city) === citySlug)
  const homeRestaurants = (restaurants || []).filter(r => slugify(r.city) === citySlug)
  const homeOrgs = (orgs || []).filter(o => slugify(o.city) === citySlug)

  const memberIdsByType = { farm: new Set(), restaurant: new Set(), organization: new Set() }
  for (const m of memberships || []) {
    if (slugify(m.city) === citySlug) memberIdsByType[m.business_type]?.add(m.business_id)
  }
  const homeIds = {
    farm: new Set(homeFarms.map(f => f.id)),
    restaurant: new Set(homeRestaurants.map(r => r.id)),
    organization: new Set(homeOrgs.map(o => o.id)),
  }
  const extraIds = {
    farm: [...memberIdsByType.farm].filter(id => !homeIds.farm.has(id)),
    restaurant: [...memberIdsByType.restaurant].filter(id => !homeIds.restaurant.has(id)),
    organization: [...memberIdsByType.organization].filter(id => !homeIds.organization.has(id)),
  }
  // Fetched by id directly, no state filter — a member can be based in a different
  // state entirely (the whole point: a Michigan farm can join the Chicago community).
  const [{ data: extraFarms }, { data: extraRestaurants }, { data: extraOrgs }] = await Promise.all([
    extraIds.farm.length ? supabase.from('farms').select('*').in('id', extraIds.farm) : Promise.resolve({ data: [] }),
    extraIds.restaurant.length ? supabase.from('restaurants').select('*').in('id', extraIds.restaurant) : Promise.resolve({ data: [] }),
    extraIds.organization.length ? supabase.from('organizations').select('*').in('id', extraIds.organization) : Promise.resolve({ data: [] }),
  ])

  const matchFarms = [...homeFarms, ...(extraFarms || [])]
  const matchRestaurants = [...homeRestaurants, ...(extraRestaurants || [])]
  const matchOrgs = [...homeOrgs, ...(extraOrgs || [])]

  // Display city name: the most common exact spelling among HOME-matched rows only —
  // a member-joined entity's own city (e.g. "Waukegan") must never leak into this
  // area's display name just because it joined. Falls back to the caller's own
  // market_areas-derived label when there are no home matches yet (a members-only or
  // still-empty tracked area).
  const spellingCounts = new Map()
  for (const row of [...homeFarms, ...homeRestaurants, ...homeOrgs]) {
    spellingCounts.set(row.city, (spellingCounts.get(row.city) || 0) + 1)
  }
  const cityLabel = [...spellingCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null

  const farmIds = matchFarms.map(f => f.id)
  const { data: products } = farmIds.length
    ? await supabase.from('products').select('id').in('farm_id', farmIds).eq('for_sale', true)
    : { data: [] }

  return {
    cityLabel,
    farms: matchFarms,
    restaurants: matchRestaurants,
    organizations: matchOrgs,
    productCount: (products || []).length,
  }
}

// A business's own community memberships (its additional communities, not its home
// city/state) — for the "Communities" editor mounted on its profile-edit form. Takes
// a caller-supplied supabase client (unlike the cache()'d functions above) since it's
// only ever called from a Server Component page that already has one.
export async function getAreaMemberships(supabase, businessType, businessId) {
  const { data } = await supabase.from('business_area_memberships').select('id, state, city')
    .eq('business_type', businessType).eq('business_id', businessId).order('created_at', { ascending: true })
  return data || []
}

// The county-level analog of getAreaEntities() — every entity home-based OR
// community-joined in ANY place belonging to this county, deduped. Mirrors
// getAreaEntities()'s exact matching rules (home city/state match ∪
// business_area_memberships match) rather than looping that function once per place
// in the county (which could mean 100+ round trips for a large county) — a handful of
// queries regardless of county size.
export async function getCountyEntities(county) {
  const supabase = createClient()
  const [{ data: places }, { data: farms }, { data: restaurants }, { data: orgs }, { data: memberships }] = await Promise.all([
    supabase.from('geographies').select('slug').eq('type', 'place').eq('county_geography_id', county.id),
    supabase.from('farms').select('*').eq('state', county.state_code).not('city', 'is', null),
    supabase.from('restaurants').select('*').eq('state', county.state_code).not('city', 'is', null),
    supabase.from('organizations').select('*').eq('state', county.state_code).not('city', 'is', null),
    supabase.from('business_area_memberships').select('business_type, business_id, city').eq('state', county.state_code),
  ])
  const citySlugSet = new Set((places || []).map(p => p.slug))

  const homeFarms = (farms || []).filter(f => citySlugSet.has(slugify(f.city)))
  const homeRestaurants = (restaurants || []).filter(r => citySlugSet.has(slugify(r.city)))
  const homeOrgs = (orgs || []).filter(o => citySlugSet.has(slugify(o.city)))

  const memberIdsByType = { farm: new Set(), restaurant: new Set(), organization: new Set() }
  for (const m of memberships || []) {
    if (citySlugSet.has(slugify(m.city))) memberIdsByType[m.business_type]?.add(m.business_id)
  }
  const homeIds = {
    farm: new Set(homeFarms.map(f => f.id)), restaurant: new Set(homeRestaurants.map(r => r.id)), organization: new Set(homeOrgs.map(o => o.id)),
  }
  const extraIds = {
    farm: [...memberIdsByType.farm].filter(id => !homeIds.farm.has(id)),
    restaurant: [...memberIdsByType.restaurant].filter(id => !homeIds.restaurant.has(id)),
    organization: [...memberIdsByType.organization].filter(id => !homeIds.organization.has(id)),
  }
  const [{ data: extraFarms }, { data: extraRestaurants }, { data: extraOrgs }] = await Promise.all([
    extraIds.farm.length ? supabase.from('farms').select('*').in('id', extraIds.farm) : Promise.resolve({ data: [] }),
    extraIds.restaurant.length ? supabase.from('restaurants').select('*').in('id', extraIds.restaurant) : Promise.resolve({ data: [] }),
    extraIds.organization.length ? supabase.from('organizations').select('*').in('id', extraIds.organization) : Promise.resolve({ data: [] }),
  ])

  const allFarms = [...homeFarms, ...(extraFarms || [])]
  const allRestaurants = [...homeRestaurants, ...(extraRestaurants || [])]
  const allOrgs = [...homeOrgs, ...(extraOrgs || [])]

  const farmIds = allFarms.map(f => f.id)
  const { data: products } = farmIds.length
    ? await supabase.from('products').select('id').in('farm_id', farmIds).eq('for_sale', true)
    : { data: [] }

  return { farms: allFarms, restaurants: allRestaurants, organizations: allOrgs, productCount: (products || []).length }
}
