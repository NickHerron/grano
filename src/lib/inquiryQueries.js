// work_inquiries references farms/restaurants by (type, id) on both the `to` and
// `from` side instead of a FK to one "businesses" table, so PostgREST can't embed
// them the way farm:farms(...) usually works — this batch-fetches whichever
// farms/restaurants are actually referenced across a list of inquiries and joins them
// in JS. Same approach as hydrateOtherSides() in networkQueries.js for
// business_relationships.
export async function hydrateInquiryBusinesses(supabase, inquiries) {
  const farmIds = new Set()
  const restaurantIds = new Set()
  for (const i of inquiries) {
    if (i.to_type === 'farm') farmIds.add(i.to_id)
    else if (i.to_type === 'restaurant') restaurantIds.add(i.to_id)
    if (i.from_type === 'farm') farmIds.add(i.from_id)
    else if (i.from_type === 'restaurant') restaurantIds.add(i.from_id)
  }

  const [{ data: farms }, { data: restaurants }] = await Promise.all([
    farmIds.size ? supabase.from('farms').select('id, name, slug').in('id', [...farmIds]) : Promise.resolve({ data: [] }),
    restaurantIds.size ? supabase.from('restaurants').select('id, name, slug').in('id', [...restaurantIds]) : Promise.resolve({ data: [] }),
  ])
  const farmById = new Map((farms || []).map(f => [f.id, f]))
  const restaurantById = new Map((restaurants || []).map(r => [r.id, r]))

  function lookup(type, id) {
    if (!type || !id) return null
    const b = type === 'farm' ? farmById.get(id) : restaurantById.get(id)
    return b ? { ...b, type } : null
  }

  return inquiries.map(i => ({
    ...i,
    toBusiness: lookup(i.to_type, i.to_id),
    fromBusiness: lookup(i.from_type, i.from_id),
  }))
}
