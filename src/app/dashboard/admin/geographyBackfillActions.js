'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseLocationString, geoSlug } from '@/lib/geography'

// One-time (repeatable) backfill: parses each table's existing free-text `location`
// column into structured city/state via the single parseLocationString() parser —
// never a second, drifting implementation. Only rows where city is still null are
// considered, so re-running after someone fills in a field by hand is a no-op for
// that row. Conservative by design: only confident parses get written; everything
// else is surfaced in the dry run for a human to look at, never guessed.
const TABLE_CONFIG = {
  farms: { labelColumn: 'name' },
  restaurants: { labelColumn: 'name' },
  organizations: { labelColumn: 'name' },
  profiles: { labelColumn: 'full_name' },
}

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin only.' }
  return {}
}

export async function dryRunGeographyBackfill() {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }
  const admin = createAdminClient()

  const results = {}
  for (const [table, cfg] of Object.entries(TABLE_CONFIG)) {
    const { data: rows, error } = await admin.from(table).select(`id, ${cfg.labelColumn}, location`).is('city', null)
    if (error) return { error: error.message }

    const confident = []
    const unparseable = []
    for (const row of rows || []) {
      const parsed = parseLocationString(row.location)
      const label = row[cfg.labelColumn] || '(unnamed)'
      if (parsed.confident) confident.push({ id: row.id, label, location: row.location, city: parsed.city, state: parsed.state })
      else unparseable.push({ id: row.id, label, location: row.location })
    }
    results[table] = { confident, unparseable, totalConsidered: (rows || []).length }
  }
  return { success: true, results }
}

export async function applyGeographyBackfill() {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }
  const admin = createAdminClient()

  const summary = {}
  for (const [table, cfg] of Object.entries(TABLE_CONFIG)) {
    const { data: rows, error } = await admin.from(table).select(`id, location`).is('city', null)
    if (error) return { error: error.message }

    let applied = 0
    for (const row of rows || []) {
      const parsed = parseLocationString(row.location)
      if (!parsed.confident) continue
      const { error: updateError } = await admin.from(table).update({ city: parsed.city, state: parsed.state }).eq('id', row.id)
      if (!updateError) applied++
    }
    summary[table] = applied
  }

  revalidatePath('/dashboard/admin')
  return { success: true, summary }
}

// Phase 7 of the National Geographic Foundation plan — a third backfill mode, same
// dry-run/apply/service-role shape as the two above, not a new mechanism. Matches
// each row's EXISTING city/state text (already structured by the backfill above)
// against the real geographies seeded in Phase 3. "Confident" here means the match
// is unambiguous: exactly one geographies place row for that (state, slug) — the
// ~1.35% of real same-state slug collisions (e.g. two Oakwoods in Ohio) surface as
// "needs a human" rather than picking one, same conservative rule as
// parseLocationString() itself.
export async function dryRunGeographyLinkBackfill() {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }
  const admin = createAdminClient()

  const results = {}
  for (const [table, cfg] of Object.entries(TABLE_CONFIG)) {
    const { data: rows, error } = await admin.from(table).select(`id, ${cfg.labelColumn}, city, state`)
      .is('city_geography_id', null).not('city', 'is', null).not('state', 'is', null)
    if (error) return { error: error.message }

    const confident = []
    const unmatched = []
    for (const row of rows || []) {
      const label = row[cfg.labelColumn] || '(unnamed)'
      const { data: candidates } = await admin.from('geographies').select('id, name')
        .eq('type', 'place').eq('state_code', row.state.toUpperCase()).eq('slug', geoSlug(row.city))
      if (candidates?.length === 1) {
        confident.push({ id: row.id, label, city: row.city, state: row.state, geographyId: candidates[0].id, geographyName: candidates[0].name })
      } else {
        unmatched.push({ id: row.id, label, city: row.city, state: row.state, reason: candidates?.length ? 'ambiguous' : 'no match' })
      }
    }
    results[table] = { confident, unmatched, totalConsidered: (rows || []).length }
  }
  return { success: true, results }
}

export async function applyGeographyLinkBackfill() {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }
  const admin = createAdminClient()

  const summary = {}
  for (const [table, cfg] of Object.entries(TABLE_CONFIG)) {
    const { data: rows, error } = await admin.from(table).select(`id, city, state`)
      .is('city_geography_id', null).not('city', 'is', null).not('state', 'is', null)
    if (error) return { error: error.message }

    let applied = 0
    for (const row of rows || []) {
      const { data: candidates } = await admin.from('geographies').select('id')
        .eq('type', 'place').eq('state_code', row.state.toUpperCase()).eq('slug', geoSlug(row.city))
      if (candidates?.length !== 1) continue
      const { error: updateError } = await admin.from(table).update({ city_geography_id: candidates[0].id }).eq('id', row.id)
      if (!updateError) applied++
    }
    summary[table] = applied
  }

  revalidatePath('/dashboard/admin')
  return { success: true, summary }
}
