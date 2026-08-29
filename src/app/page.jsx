import { createClient } from '@/lib/supabase/server'
import MarketplaceClient from '@/components/MarketplaceClient'
import HomeHero from '@/components/HomeHero'
import { SourceLocalSection, GetDiscoveredSection } from '@/components/HomeNetworkSections'
import MeetProducersSection from '@/components/MeetProducersSection'
import LocalNetworkStats from '@/components/LocalNetworkStats'
import ExploreCommunitiesSection from '@/components/ExploreCommunitiesSection'
import { getLiveMarketplaceEnabled } from '@/lib/marketplace'
import { resolveArea, getActiveAreas, getAreaEntities } from '@/lib/locationQueries'

export default async function Marketplace() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [
    { data: realFarms }, { data: realProducts }, { data: allFarms }, { data: isRestaurantRole }, { data: myFollows }, { data: farmProductsRaw },
    { data: openSourcingRequests }, { data: storyFarms }, liveMarketplaceEnabled, { data: farmLocationRows },
    area, activeAreas,
  ] = await Promise.all([
    supabase.from('farms').select('*').order('created_at', { ascending: false }).limit(4),
    // product_sources has two FKs to products (product_id, and the optional
    // source_product_id it credits) — PostgREST can't pick one for a plain
    // `product_sources(id)` embed, so the relationship must be named explicitly.
    // A preorder item is deliberately allowed through even when for_sale/is_available
    // are false — that's the normal state for something not sellable yet, and it
    // still belongs in the regular grid (with its own Preorder badge/CTA) while the
    // marketplace is paused. Once live, a preorder item needs for_sale like any other
    // product — "active" preorder means actually orderable, enforced below.
    supabase.from('products').select('*, farm:farms(name, slug, location, sell_on_grano), product_sources!product_sources_product_id_fkey(id)').or('and(for_sale.eq.true,is_available.eq.true),is_preorder.eq.true').order('created_at', { ascending: false }),
    supabase.from('farms').select('id, name').order('name'),
    user ? supabase.from('account_roles').select('role').eq('user_id', user.id).eq('role', 'restaurant').maybeSingle() : { data: null },
    user ? supabase.from('follows').select('farm_id').eq('follower_id', user.id) : { data: [] },
    supabase.from('products').select('farm_id, name, for_sale, is_available'),
    supabase.from('sourcing_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(4),
    // "Meet the People" only makes sense for producers who've actually written a story
    // and added a cover photo — showing an empty-bio card would undercut the section's
    // whole point.
    supabase.from('farms').select('slug, name, bio, location, producer_type, cover_photo_url').not('bio', 'is', null).not('cover_photo_url', 'is', null).limit(3),
    getLiveMarketplaceEnabled(),
    supabase.from('farm_locations').select('farm_id'),
    resolveArea(),
    getActiveAreas(),
  ])

  // Fetched right after the main batch (not sequentially blocking it) since it needs
  // the resolved area's value first. getActiveAreas() inside is React-cache()'d, so
  // this doesn't re-run that query. Only fetched when an area actually resolved —
  // there's nothing honest to show stats for otherwise.
  const areaStats = area ? await getAreaEntities(area.state, area.citySlug) : null

  const farmIdsWithLocations = new Set((farmLocationRows || []).map(l => l.farm_id))

  const followedFarmIds = new Set((myFollows || []).map(f => f.farm_id))
  const productsByFarm = (farmProductsRaw || []).reduce((acc, p) => {
    (acc[p.farm_id] = acc[p.farm_id] || []).push(p)
    return acc
  }, {})
  const newProducers = (realFarms || []).map(f => {
    const farmProducts = productsByFarm[f.id] || []
    return {
      id: f.id,
      slug: f.slug,
      name: f.name,
      location: f.location,
      bio: f.bio,
      tags: f.tags,
      avatarBg: f.avatar_bg,
      logoUrl: f.logo_url,
      producerType: f.producer_type,
      verificationStatus: f.verification_status,
      sellOnGrano: f.sell_on_grano,
      practices: f.practices,
      isFollowing: followedFarmIds.has(f.id),
      productCount: farmProducts.length,
      availableProducts: farmProducts.filter(p => p.for_sale && p.is_available !== false).map(p => p.name),
    }
  })

  // Normally only show products from farms that have actually turned on "Sell on
  // Grano" — but while the site-wide switch is paused, nothing is purchasable
  // anyway (every card falls back to "Not sold on Grano yet" + a "Find us here"
  // link), so there's no reason to hide products just because their farm hasn't
  // flipped that toggle on yet. Browsing/discovery should work either way.
  const normalizedRealProducts = (realProducts || [])
    .filter(p => liveMarketplaceEnabled ? p.farm?.sell_on_grano : true)
    .map(p => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      unit: p.unit,
      unitDetail: p.unit_detail,
      harvestedAt: p.harvested_at,
      location: p.farm?.location || 'Chicago, IL',
      stock: p.stock,
      stockUnit: p.stock_unit,
      seasonEnds: p.season_ends,
      badge: p.badge,
      badgeColor: p.badge_color,
      imgBg: p.img_bg,
      imageUrl: p.image_url,
      category: p.category,
      farmSlug: p.farm?.slug,
      farmName: p.farm?.name,
      hasFindUsLocations: farmIdsWithLocations.has(p.farm_id),
      sourcedFromCount: p.product_sources?.length || 0,
      isPreorder: p.is_preorder,
      preorderNote: p.preorder_note,
      forSale: p.for_sale,
      isAvailable: p.is_available,
    }))

  // Preorder items sit in the regular grid alongside everything else — ProductCard
  // itself renders the Preorder badge/CTA, no separate section. While paused, a
  // preorder item shows regardless of for_sale (it usually isn't "for sale" yet,
  // that's the point). Once live, "active" preorder means actually orderable, so it
  // needs for_sale like any other product — same rule everything else already follows.
  const marketplaceProducts = normalizedRealProducts.filter(p =>
    liveMarketplaceEnabled ? (p.forSale && p.isAvailable) : (p.isPreorder || (p.forSale && p.isAvailable))
  )

  return (
    <>
      {/* The intro hero (title/tagline/Producers-Restaurants-Consumers cards) is a
          pitch for someone not using Grano yet — a signed-in account skips straight
          to the marketplace itself, Live Market ticker included. */}
      {!user && <HomeHero isLoggedIn={false} area={area} />}
      <MarketplaceClient
        newProducers={newProducers}
        realProducts={marketplaceProducts}
        allFarms={allFarms || []}
        canMessage={Boolean(isRestaurantRole)}
        isLoggedIn={Boolean(user)}
        liveMarketplaceEnabled={liveMarketplaceEnabled}
        areaLabel={area ? `${area.city}-area` : 'Chicago-area'}
      />
      <SourceLocalSection sourcingRequests={openSourcingRequests || []} />
      <GetDiscoveredSection />
      <MeetProducersSection farms={storyFarms || []} />
      {area && areaStats && <LocalNetworkStats area={area} stats={areaStats} />}
      <ExploreCommunitiesSection areas={activeAreas || []} />
    </>
  )
}
