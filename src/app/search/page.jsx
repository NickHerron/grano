import { createClient } from '@/lib/supabase/server'
import { getLiveMarketplaceEnabled } from '@/lib/marketplace'
import { ROLE_DEFS } from '@/lib/businessRoles'
import { lsadLabel, stateLabel } from '@/lib/geography'
import Link from 'next/link'
import ProducerCard from '@/components/ProducerCard'
import RestaurantCard from '@/components/RestaurantCard'
import ProductCard from '@/components/ProductCard'
import MarketCard from '@/components/MarketCard'
import { overlayProducerCopy } from '@/lib/producerCopy'

export const metadata = { title: 'Search | Grano' }

// The nav bar's search input (src/components/Nav.jsx) submits here as a plain GET
// form — searches products, farms, and restaurants by name/category/type/location in
// parallel, reusing the exact card components and data-shaping already used on the
// homepage (src/app/page.jsx) and /producers directory (src/app/producers/page.jsx)
// rather than inventing a second version of either. Phase 9 of the Person/Organization
// Multi-Role plan adds role-based matching on top — "bakery" now also returns every
// business_roles-tagged Bakery regardless of which table it lives in — by widening
// what each existing section *matches*, not by rebuilding how it renders.
export default async function SearchPage({ searchParams }) {
  const q = (searchParams?.q || '').trim()
  const supabase = createClient()

  if (!q) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 text-center">
        <h1 className="font-serif text-[26px] font-semibold text-soil mb-2">Search Grano</h1>
        <p className="text-[14px] text-stone">Look for a product, a farm, or a restaurant — use the search bar above.</p>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()
  const like = `%${q}%`

  const [{ data: products }, { data: farms }, { data: restaurants }, { data: organizations }, { data: myFollows }, liveMarketplaceEnabled, { data: farmLocationRows }, { data: geoMatches }] = await Promise.all([
    supabase.from('products').select('*, farm:farms(name, slug, location, sell_on_grano)')
      .or(`name.ilike.${like},category.ilike.${like}`)
      .order('created_at', { ascending: false }).limit(24),
    supabase.from('farms').select('*')
      .or(`name.ilike.${like},producer_type.ilike.${like},location.ilike.${like},neighborhood.ilike.${like}`)
      .order('created_at', { ascending: false }).limit(24),
    supabase.from('restaurants').select('*')
      .or(`name.ilike.${like},restaurant_type.ilike.${like},location.ilike.${like},neighborhood.ilike.${like}`)
      .order('created_at', { ascending: false }).limit(24),
    supabase.from('organizations').select('*')
      .or(`name.ilike.${like},location.ilike.${like},neighborhood.ilike.${like}`)
      .order('created_at', { ascending: false }).limit(24),
    user ? supabase.from('follows').select('farm_id').eq('follower_id', user.id) : Promise.resolve({ data: [] }),
    getLiveMarketplaceEnabled(),
    supabase.from('farm_locations').select('farm_id'),
    // Real US places, disambiguated by state — "Springfield" shows every real
    // Springfield (IL/MO/MA/...), even ones with zero Grano activity yet. This is
    // the search hit the plan explicitly wants (discoverable), not a homepage
    // listing of empty places (explicitly not wanted) — the distinction is that this
    // only ever surfaces for someone who typed the name.
    supabase.from('geographies').select('id, name, slug, state_code, lsad, population')
      .eq('type', 'place').ilike('normalized_name', `${q.toLowerCase()}%`)
      .order('population', { ascending: false, nullsFirst: false }).limit(8),
  ])

  const followedFarmIds = new Set((myFollows || []).map(f => f.farm_id))
  const farmIdsWithLocations = new Set((farmLocationRows || []).map(l => l.farm_id))

  // Role-based matching: any role_key whose label matches the query (e.g. "bakery" ->
  // role_key 'bakery') pulls in every entity tagged with it, regardless of table —
  // this is what makes searching "pickup" return a pickup-tagged organization even
  // though nothing in its name/location/org_type mentions the word.
  const matchingRoleKeys = Object.entries(ROLE_DEFS)
    .filter(([, def]) => def.label.toLowerCase().includes(q.toLowerCase()))
    .map(([key]) => key)
  const { data: roleMatches } = matchingRoleKeys.length
    ? await supabase.from('business_roles').select('business_type, business_id').in('role_key', matchingRoleKeys)
    : { data: [] }
  const roleMatchIds = { farm: new Set(), restaurant: new Set(), organization: new Set() }
  for (const r of roleMatches || []) roleMatchIds[r.business_type]?.add(r.business_id)

  const nameMatchedFarmIds = new Set((farms || []).map(f => f.id))
  const extraFarmIds = [...roleMatchIds.farm].filter(id => !nameMatchedFarmIds.has(id))
  const nameMatchedRestaurantIds = new Set((restaurants || []).map(r => r.id))
  const extraRestaurantIds = [...roleMatchIds.restaurant].filter(id => !nameMatchedRestaurantIds.has(id))
  const nameMatchedOrgIds = new Set((organizations || []).map(o => o.id))
  const extraOrgIds = [...roleMatchIds.organization].filter(id => !nameMatchedOrgIds.has(id))

  const [{ data: extraFarms }, { data: extraRestaurants }, { data: extraOrgs }] = await Promise.all([
    extraFarmIds.length ? supabase.from('farms').select('*').in('id', extraFarmIds) : Promise.resolve({ data: [] }),
    extraRestaurantIds.length ? supabase.from('restaurants').select('*').in('id', extraRestaurantIds) : Promise.resolve({ data: [] }),
    extraOrgIds.length ? supabase.from('organizations').select('*').in('id', extraOrgIds) : Promise.resolve({ data: [] }),
  ])
  const allFarms = [...(farms || []), ...(extraFarms || [])]
  const allRestaurants = [...(restaurants || []), ...(extraRestaurants || [])]
  const allOrganizations = [...(organizations || []), ...(extraOrgs || [])]

  // productsByFarm feeds ProducerCard's "currently available" line — same shape
  // producers/page.jsx builds, computed here from just the matched farms' own products
  // (a light query, not the whole catalog) since search result farms are a small set.
  const farmIds = allFarms.map(f => f.id)
  const { data: farmProductsRaw } = farmIds.length
    ? await supabase.from('products').select('farm_id, name, for_sale, is_available').in('farm_id', farmIds)
    : { data: [] }
  const productsByFarm = (farmProductsRaw || []).reduce((acc, p) => {
    (acc[p.farm_id] = acc[p.farm_id] || []).push(p)
    return acc
  }, {})

  const mappedFarms = allFarms.map(f => {
    const overlaid = overlayProducerCopy(f)
    return {
      id: overlaid.id, slug: overlaid.slug, name: overlaid.name, location: overlaid.location,
      city: overlaid.city, state: overlaid.state, bio: overlaid.bio,
      avatarBg: overlaid.avatar_bg, logoUrl: overlaid.logo_url, coverPhotoUrl: overlaid.cover_photo_url,
      producerType: overlaid.producer_type,
      verificationStatus: overlaid.verification_status, sellOnGrano: overlaid.sell_on_grano, practices: overlaid.practices,
      sellsWholesale: overlaid.sells_wholesale, buysWholesale: overlaid.buys_wholesale,
      hasPickup: Boolean(overlaid.practices?.pickup_available || farmIdsWithLocations.has(overlaid.id)),
    }
  })

  const mappedProducts = (products || [])
    .filter(p => liveMarketplaceEnabled ? p.farm?.sell_on_grano : true)
    .map(p => ({
      id: p.id, slug: p.slug, name: p.name, price: p.price, unit: p.unit,
      location: p.farm?.location || 'Chicago, IL', imgBg: p.img_bg, imageUrl: p.image_url,
      category: p.category, farmSlug: p.farm?.slug, farmName: p.farm?.name,
      hasFindUsLocations: farmIdsWithLocations.has(p.farm_id),
      isPreorder: p.is_preorder, preorderNote: p.preorder_note,
    }))

  const totalResults = mappedProducts.length + mappedFarms.length + allRestaurants.length + allOrganizations.length + (geoMatches?.length || 0)

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10">
      <h1 className="font-serif text-[26px] font-semibold text-soil mb-1">
        {totalResults ? `Results for "${q}"` : `Nothing found for "${q}"`}
      </h1>
      <p className="text-[14px] text-stone mb-10">
        {totalResults ? `${totalResults} match${totalResults === 1 ? '' : 'es'} across products, farms, restaurants, organizations, and places.` : 'Try a different product, farm, restaurant, organization, or place name.'}
      </p>

      {geoMatches?.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif text-[19px] font-semibold text-soil mb-4">Places</h2>
          <div className="flex flex-col gap-1">
            {geoMatches.map(g => (
              <Link key={g.id} href={`/locations/${g.state_code.toLowerCase()}/${g.slug}`}
                className="text-[14px] text-soil hover:text-rust transition-colors">
                <span className="font-semibold">{g.name.replace(/\s+(city|town|village|CDP|borough)$/i, '')}, {stateLabel(g.state_code)}</span>
                <span className="text-stone"> · {lsadLabel(g.lsad)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {mappedProducts.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif text-[19px] font-semibold text-soil mb-4">Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {mappedProducts.map(p => <ProductCard key={p.id} product={p} purchasable={liveMarketplaceEnabled} />)}
          </div>
        </section>
      )}

      {mappedFarms.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif text-[19px] font-semibold text-soil mb-4">Producers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {mappedFarms.map(f => <ProducerCard key={f.id} farm={f} />)}
          </div>
        </section>
      )}

      {allRestaurants.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif text-[19px] font-semibold text-soil mb-4">Restaurants</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allRestaurants.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        </section>
      )}

      {allOrganizations.length > 0 && (
        <section>
          <h2 className="font-serif text-[19px] font-semibold text-soil mb-4">Organizations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allOrganizations.map(o => <MarketCard key={o.id} organization={o} />)}
          </div>
        </section>
      )}
    </div>
  )
}
