import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { findOpportunitiesForProducer, findVendorsForRestaurant } from '@/lib/matching'
import { hydrateSourcingRequestOwners } from '@/lib/sourcingOptions'
import SectionTabs from '@/components/SectionTabs'
import OpportunitiesContent from './OpportunitiesContent'
import MatchesContent from './MatchesContent'
import SourcingContent from '../restaurant/sourcing/SourcingContent'

// Wholesale used to be split across a standalone /wholesale marketplace link, a
// separate "Sourcing" nav item, and "My Inquiries" — this hub gathers the
// wholesale-specific workflow (matching + sourcing requests) in one place. Tabs are
// gated by each owned business's own sells_wholesale/buys_wholesale flags, not by
// which table the business lives in — a restaurant that buys wholesale gets Sourcing/
// Matches exactly like a farm that does, and a farm that sells wholesale gets
// Opportunities exactly like a restaurant would if it had a product catalog to sell
// from (see schema_wholesale_capabilities.sql). /wholesale itself stays a standalone
// page (it's a full browse/discovery experience, not a settings widget) and is linked
// prominently instead of embedded.
export default async function WholesaleHubPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: farm }, { data: restaurant }] = await Promise.all([
    supabase.from('farms').select('id, name, producer_type, sells_wholesale, buys_wholesale').eq('owner_id', user.id).maybeSingle(),
    supabase.from('restaurants').select('id, name, sells_wholesale, buys_wholesale').eq('owner_id', user.id).maybeSingle(),
  ])
  if (!farm && !restaurant) redirect('/dashboard')

  const tabs = []
  const subtitles = []

  // Opportunities ("other businesses are looking for what I sell") only makes sense
  // for a business that actually has a product catalog to match against — today only
  // ever a farm, since products stay farm-only (see the plan's stated scope boundary),
  // but expressed as a capability check rather than a type check.
  async function addOpportunitiesTab(business, businessType) {
    if (!business?.sells_wholesale) return
    const { data: products } = await supabase.from('products').select('id, name, category').eq('farm_id', business.id)
    if (!products?.length) return
    const { data: openRequests } = await supabase.from('sourcing_requests').select('*').eq('status', 'open')
    const hydrated = await hydrateSourcingRequestOwners(supabase, openRequests || [])
    const opportunities = findOpportunitiesForProducer(products, hydrated)
    tabs.push({
      key: `opportunities-${businessType}`, label: tabs.some(t => t.key.startsWith('opportunities')) ? `Opportunities (${business.name})` : 'Opportunities',
      badge: opportunities.length || null,
      content: <OpportunitiesContent opportunities={opportunities} />,
    })
    subtitles.push('Businesses looking for what you sell')
  }

  async function addBuyingTabs(business, businessType) {
    if (!business?.buys_wholesale) return
    const [{ data: requests }, { data: allFarmProducts }] = await Promise.all([
      supabase.from('sourcing_requests').select('*').eq('owner_type', businessType).eq('owner_id', business.id).order('created_at', { ascending: false }),
      supabase.from('products').select('name, category, farm:farms(id, name, slug, location, producer_type, verification_status)'),
    ])
    const openRequests = (requests || []).filter(r => r.status === 'open')
    const byFarm = new Map()
    for (const p of allFarmProducts || []) {
      if (!p.farm) continue
      if (!byFarm.has(p.farm.id)) byFarm.set(p.farm.id, { farm: p.farm, products: [] })
      byFarm.get(p.farm.id).products.push(p)
    }
    const vendors = openRequests.length ? findVendorsForRestaurant(openRequests, [...byFarm.values()]) : []
    const suffix = tabs.some(t => t.key.startsWith('sourcing')) ? ` (${business.name})` : ''

    tabs.push({ key: `sourcing-${businessType}`, label: `Sourcing${suffix}`, content: <SourcingContent ownerType={businessType} ownerId={business.id} requests={requests || []} /> })
    tabs.push({ key: `matches-${businessType}`, label: `Matches${suffix}`, badge: vendors.length || null, content: <MatchesContent vendors={vendors} /> })
    subtitles.push('Local producers matching what you need')
  }

  await addOpportunitiesTab(farm, 'farm')
  await addOpportunitiesTab(restaurant, 'restaurant')
  await addBuyingTabs(farm, 'farm')
  await addBuyingTabs(restaurant, 'restaurant')

  return (
    <div>
      <div className="mb-8 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">Wholesale</h1>
          <p className="text-[14px] text-stone">
            {subtitles.length ? [...new Set(subtitles)].join(' · ') : 'Turn on "We sell wholesale" or "We buy wholesale" in your profile settings to unlock matching here.'}
          </p>
        </div>
        <Link href="/wholesale" className="bg-rust text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors whitespace-nowrap">
          Browse Wholesale Marketplace →
        </Link>
      </div>
      {tabs.length > 0 ? (
        <Suspense fallback={null}>
          <SectionTabs tabs={tabs} paramName="section" />
        </Suspense>
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
          <p className="text-[14px] text-stone mb-3">Nothing to show yet — turn on a wholesale capability first.</p>
          <Link href={farm ? '/dashboard/profile?section=producer&tab=wholesale' : '/dashboard/profile?section=restaurant&tab=wholesale'}
            className="text-[13px] font-semibold text-rust hover:underline">Go to Wholesale settings →</Link>
        </div>
      )}
    </div>
  )
}
