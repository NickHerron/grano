import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getInitials } from '@/lib/initials'
import SectionTabs from '@/components/SectionTabs'
import BusinessNetworkManager from './BusinessNetworkManager'
import { getBusinessNetwork } from '@/lib/networkQueries'
import { getRolesForMany } from '@/lib/businessRoleQueries'
import { hostsVendors } from '@/lib/businessRoles'

async function FollowingContent({ userId }) {
  const supabase = createClient()
  const [{ data: follows }, { data: purchasedItems }] = await Promise.all([
    supabase
      .from('follows')
      .select(`
        created_at,
        farm:farms(id, slug, name, location, neighborhood, producer_type, logo_url, verification_status, sells_wholesale),
        restaurant:restaurants(id, slug, name, location, neighborhood, restaurant_type, logo_url, verification_status)
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false }),
    // Which farms this account has an actual completed order from — distinct from
    // just following, since "I follow them" and "I've bought from them" are different
    // signals and the page shouldn't blur the two together.
    supabase
      .from('order_items')
      .select('farm_id, order:orders!inner(buyer_id, status)')
      .eq('order.buyer_id', userId)
      .eq('order.status', 'placed'),
  ])

  const purchasedFarmIds = new Set((purchasedItems || []).map(i => i.farm_id))
  const items = (follows || []).filter(f => f.farm || f.restaurant)

  return (
    <div>
      <p className="text-[13px] text-stone mb-5">Producers and restaurants you follow — and which ones you've actually bought from.</p>
      {items.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((f, i) => {
            const entity = f.farm || f.restaurant
            const href = f.farm ? `/producers/${entity.slug}` : `/restaurants/${entity.slug}`
            const subtitle = f.farm ? entity.producer_type : entity.restaurant_type
            const purchased = Boolean(f.farm) && purchasedFarmIds.has(entity.id)
            return (
              <Link key={i} href={href}
                className="bg-white border border-[#ECEAE4] rounded-xl p-4 flex items-center gap-4 hover:border-rust transition-colors">
                <div className="w-14 h-14 rounded-xl bg-linen flex items-center justify-center overflow-hidden flex-shrink-0">
                  {entity.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entity.logo_url} alt={entity.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-serif text-base font-semibold text-soil/30">{getInitials(entity.name)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-serif text-[16px] font-semibold text-soil truncate">{entity.name}</span>
                    {entity.verification_status === 'verified' && (
                      <span title="Verified" className="w-4 h-4 rounded-full bg-sage text-white flex items-center justify-center text-[9px] flex-shrink-0">✓</span>
                    )}
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-stone bg-linen px-1.5 py-0.5 rounded flex-shrink-0">
                      {f.farm ? 'Producer' : 'Restaurant'}
                    </span>
                  </div>
                  <div className="text-[12px] text-stone truncate mb-1.5">
                    {[subtitle, [entity.neighborhood, entity.location].filter(Boolean).join(' · ')].filter(Boolean).join(' · ')}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${
                      purchased ? 'bg-[#EBF3EC] text-sage' : 'bg-linen text-stone'
                    }`}>
                      {purchased ? '✓ Purchased from' : 'Following'}
                    </span>
                    {f.farm && entity.sells_wholesale && (
                      <span className="inline-block text-[10px] font-semibold bg-[#FDF0E8] text-rust px-2 py-0.5 rounded">Wholesale available</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
          <p className="text-[14px] text-stone mb-4">You're not following anyone yet.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/producers" className="inline-block bg-rust text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">
              Browse Producers →
            </Link>
            <Link href="/restaurants" className="inline-block border-[1.5px] border-[#ECEAE4] text-soil text-[13px] font-semibold px-5 py-2.5 rounded-lg hover:border-rust transition-colors">
              Browse Restaurants →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default async function FollowingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: farm }, { data: restaurant }, { data: organizations }] = await Promise.all([
    supabase.from('farms').select('id, slug, name').eq('owner_id', user.id).maybeSingle(),
    supabase.from('restaurants').select('id, slug, name').eq('owner_id', user.id).maybeSingle(),
    // Plural — multi-organization-per-owner already works (see /dashboard/organization),
    // same ordering so the two pages list an owner's orgs in the same sequence.
    supabase.from('organizations').select('id, slug, name, org_type').eq('owner_id', user.id).order('created_at', { ascending: true }),
  ])

  const businesses = [
    farm && { type: 'farm', id: farm.id, slug: farm.slug, name: farm.name, userId: user.id },
    restaurant && { type: 'restaurant', id: restaurant.id, slug: restaurant.slug, name: restaurant.name, userId: user.id },
    ...(organizations || []).map(o => ({ type: 'organization', id: o.id, slug: o.slug, name: o.name, userId: user.id, orgType: o.org_type })),
  ].filter(Boolean)

  // Roles determine whether an organization's collaboration group reads "Vendors &
  // Partners" (farmers market / food hub) or stays generic — see hostsVendors() in
  // businessRoles.js, the same condition RealOrganizationProfile.jsx uses for the
  // public profile's Vendors section.
  const orgIds = businesses.filter(b => b.type === 'organization').map(b => b.id)
  const rolesByOrgId = await getRolesForMany(supabase, 'organization', orgIds)

  // Which organizations this account's farm has already linked a Find Us location to
  // — ListAtMarketPrompt uses this to never offer the same market twice.
  const { data: linkedLocations } = farm
    ? await supabase.from('farm_locations').select('organization_id').eq('farm_id', farm.id).not('organization_id', 'is', null)
    : { data: [] }
  const linkedOrganizationIds = new Set((linkedLocations || []).map(l => l.organization_id))

  const networkEntries = await Promise.all(businesses.map(b => getBusinessNetwork(supabase, b)))
  // Pending invitations THIS account received (as the target, not ones it sent) —
  // that's the count worth flagging with a badge on the tab itself.
  const pendingReceivedCount = businesses.reduce((sum, b, i) => {
    const receivedHere = networkEntries[i].filter(e => e.status === 'pending' && !(e.initiator_type === b.type && e.initiator_id === b.id))
    return sum + receivedHere.length
  }, 0)

  const tabs = [
    { key: 'following', label: 'Following', content: <FollowingContent userId={user.id} /> },
    ...(businesses.length > 0 ? [{
      key: 'network',
      label: 'Our Business Network',
      badge: pendingReceivedCount || null,
      content: (
        <div className="flex flex-col gap-6">
          <p className="text-[13px] text-stone">
            Real business relationships — who you source from, who you supply, and who you collaborate with. Separate from Following:
            following just means "keep me posted," a network connection means this business is actually part of your local food ecosystem.
          </p>
          {businesses.map((b, i) => (
            <BusinessNetworkManager key={`${b.type}-${b.id}`} business={b} entries={networkEntries[i]}
              hostsVendors={b.type === 'organization' && hostsVendors(rolesByOrgId[b.id] || [], b.orgType)}
              linkedOrganizationIds={b.type === 'farm' ? linkedOrganizationIds : undefined} />
          ))}
        </div>
      ),
    }] : []),
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">My Network</h1>
        <p className="text-[14px] text-stone">Everyone and everything connected to you on Grano.</p>
      </div>
      <Suspense fallback={null}>
        <SectionTabs tabs={tabs} paramName="section" />
      </Suspense>
    </div>
  )
}
