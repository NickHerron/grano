// Read helpers for business_roles — mirrors the batch-fetch shape networkQueries.js
// already established for the polymorphic (business_type, business_id) pattern.

export async function getRolesFor(supabase, businessType, businessId) {
  const { data } = await supabase.from('business_roles').select('role_key, is_primary')
    .eq('business_type', businessType).eq('business_id', businessId)
  return data || []
}

// Batch version for a directory/search page rendering many cards at once — one query
// instead of N.
export async function getRolesForMany(supabase, businessType, businessIds) {
  if (!businessIds?.length) return {}
  const { data } = await supabase.from('business_roles').select('business_id, role_key, is_primary')
    .eq('business_type', businessType).in('business_id', businessIds)
  const byId = {}
  for (const row of data || []) {
    (byId[row.business_id] = byId[row.business_id] || []).push(row)
  }
  return byId
}
