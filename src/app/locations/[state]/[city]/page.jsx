import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAreaEntities, getActiveAreas, networkStage } from '@/lib/locationQueries'
import { getLiveMarketplaceEnabled } from '@/lib/marketplace'
import { stateLabel } from '@/lib/geography'
import ProducerCard from '@/components/ProducerCard'
import RestaurantCard from '@/components/RestaurantCard'
import MarketCard from '@/components/MarketCard'

export async function generateMetadata({ params }) {
  const supabase = createClient()
  const state = params.state.toUpperCase()
  const areas = await getActiveAreas()
  const match = areas.find(a => a.state === state && a.citySlug === params.city)
  if (match) {
    return {
      title: `${match.city}, ${match.state} Local Food Network | Grano`,
      description: `Discover producers, restaurants, markets, and organizations in ${match.city}, ${match.state}'s local food network on Grano.`,
    }
  }
  // No activity yet, but might still be a real Census place (the zero-activity
  // escape hatch below) — check before declaring it not found.
  const { data: geoPlace } = await supabase.from('geographies').select('name')
    .eq('type', 'place').eq('state_code', state).eq('slug', params.city).maybeSingle()
  if (!geoPlace) return { title: 'Community not found | Grano' }
  const name = geoPlace.name.replace(/\s+(city|town|village|CDP|borough)$/i, '')
  return {
    title: `${name}, ${state} Local Food Network | Grano`,
    description: `Discover producers, restaurants, markets, and organizations in ${name}, ${state}'s local food network on Grano.`,
  }
}

