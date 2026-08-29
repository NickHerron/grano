#!/usr/bin/env node
// Phase 3 of the National Geographic Foundation plan.
//
// Seeds `geographies` with REAL US Census Bureau data — nothing here is invented.
// Every source is a direct www2.census.gov file, fetched fresh by this script:
//   - states:            geo/docs/reference/state.txt
//   - counties:          geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_counties_national.zip
//   - places:            geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip
//   - place<->county:    geo/docs/reference/codes2020/national_place_by_county2020.txt
//   - metro (CBSA) + all population estimates: programs-surveys/popest/datasets/2020-2024/{metro,counties,cities}/totals/*.csv
//
// Run directly against production with the service-role key — NOT through the app,
// NOT as a SQL file pasted into the editor (35,000+ rows makes that impractical).
// Every write is an upsert keyed on Census's own natural id (state FIPS, county FIPS,
// place FIPS, CBSA code), matching the composite unique indexes in
// supabase/schema_geographies.sql — so this script is idempotent: a partial failure
// is fixed by re-running it, never by manual cleanup.
//
// Usage: node --env-file=.env.local scripts/seed-geographies.mjs

import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — run with --env-file=.env.local')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const TMP = mkdtempSync(join(tmpdir(), 'geo-seed-'))

// ---------- fetch helpers ----------

