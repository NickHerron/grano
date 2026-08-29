// Shared by both organization-creation paths (dashboard/organization/actions.js's
// createOrganization() and dashboard/profiles/actions.js's createProfileFromRoles())
// — those two had already drifted into two copies of the same slug-retry insert
// before this file existed. One normalization, one similarity check, one insert.

// Only true filler words and legal-entity suffixes — NOT "farmers"/"market"/
// "community"/"organization"/etc. Those are type-defining, not generic: "Hyde Park
// Farmers Market" and "Hyde Park Community Organization" share a neighborhood name
// but are real, different organizations, and stripping their type words would make
// them collide on just "hyde park" — confirmed as a real false positive during
// testing before this list was narrowed.
const STOPWORDS = new Set(['the', 'a', 'an', 'and', 'of', 'inc', 'llc', 'co', 'coop', 'cooperative'])

export function normalizeOrgName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function distinctiveTokens(name) {
  return normalizeOrgName(name).split(' ').filter(t => t && !STOPWORDS.has(t))
}

// Advisory only — never blocks. Finds existing organizations whose name normalizes
// identically, or whose distinctive tokens (after stripping generic words like
// "farmers"/"market"/"cooperative") are a subset/superset match — "Hyde Park Farmers
// Market" and "Hyde Park Farmers' Market" both reduce to "hyde park". Not scoped by
// location: it's free text and frequently blank at creation, and a person can tell
// "Green City Market, Chicago" from "Green City Market, Madison" at a glance in the
// results far better than a filter could guess it for them.
export async function findSimilarOrganizations(supabase, name) {
  const normalized = normalizeOrgName(name)
  const tokens = distinctiveTokens(name)
  if (!tokens.length) return []

  const primaryToken = [...tokens].sort((a, b) => b.length - a.length)[0]
  const { data: candidates } = await supabase.from('organizations')
    .select('id, name, slug, location, org_type').ilike('name', `%${primaryToken}%`).limit(20)

  const tokenSet = new Set(tokens)
  return (candidates || []).filter(c => {
    if (normalizeOrgName(c.name) === normalized) return true
    const cTokens = distinctiveTokens(c.name)
    if (!cTokens.length) return false
    const cTokenSet = new Set(cTokens)
    return tokens.every(t => cTokenSet.has(t)) || cTokens.every(t => tokenSet.has(t))
  })
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

// The slug-retry insert both creation paths used to duplicate: base slug + first 6
// chars of the owner's id, retrying with a short random suffix on a unique-violation
// (two same-named organizations by the same owner otherwise collide on the exact same
// slug, since nothing else about the base varies).
export async function insertOrganizationWithSlug(supabase, { ownerId, name, orgType, location }) {
  const base = slugify(name)
  let lastError = null
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = attempt === 0 ? ownerId.slice(0, 6) : `${ownerId.slice(0, 6)}-${Math.random().toString(36).slice(2, 6)}`
    const slug = `${base}-${suffix}`
    const { data, error } = await supabase.from('organizations')
      .insert({ owner_id: ownerId, slug, name, org_type: orgType, location: location || null })
      .select('id, slug').single()
    if (!error) return { data }
    lastError = error
    if (error.code !== '23505') break // not a slug collision — no point retrying
  }
  return { error: lastError }
}