// /locations/[state]/[city] — never reverse-parses the slug back into a city name
// (lossy: "st-louis" could be "St. Louis" or "St Louis"). Instead getAreaEntities()
// fetches every geography-tagged entity in the state and matches by re-slugifying
// each row's own city in JS, which naturally collapses spelling variants onto one
// page. getAreaEntities() itself is untouched by this phase — this page only changes
// what it DISPLAYS around that same entity set, plus one additive 404 escape hatch:
// a real Census place (from the National Geographic Foundation seed) can now render
// an honest empty page even with zero entities and no admin-tracked market_areas row
// — strictly additive, can only turn a 404 into a page, never the reverse.
export default async function LocationCityPage({ params }) {
  const supabase = createClient()
  const state = params.state.toUpperCase()
  const citySlug = params.city

  const [entities, areas, globalMarketplaceEnabled, { data: geoPlace }] = await Promise.all([
    getAreaEntities(state, citySlug),
    getActiveAreas(),
    getLiveMarketplaceEnabled(),
    supabase.from('geographies').select('id, name, county_geography_id')
      .eq('type', 'place').eq('state_code', state).eq('slug', citySlug).maybeSingle(),
  ])

  const area = areas.find(a => a.state === state && a.citySlug === citySlug)
  const totalEntities = entities.farms.length + entities.restaurants.length + entities.organizations.length
  if (totalEntities === 0 && !area?.marketArea && !geoPlace) notFound()

  // A real county row for the breadcrumb — only fetched when there's an actual place
  // to hang it off of.
  const { data: county } = geoPlace?.county_geography_id
    ? await supabase.from('geographies').select('name, slug').eq('id', geoPlace.county_geography_id).maybeSingle()
    : { data: null }

  const cityLabel = entities.cityLabel || area?.city || geoPlace?.name.replace(/\s+(city|town|village|CDP|borough)$/i, '') || citySlug
  const stage = networkStage(totalEntities)
  // An AND, never an OR — this can only ever show LESS shop-now language than the
  // real global switch allows, never more. See schema_market_areas.sql.
  const showShopCta = globalMarketplaceEnabled && area?.marketArea?.marketplace_enabled === true

  // Follow status + product counts, same normalization producers/page.jsx uses, so
  // ProducerCard gets the exact shape it expects.
  const { data: { user } } = await supabase.auth.getUser()
  const farmIds = entities.farms.map(f => f.id)
  const [{ data: myFollows }, { data: products }] = await Promise.all([
    user ? supabase.from('follows').select('farm_id').eq('follower_id', user.id) : Promise.resolve({ data: [] }),
    farmIds.length ? supabase.from('products').select('farm_id, name, for_sale, is_available').in('farm_id', farmIds) : Promise.resolve({ data: [] }),
  ])
  const followedFarmIds = new Set((myFollows || []).map(f => f.farm_id))
  const productsByFarm = (products || []).reduce((acc, p) => {
    (acc[p.farm_id] = acc[p.farm_id] || []).push(p)
    return acc
  }, {})
  const mappedFarms = entities.farms.map(f => {
    const farmProducts = productsByFarm[f.id] || []
    return {
      id: f.id, slug: f.slug, name: f.name, location: f.location, bio: f.bio,
      avatarBg: f.avatar_bg, logoUrl: f.logo_url, producerType: f.producer_type,
      secondaryTypes: f.secondary_types || [], verificationStatus: f.verification_status,
      sellOnGrano: f.sell_on_grano, practices: f.practices,
      sellsWholesale: f.sells_wholesale, buysWholesale: f.buys_wholesale,
      isFollowing: followedFarmIds.has(f.id), productCount: farmProducts.length,
      availableProducts: farmProducts.filter(p => p.for_sale && p.is_available !== false).map(p => p.name),
    }
  })

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10">
      <Link href="/locations" className="text-[12px] font-semibold text-stone hover:text-soil mb-4 inline-block">← All Communities</Link>

      <div className="mb-6">
        <h1 className="font-serif text-[28px] sm:text-[34px] font-semibold tracking-tight text-soil mb-1">
          {cityLabel}'s <em className="italic text-rust">Local Food Network</em>
        </h1>
        <p className="text-[14px] text-stone">
          {county && (
            <>
              <Link href={`/locations/${state.toLowerCase()}/county/${county.slug}`} className="hover:text-rust transition-colors">{county.name}</Link>
              {' · '}
            </>
          )}
          {stateLabel(state)} · {stage}
        </p>
      </div>

      {/* STATS */}
      <div className="flex flex-wrap gap-8 bg-white border border-[#ECEAE4] rounded-xl px-6 py-5 mb-8">
        <Stat n={entities.farms.length} label="Producers" />
        <Stat n={entities.restaurants.length} label="Restaurants" />
        <Stat n={entities.organizations.length} label="Organizations" />
        <Stat n={entities.productCount} label="Products" />
      </div>

      {/* MARKETPLACE BANNER */}
      <div className={`rounded-xl p-5 mb-10 ${showShopCta ? 'bg-[#EBF3EC]' : 'bg-linen'}`}>
        {showShopCta ? (
          <>
            <div className="text-[14px] font-semibold text-sage mb-1">Shop Local</div>
            <p className="text-[13px] text-stone mb-3">{cityLabel}'s marketplace is active — order for pickup from local producers.</p>
            <Link href="/" className="inline-block text-[13px] font-semibold text-white bg-sage px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
              Browse Marketplace →
            </Link>
          </>
        ) : (
          <>
            <div className="text-[14px] font-semibold text-soil mb-1">Marketplace Coming Soon</div>
            <p className="text-[13px] text-stone">{area?.marketArea ? `Grano is building pickup infrastructure in ${cityLabel}.` : `Grano isn't tracking ${cityLabel} as a market area yet.`} You can still discover and follow everyone below.</p>
          </>
        )}
      </div>

      {/* ENTITY GRID */}
      {totalEntities > 0 ? (
        <div className="flex flex-col gap-10">
          {mappedFarms.length > 0 && (
            <section>
              <h2 className="font-serif text-[19px] font-semibold text-soil mb-4">Producers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {mappedFarms.map(f => <ProducerCard key={f.id} farm={f} />)}
              </div>
            </section>
          )}
          {entities.restaurants.length > 0 && (
            <section>
              <h2 className="font-serif text-[19px] font-semibold text-soil mb-4">Restaurants</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {entities.restaurants.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
              </div>
            </section>
          )}
          {entities.organizations.length > 0 && (
            <section>
              <h2 className="font-serif text-[19px] font-semibold text-soil mb-4">Organizations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {entities.organizations.map(o => <MarketCard key={o.id} organization={o} />)}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
          <p className="text-[14px] text-stone">No profiles here yet — help build {cityLabel}'s local food network.</p>
          <Link href="/dashboard/profiles/new" className="inline-block mt-3 text-[13px] font-semibold text-rust hover:underline">Create a profile →</Link>
        </div>
      )}
    </div>
  )
}

function Stat({ n, label }) {
  return (
    <div>
      <div className="font-serif text-[24px] font-semibold text-soil">{n}</div>
      <div className="text-[11px] text-stone uppercase tracking-wide">{label}</div>
    </div>
  )
}