async function fetchText(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`)
  return res.text()
}

async function fetchAndUnzip(url, innerFilename) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const zipPath = join(TMP, innerFilename + '.zip')
  writeFileSync(zipPath, buf)
  execFileSync('unzip', ['-o', '-q', zipPath, '-d', TMP])
  return readFileSync(join(TMP, innerFilename), 'utf8') // verified via raw bytes: Census's "special characters" (e.g. "Añasco") are UTF-8, not latin1
}

// ---------- parsing helpers ----------

// Same rule as geoSlug() in src/lib/geography.js (NFD-normalize, strip combining
// marks, then the same regex slugify() uses) — duplicated here rather than imported
// since this script runs outside Next.js's module resolution, not because the rule
// is allowed to drift. Any change to geoSlug() must be mirrored here.
function geoSlug(text) {
  const stripped = text.normalize('NFD').replace(/[̀-ͯ]/g, '')
  return stripped.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// Census's LSAD labels (mirrors LSAD_LABELS in src/lib/geography.js — same
// duplication-not-drift note as geoSlug() above). Used to strip the EXACT known
// suffix Census appends to a place's formal name ("Chicago city" -> "Chicago"),
// verified against all 32,333 real place names: 32,318 strip cleanly, the 15 that
// don't are unusual consolidated city-county governments (e.g. "Nashville-Davidson
// metropolitan government") where keeping the full name is correct anyway.
const LSAD_LABELS = {
  '25': 'city', '43': 'town', '47': 'village', '21': 'borough', '57': 'CDP',
  '55': 'comunidad', '62': 'zona urbana', '35': 'metro township', '37': 'municipality',
  '53': 'city and borough', '00': 'balance',
  CG: 'consolidated government', CN: 'consolidated government', MG: 'metropolitan government',
  UC: 'unified government', UG: 'unified government',
}
function placeBaseName(name, lsad) {
  const label = LSAD_LABELS[lsad]
  if (!label) return name
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return name.replace(new RegExp('\\s+' + escaped + '$', 'i'), '')
}

function parseDelimited(text, delimiter) {
  const lines = text.split('\n').filter(l => l.trim().length)
  const header = lines[0].split(delimiter).map(h => h.trim())
  return lines.slice(1).map(line => {
    const cols = line.split(delimiter)
    const row = {}
    header.forEach((h, i) => { row[h] = (cols[i] ?? '').trim() })
    return row
  })
}

// Minimal CSV parser handling quoted fields with embedded commas (Census population
// CSVs quote names like "Chicago-Naperville-Elgin, IL-IN") — no npm dependency.
function parseCsv(text) {
  const lines = text.split('\n').filter(l => l.trim().length)
  function parseLine(line) {
    const cols = []
    let cur = '', inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') inQuotes = !inQuotes
      else if (c === ',' && !inQuotes) { cols.push(cur); cur = '' }
      else cur += c
    }
    cols.push(cur)
    return cols
  }
  const header = parseLine(lines[0])
  return lines.slice(1).map(line => {
    const cols = parseLine(line)
    const row = {}
    header.forEach((h, i) => { row[h] = (cols[i] ?? '').trim() })
    return row
  })
}

// Returns the actual rows Postgres returned (id + whatever natural-key columns the
// caller asks for) — NOT assumed to be in the same order as the input array.
// Upsert/insert output order is not guaranteed to match input order, so any caller
// that needs to map a natural key back to its id must read that key from the
// response itself, never zip by array position.
async function upsertChunked(rows, onConflict, selectColumns, chunkSize = 1000) {
  const returned = []
  let total = 0
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { data, error } = await supabase.from('geographies').upsert(chunk, { onConflict }).select(selectColumns)
    if (error) throw new Error(`upsert failed at row ${i}: ${error.message}`)
    returned.push(...data)
    total += chunk.length
    process.stdout.write(`\r    ${total}/${rows.length}`)
  }
  console.log('')
  return returned
}

// ---------- main ----------

async function main() {
  console.log('=== Seeding geographies from real Census Bureau data ===\n')

  // 1. Country
  console.log('[1/7] Country')
  const { data: countryRow, error: countryErr } = await supabase.from('geographies')
    .upsert({ type: 'country', geoid: 'US', name: 'United States', normalized_name: 'united states', slug: 'united-states', country_code: 'US' }, { onConflict: 'type,geoid' })
    .select('id').single()
  if (countryErr) throw countryErr
  const countryId = countryRow.id
  console.log(`  country id: ${countryId}`)

  // 2. States — from state.txt, filtered to the USPS codes that actually appear in
  // the Gazetteer files below (52: 50 states + DC + PR) rather than a guessed list.
  console.log('\n[2/7] States')
  const stateText = await fetchText('https://www2.census.gov/geo/docs/reference/state.txt')
  const stateRowsRaw = parseDelimited(stateText, '|') // STATE|STUSAB|STATE_NAME|STATENS

  // 3. Counties (needed now to know which state FIPS actually have data)
  console.log('[3/7] Counties (Gazetteer)')
  const countyText = await fetchAndUnzip(
    'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_counties_national.zip',
    '2024_Gaz_counties_national.txt',
  )
  const countyRowsRaw = parseDelimited(countyText, '\t')
  const statesWithData = new Set(countyRowsRaw.map(r => r.USPS))

  const stateRows = stateRowsRaw
    .filter(r => statesWithData.has(r.STUSAB))
    .map(r => ({
      type: 'state', geoid: r.STATE, name: r.STATE_NAME, normalized_name: r.STATE_NAME.toLowerCase(), slug: geoSlug(r.STATE_NAME),
      parent_id: countryId, state_code: r.STUSAB, state_fips: r.STATE,
    }))
  const stateReturned = await upsertChunked(stateRows, 'type,geoid', 'id, geoid')
  const stateFipsToId = new Map(stateReturned.map(r => [r.geoid, r.id]))
  const stateFipsToCode = new Map(stateRows.map(r => [r.state_fips, r.state_code]))
  console.log(`  ${stateRows.length} states`)

  // 4. County populations (needed before inserting counties, and for the
  // multi-county place tiebreak below)
  console.log('\n[4/7] Population data')
  const coPopText = await fetchText('https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/counties/totals/co-est2024-alldata.csv')
  const coPopRows = parseCsv(coPopText).filter(r => r.SUMLEV === '050')
  const countyFipsToPop = new Map(coPopRows.map(r => [r.STATE + r.COUNTY, parseInt(r.POPESTIMATE2024, 10) || null]))

  const placePopText = await fetchText('https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/cities/totals/sub-est2024.csv')
  const placePopRows = parseCsv(placePopText).filter(r => r.SUMLEV === '162')
  const placeFipsToPop = new Map(placePopRows.map(r => [r.STATE + r.PLACE, parseInt(r.POPESTIMATE2024, 10) || null]))
  console.log(`  ${coPopRows.length} county populations, ${placePopRows.length} place populations`)

  // 5. Metros (CBSA) — definition rows (MDIV empty, STCOU empty) become geography
  // rows; county-membership rows (STCOU non-empty) become a lookup map, not rows.
  // Metro/Micropolitan Statistical Areas only — skip nothing else (no Metropolitan
  // Division rows are ever STCOU-empty AND lack an MDIV, so the STCOU-empty filter
  // alone correctly selects only true top-level CBSA definitions).
  console.log('\n[5/7] Metro areas (CBSA)')
  const cbsaText = await fetchText('https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/metro/totals/cbsa-est2024-alldata.csv')
  const cbsaRows = parseCsv(cbsaText)
  const metroDefRows = cbsaRows.filter(r => !r.MDIV && !r.STCOU)
  const countyToCbsa = new Map(cbsaRows.filter(r => r.STCOU).map(r => [r.STCOU, r.CBSA]))

  const metroRows = metroDefRows.map(r => {
    const firstStateAbbr = (r.NAME.match(/,\s*([A-Z]{2})/) || [])[1] || null // display/sort hint only
    return {
      type: 'metro', geoid: r.CBSA, name: r.NAME, normalized_name: r.NAME.toLowerCase(), slug: geoSlug(r.NAME),
      parent_id: countryId, state_code: firstStateAbbr, cbsa_code: r.CBSA,
      lsad: r.LSAD, population: parseInt(r.POPESTIMATE2024, 10) || null, population_year: 2024,
    }
  })
  const metroReturned = await upsertChunked(metroRows, 'type,geoid', 'id, geoid')
  const cbsaCodeToId = new Map(metroReturned.map(r => [r.geoid, r.id]))
  console.log(`  ${metroRows.length} metro areas, ${countyToCbsa.size} county->metro links`)

  // 6. Counties
  console.log('\n[6/7] Counties')
  const countyRows = countyRowsRaw.map(r => {
    const stateFips = r.GEOID.slice(0, 2)
    const countyFips = r.GEOID.slice(2)
    const cbsaCode = countyToCbsa.get(r.GEOID)
    return {
      type: 'county', geoid: r.GEOID, name: r.NAME, normalized_name: r.NAME.toLowerCase(), slug: geoSlug(r.NAME),
      parent_id: stateFipsToId.get(stateFips) || null, metro_id: cbsaCode ? cbsaCodeToId.get(cbsaCode) : null,
      state_code: stateFipsToCode.get(stateFips), state_fips: stateFips, county_fips: countyFips,
      latitude: parseFloat(r.INTPTLAT) || null, longitude: parseFloat(r.INTPTLONG) || null,
      population: countyFipsToPop.get(r.GEOID) || null, population_year: countyFipsToPop.has(r.GEOID) ? 2024 : null,
    }
  })
  const countyReturned = await upsertChunked(countyRows, 'type,geoid', 'id, geoid')
  const countyGeoidToId = new Map(countyReturned.map(r => [r.geoid, r.id]))
  // Built once, up front — avoids an O(places x counties) scan below (~104M
  // comparisons for 32k places x 3.2k counties).
  const countyGeoidToMetroId = new Map(countyRows.map(r => [r.state_fips + r.county_fips, r.metro_id]))
  console.log(`  ${countyRows.length} counties`)

  // 7. Places — filtered to active governmental units (A) and statistical entities/
  // CDPs (S); drops 48 Census data-processing artifact rows (B/F/I/N).
  console.log('\n[7/7] Places')
  const placeText = await fetchAndUnzip(
    'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip',
    '2024_Gaz_place_national.txt',
  )
  const placeRowsRaw = parseDelimited(placeText, '\t').filter(r => r.FUNCSTAT === 'A' || r.FUNCSTAT === 'S')

  // Place<->county crosswalk — the exact mapping neither Gazetteer file carries on
  // its own. A place can span multiple counties (1,304 of them, ~4%); we keep a
  // single PRIMARY county per place (highest population), since nothing in this app
  // renders a multi-county list. Places absent from this 2020-vintage file (462,
  // ~1.4% — created/renamed since) get no county, left null rather than guessed.
  const crosswalkText = await fetchText('https://www2.census.gov/geo/docs/reference/codes2020/national_place_by_county2020.txt')
  const crosswalkRows = parseDelimited(crosswalkText, '|') // STATE|STATEFP|COUNTYFP|COUNTYNAME|PLACEFP|PLACENS|PLACENAME|TYPE|CLASSFP|FUNCSTAT
  const placeToCounties = new Map() // placeGeoid7 -> [countyGeoid5, ...]
  for (const r of crosswalkRows) {
    const placeGeoid = r.STATEFP + r.PLACEFP
    const countyGeoid = r.STATEFP + r.COUNTYFP
    if (!placeToCounties.has(placeGeoid)) placeToCounties.set(placeGeoid, [])
    placeToCounties.get(placeGeoid).push(countyGeoid)
  }
  function primaryCounty(placeGeoid) {
    const candidates = placeToCounties.get(placeGeoid)
    if (!candidates || !candidates.length) return null
    if (candidates.length === 1) return candidates[0]
    return candidates.slice().sort((a, b) => (countyFipsToPop.get(b) || 0) - (countyFipsToPop.get(a) || 0))[0]
  }

  let placesWithNoCounty = 0
  const placeRows = placeRowsRaw.map(r => {
    const stateFips = r.GEOID.slice(0, 2)
    const placeFips = r.GEOID.slice(2)
    const countyGeoid = primaryCounty(r.GEOID)
    const countyId = countyGeoid ? countyGeoidToId.get(countyGeoid) : null
    if (!countyId) placesWithNoCounty++
    // Metro is inherited transitively from the resolved county — O(1) map lookup.
    const metroId = countyGeoid ? countyGeoidToMetroId.get(countyGeoid) || null : null
    const displayName = r.NAME // Census's own full name, LSAD suffix included ("Chicago city") — kept as display name, not stripped
    return {
      type: 'place', geoid: r.GEOID, name: displayName, normalized_name: displayName.toLowerCase(), slug: geoSlug(placeBaseName(displayName, r.LSAD)),
      parent_id: stateFipsToId.get(stateFips) || null, county_geography_id: countyId, metro_id: metroId,
      state_code: stateFipsToCode.get(stateFips), state_fips: stateFips, place_fips: placeFips,
      lsad: r.LSAD, funcstat: r.FUNCSTAT, latitude: parseFloat(r.INTPTLAT) || null, longitude: parseFloat(r.INTPTLONG) || null,
      population: placeFipsToPop.get(r.GEOID) || null, population_year: placeFipsToPop.has(r.GEOID) ? 2024 : null,
    }
  })
  await upsertChunked(placeRows, 'type,geoid', 'id') // nothing downstream needs place ids, minimize the response payload
  console.log(`  ${placeRows.length} places (${placesWithNoCounty} with no county match, expected ~462)`)

  // ---------- report ----------
  console.log('\n=== Done ===')
  console.log(`Country: 1`)
  console.log(`States: ${stateRows.length}`)
  console.log(`Counties: ${countyRows.length} (${countyRows.filter(c => c.metro_id).length} with a metro)`)
  console.log(`Metros: ${metroRows.length}`)
  console.log(`Places: ${placeRows.length} (${placesWithNoCounty} with no county)`)

  // Spot checks against real production data.
  const chicago = placeRows.find(p => p.name === 'Chicago city' && p.state_code === 'IL')
  const waukegan = placeRows.find(p => p.name === 'Waukegan city' && p.state_code === 'IL')
  console.log(`\nSpot check — Chicago: county=${countyRows.find(c => countyGeoidToId.get(c.state_fips+c.county_fips) === chicago?.county_geography_id)?.name}, metro_id=${chicago?.metro_id}`)
  console.log(`Spot check — Waukegan: county=${countyRows.find(c => countyGeoidToId.get(c.state_fips+c.county_fips) === waukegan?.county_geography_id)?.name}, metro_id=${waukegan?.metro_id}`)
  console.log(`Same metro (expected true): ${chicago?.metro_id === waukegan?.metro_id && chicago?.metro_id != null}`)
}

main().catch(err => { console.error('\nFAILED:', err); process.exit(1) })
