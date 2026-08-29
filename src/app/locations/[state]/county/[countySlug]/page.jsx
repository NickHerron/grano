import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCountyEntities, networkStage } from '@/lib/locationQueries'
import { stateLabel } from '@/lib/geography'
import ProducerCard from '@/components/ProducerCard'
import RestaurantCard from '@/components/RestaurantCard'
import MarketCard from '@/components/MarketCard'

// The county-level fallback community — a separate, literal route segment ("county")
// rather than overloading /locations/[state]/[city] with two different meanings
// (place vs. county), avoiding the same reverse-slug-parsing risk that route already
// avoids. Small towns with little activity of their own point here once
// getPrimaryCommunity() lands somewhere that calls it; this route works standalone
// today via a direct link or the county's own real URL.
async function getCounty(state, countySlug) {
  const supabase = createClient()
  const { data } = await supabase.from('geographies')
    .select('id, name, slug, state_code, population')
    .eq('type', 'county').eq('state_code', state.toUpperCase()).eq('slug', countySlug)
    .maybeSingle()
  return data
}

export async function generateMetadata({ params }) {
  const county = await getCounty(params.state, params.countySlug)
  if (!county) return { title: 'County not found | Grano' }
  return {
    title: `${county.name}, ${stateLabel(county.state_code)} Local Food Network | Grano`,
    description: `Discover producers, restaurants, markets, and organizations across ${county.name}, ${stateLabel(county.state_code)} on Grano.`,
  }
}

export default async function CountyPage({ params }) {
  const county = await getCounty(params.state, params.countySlug)
  if (!county) notFound()

  const entities = await getCountyEntities(county)
  const totalEntities = entities.farms.length + entities.restaurants.length + entities.organizations.length
  const stage = networkStage(totalEntities)

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10">
      <Link href="/locations" className="text-[12px] font-semibold text-stone hover:text-soil mb-4 inline-block">← All Communities</Link>

      <div className="mb-6">
        <h1 className="font-serif text-[28px] sm:text-[34px] font-semibold tracking-tight text-soil mb-1">
          {county.name}'s <em className="italic text-rust">Local Food Network</em>
        </h1>
        <p className="text-[14px] text-stone">{stateLabel(county.state_code)} · {stage}</p>
      </div>

      <div className="flex flex-wrap gap-8 bg-white border border-[#ECEAE4] rounded-xl px-6 py-5 mb-8">
        <Stat n={entities.farms.length} label="Producers" />
        <Stat n={entities.restaurants.length} label="Restaurants" />
        <Stat n={entities.organizations.length} label="Organizations" />
        <Stat n={entities.productCount} label="Products" />
      </div>

      <div className="rounded-xl p-5 mb-10 bg-linen">
        <div className="text-[14px] font-semibold text-soil mb-1">Marketplace Coming Soon</div>
        <p className="text-[13px] text-stone">Grano isn't tracking {county.name} as a market area yet. You can still discover and follow everyone below.</p>
      </div>

      {totalEntities > 0 ? (
        <div className="flex flex-col gap-10">
          {entities.farms.length > 0 && (
            <section>
              <h2 className="font-serif text-[19px] font-semibold text-soil mb-4">Producers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {entities.farms.map(f => (
                  <ProducerCard key={f.id} farm={{
                    id: f.id, slug: f.slug, name: f.name, location: f.location, bio: f.bio,
                    avatarBg: f.avatar_bg, logoUrl: f.logo_url, producerType: f.producer_type,
                    verificationStatus: f.verification_status, sellOnGrano: f.sell_on_grano, practices: f.practices,
                    sellsWholesale: f.sells_wholesale, buysWholesale: f.buys_wholesale,
                    isFollowing: false, productCount: 0, availableProducts: [],
                  }} />
                ))}
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
          <p className="text-[14px] text-stone">No profiles here yet — help build {county.name}'s local food network.</p>
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
