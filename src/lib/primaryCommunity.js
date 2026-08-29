import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slugify'
import { getActiveAreas, networkStage } from '@/lib/locationQueries'

// Given a { city, state } (free text — everything not yet backfilled to a
// geography_id still works this way, see the plan's Phase 7), determines the right
// "community" to show for it:
//   1. The place itself, if it has real activity (reuses the existing, live
//      getActiveAreas() — never a second, competing activity counter).
//   2. Its county, if the place has none but the county's OTHER places do.
//   3. Its state, otherwise.
// Population is never read here — see NETWORK_STAGE_THRESHOLDS's own note in
// locationQueries.js. This function decides WHERE to point someone; it never decides
// whether that place "deserves" a community by size.
export async function getPrimaryCommunity({ city, state }) {
  const supabase = createClient()
  const stateUpper = state.toUpperCase()
  const citySlug = slugify(city)

  // Resolve the free-text city against a real geography place row. The ~1.35% of
  // same-state slug collisions (e.g. Oakwood city vs. Oakwood village, OH) are broken
  // deterministically — never returns "unknown": prefer an incorporated place over a
  // CDP, then higher population, then lowest place_fips.
  const { data: candidates } = await supabase.from('geographies')
    .select('id, name, slug, county_geography_id, metro_id, funcstat, population, place_fips')
    .eq('type', 'place').eq('state_code', stateUpper).eq('slug', citySlug)
  const place = (candidates || []).sort((a, b) => {
    if ((a.funcstat === 'A') !== (b.funcstat === 'A')) return a.funcstat === 'A' ? -1 : 1
    if ((b.population || 0) !== (a.population || 0)) return (b.population || 0) - (a.population || 0)
    return a.place_fips.localeCompare(b.place_fips)
  })[0] || null

  const areas = await getActiveAreas()

  if (place) {
    const placeArea = areas.find(a => a.state === stateUpper && a.citySlug === citySlug)
    if (placeArea && placeArea.count > 0) {
      return { level: 'place', geography: place, count: placeArea.count, stage: networkStage(placeArea.count) }
    }
  }

  // County fallback — aggregate activity across every OTHER place in the same
  // county via the already-computed getActiveAreas() list (no extra activity query).
  if (place?.county_geography_id) {
    const { data: county } = await supabase.from('geographies')
      .select('id, name, slug, state_code').eq('id', place.county_geography_id).single()
    if (county) {
      const { data: countyPlaces } = await supabase.from('geographies')
        .select('slug').eq('type', 'place').eq('county_geography_id', county.id)
      const countyPlaceSlugs = new Set((countyPlaces || []).map(p => p.slug))
      const countyCount = areas
        .filter(a => a.state === county.state_code && countyPlaceSlugs.has(a.citySlug))
        .reduce((sum, a) => sum + a.count, 0)
      if (countyCount > 0) {
        return { level: 'county', geography: county, count: countyCount, stage: networkStage(countyCount) }
      }
    }
  }

  // State fallback.
  const { data: stateRow } = await supabase.from('geographies')
    .select('id, name, slug').eq('type', 'state').eq('state_code', stateUpper).single()
  const stateCount = areas.filter(a => a.state === stateUpper).reduce((sum, a) => sum + a.count, 0)
  return { level: 'state', geography: stateRow, count: stateCount, stage: networkStage(stateCount) }
}
