import { perspectiveOf, otherSide } from '@/lib/businessNetwork'

// business_relationships references farms/restaurants by (type, id) instead of a
// single FK (there's no one "businesses" table to point at), so PostgREST can't
// embed the other side automatically the way farm:farms(...) usually works — this
// batch-fetches whichever farms/restaurants are actually referenced and joins them
// in JS instead of doing it one row at a time.
async function hydrateOtherSides(supabase, relationships, business) {
  const farmIds = new Set()
  const restaurantIds = new Set()
  const organizationIds = new Set()
  for (const r of relationships) {
    const other = otherSide(r, business)
    if (other.type === 'farm') farmIds.add(other.id)
    else if (other.type === 'restaurant') restaurantIds.add(other.id)
    else organizationIds.add(other.id)
  }

  const [{ data: farms }, { data: restaurants }, { data: organizations }] = await Promise.all([
    farmIds.size
      ? supabase.from('farms').select('id, name, slug, producer_type, location, logo_url, verification_status').in('id', [...farmIds])
      : Promise.resolve({ data: [] }),
    restaurantIds.size
      ? supabase.from('restaurants').select('id, name, slug, restaurant_type, location, logo_url, verification_status').in('id', [...restaurantIds])
      : Promise.resolve({ data: [] }),
    organizationIds.size
      ? supabase.from('organizations').select('id, name, slug, org_type, location, logo_url, verification_status').in('id', [...organizationIds])
      : Promise.resolve({ data: [] }),
  ])
  const farmById = new Map((farms || []).map(f => [f.id, f]))
  const restaurantById = new Map((restaurants || []).map(r => [r.id, r]))
  const organizationById = new Map((organizations || []).map(o => [o.id, o]))

  const relationshipIds = relationships.map(r => r.id)
  const { data: productRows } = relationshipIds.length
    ? await supabase
        .from('business_relationship_products')
        .select('relationship_id, product:products(id, name, slug, image_url, img_bg, price, unit, for_sale, is_available)')
        .in('relationship_id', relationshipIds)
    : { data: [] }
  const productsByRelationship = new Map()
  for (const row of productRows || []) {
    if (!row.product) continue // product was deleted — relationship stays, product reference just quietly disappears
    if (!productsByRelationship.has(row.relationship_id)) productsByRelationship.set(row.relationship_id, [])
    productsByRelationship.get(row.relationship_id).push(row.product)
  }

  return relationships.map(r => {
    const other = otherSide(r, business)
    const otherBusiness = other.type === 'farm' ? farmById.get(other.id)
      : other.type === 'restaurant' ? restaurantById.get(other.id)
      : organizationById.get(other.id)
    return {
      ...r,
      perspective: perspectiveOf(r, business),
      otherBusiness: otherBusiness ? { ...otherBusiness, type: other.type } : null,
      products: productsByRelationship.get(r.id) || [],
    }
  }).filter(r => r.otherBusiness) // the other business was deleted — drop it rather than show a broken card
}

// Everything this business is a participant in, any status/visibility — for the
// dashboard's "Our Business Network" management view.
export async function getBusinessNetwork(supabase, business) {
  const { data: relationships } = await supabase
    .from('business_relationships')
    .select('*')
    .or(`and(initiator_type.eq.${business.type},initiator_id.eq.${business.id}),and(target_type.eq.${business.type},target_id.eq.${business.id})`)
    .order('created_at', { ascending: false })

  return hydrateOtherSides(supabase, relationships || [], business)
}

// Only what should show on the public profile — accepted and public.
export async function getPublicNetwork(supabase, business) {
  const { data: relationships } = await supabase
    .from('business_relationships')
    .select('*')
    .or(`and(initiator_type.eq.${business.type},initiator_id.eq.${business.id}),and(target_type.eq.${business.type},target_id.eq.${business.id})`)
    .eq('status', 'accepted')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })

  return hydrateOtherSides(supabase, relationships || [], business)
}
