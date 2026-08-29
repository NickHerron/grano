// product_sources references its source business by (type, id) instead of a single
// FK (schema_product_sources.sql — same reason as business_relationships: no single
// "businesses" table), so PostgREST can't embed the source automatically. Batch-
// fetches whichever farms/restaurants + products are actually referenced and joins
// them in JS instead of one row at a time — mirrors hydrateOtherSides() in
// networkQueries.js.
export async function hydrateProductSources(supabase, sources) {
  if (!sources.length) return []

  const farmIds = new Set()
  const restaurantIds = new Set()
  const sourceProductIds = new Set()
  for (const s of sources) {
    if (s.source_type === 'farm') farmIds.add(s.source_id)
    else restaurantIds.add(s.source_id)
    if (s.source_product_id) sourceProductIds.add(s.source_product_id)
  }

  const [{ data: farms }, { data: restaurants }, { data: sourceProducts }] = await Promise.all([
    farmIds.size
      ? supabase.from('farms').select('id, name, slug, producer_type, location, logo_url').in('id', [...farmIds])
      : Promise.resolve({ data: [] }),
    restaurantIds.size
      ? supabase.from('restaurants').select('id, name, slug, restaurant_type, location, logo_url').in('id', [...restaurantIds])
      : Promise.resolve({ data: [] }),
    sourceProductIds.size
      ? supabase.from('products').select('id, name, slug').in('id', [...sourceProductIds])
      : Promise.resolve({ data: [] }),
  ])
  const farmById = new Map((farms || []).map(f => [f.id, f]))
  const restaurantById = new Map((restaurants || []).map(r => [r.id, r]))
  const productById = new Map((sourceProducts || []).map(p => [p.id, p]))

  return sources
    .map(s => {
      const sourceBusiness = s.source_type === 'farm' ? farmById.get(s.source_id) : restaurantById.get(s.source_id)
      return {
        ...s,
        sourceBusiness: sourceBusiness ? { ...sourceBusiness, type: s.source_type } : null,
        sourceProduct: s.source_product_id ? productById.get(s.source_product_id) || null : null,
      }
    })
    // The credited business (or product) was deleted — drop the row rather than show
    // a broken credit; the underlying product_sources row itself is left alone.
    .filter(s => s.sourceBusiness)
}
