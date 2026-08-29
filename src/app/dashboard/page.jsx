import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeRoles } from '@/lib/accountRoles'
import { computeProfileCompletion, buildProfileRecommendations } from '@/lib/profileCompletion'
import { VERIFICATION_LABELS } from '@/lib/producerOptions'
import { requiredTypeIds, buildDocumentRows } from '@/lib/documentRequirements'
import { computeSellingReadiness } from '@/lib/sellingReadiness'
import { nextOccurrence, daysUntil, formatScheduleLine } from '@/lib/schedule'
import { formatDate } from '@/lib/formatDate'
import { findOpportunitiesForProducer, findVendorsForRestaurant } from '@/lib/matching'
import OnboardingCard from './OnboardingCard'

function dayLabel(days) {
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

export default async function DashboardOverview() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('account_roles').select('role').eq('user_id', user.id),
  ])

  const roles = computeRoles(roleRows, profile?.role)

  const [farmResult, restaurantResult] = await Promise.all([
    roles.has('producer') ? supabase.from('farms').select('*').eq('owner_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
    roles.has('restaurant') ? supabase.from('restaurants').select('*').eq('owner_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  const farm = farmResult.data
  const restaurant = restaurantResult.data

  let recentSentInquiries = []
  let potentialVendors = []
  if (restaurant) {
    const [{ data }, { data: myRequests }, { data: allFarmProducts }] = await Promise.all([
      // Migrated off the frozen wholesale_inquiries archive table — work_inquiries is
      // the live table every inquiry (wholesale or otherwise) has written to since the
      // Work With Us cutover; only `.length` is used here, not the row contents.
      supabase.from('work_inquiries').select('id').eq('from_type', 'restaurant').eq('from_id', restaurant.id).order('updated_at', { ascending: false }).limit(4),
      supabase.from('sourcing_requests').select('product_name').eq('owner_type', 'restaurant').eq('owner_id', restaurant.id).eq('status', 'open'),
      supabase.from('products').select('name, category, farm:farms(id, name, slug, location, producer_type, verification_status)'),
    ])
    recentSentInquiries = data || []

    if (myRequests?.length) {
      const byFarm = new Map()
      for (const p of allFarmProducts || []) {
        if (!p.farm) continue
        if (!byFarm.has(p.farm.id)) byFarm.set(p.farm.id, { farm: p.farm, products: [] })
        byFarm.get(p.farm.id).products.push(p)
      }
      potentialVendors = findVendorsForRestaurant(myRequests, [...byFarm.values()]).slice(0, 4)
    }
  }

  let producerStats = null
  let sellingReadiness = null
  let recentMessages = []
  let unreadMessageCount = 0
  let recentInquiries = []
  let pendingInquiryCount = 0
  let upcomingMarketDates = []
  let producerOpportunities = []
  if (farm) {
    const [
      { data: products }, { count: photoCount }, { count: locationCount }, { data: followerCountRaw },
      { data: documentTypes }, { data: requirements }, { data: documents },
      { data: messages }, { count: unreadCount },
      { data: inquiries }, { count: pendingCount },
      { data: locations },
      { data: openRequests },
      { count: networkCount },
      { count: workOptionCount },
    ] = await Promise.all([
      supabase.from('products').select('id, view_count, name, category, season_start_month').eq('farm_id', farm.id),
      supabase.from('farm_photos').select('id', { count: 'exact', head: true }).eq('farm_id', farm.id),
      supabase.from('farm_locations').select('id', { count: 'exact', head: true }).eq('farm_id', farm.id),
      // get_follow_count() is a security definer function — a plain count() against
      // the raw follows table is RLS-locked to the caller's own rows, which for a
      // producer viewing their own dashboard (not a follower of their own farm)
      // always reads 0.
      supabase.rpc('get_follow_count', { p_farm_id: farm.id }),
      supabase.from('document_types').select('*'),
      supabase.from('document_requirements').select('*'),
      supabase.from('documents').select('*').eq('farm_id', farm.id),
      supabase.from('messages').select('*, sender:profiles!messages_sender_id_fkey(restaurant_name, full_name)').or(`farm_id.eq.${farm.id},farm_id.is.null`).order('created_at', { ascending: false }).limit(3),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('farm_id', farm.id).is('read_at', null),
      // Same migration as the restaurant branch above — work_inquiries, not the frozen
      // wholesale_inquiries archive. 'new' is work_inquiries' equivalent of the old
      // table's 'pending' (arrived, not yet responded to) — see schema_work_inquiries.sql.
      supabase.from('work_inquiries').select('id').eq('to_type', 'farm').eq('to_id', farm.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('work_inquiries').select('id', { count: 'exact', head: true }).eq('to_type', 'farm').eq('to_id', farm.id).eq('status', 'new'),
      supabase.from('farm_locations').select('*').eq('farm_id', farm.id),
      supabase.from('sourcing_requests').select('*, restaurant:restaurants(name, slug)').eq('status', 'open'),
      supabase.from('business_relationships').select('id', { count: 'exact', head: true }).eq('status', 'accepted')
        .or(`and(initiator_type.eq.farm,initiator_id.eq.${farm.id}),and(target_type.eq.farm,target_id.eq.${farm.id})`),
      supabase.from('business_work_options').select('id', { count: 'exact', head: true }).eq('business_type', 'farm').eq('business_id', farm.id).eq('enabled', true),
    ])
    const followerCount = followerCountRaw || 0
    const productCount = products?.length || 0
    const totalProductViews = (products || []).reduce((s, p) => s + (p.view_count || 0), 0)
    const topProducts = [...(products || [])].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 3)
    const { percent, checklist } = computeProfileCompletion(farm, {
      productCount, photoCount: photoCount || 0, locationCount: locationCount || 0,
      hasSeasonalProduct: (products || []).some(p => p.season_start_month),
    })
    // The dashboard's "Profile completion" card links to the single most useful next
    // step instead of just a bare "Finish your profile" link — per the onboarding
    // spec's explicit instruction that optimization guidance should never be a bare
    // percentage with no direction.
    const recommendations = buildProfileRecommendations(farm, {
      productCount,
      locationCount: (locations || []).filter(l => l.location_type !== 'event').length,
      networkCount: networkCount || 0,
      workOptionCount: workOptionCount || 0,
      documentCount: (documents || []).length,
    })
    const topRecommendation = recommendations.find(r => !r.done) || null
    producerStats = { productCount, totalProductViews, topProducts, percent, checklist, followerCount: followerCount || 0, topRecommendation }

    producerOpportunities = findOpportunitiesForProducer(products || [], openRequests || [])

    const requiredIds = requiredTypeIds(requirements || [], 'producer', farm.producer_type, Boolean(farm.sells_wholesale))
    const docRows = buildDocumentRows(documentTypes || [], documents || [], requiredIds)
    sellingReadiness = computeSellingReadiness(farm, { hasProducts: productCount > 0, requiredDocRows: docRows.filter(r => r.required) })

    recentMessages = messages || []
    unreadMessageCount = unreadCount || 0
    recentInquiries = inquiries || []
    pendingInquiryCount = pendingCount || 0

    upcomingMarketDates = (locations || [])
      .map(loc => ({ loc, date: nextOccurrence(loc, { horizonDays: 45 }) }))
      .filter(x => x.date)
      .sort((a, b) => a.date - b.date)
      .slice(0, 3)

    // Simple reminder, no scheduler needed: if a market is happening today or
    // tomorrow, drop a notification the first time the dashboard is loaded today —
    // deduped against ones already created today so revisiting doesn't spam it.
    const dueSoon = upcomingMarketDates.filter(x => daysUntil(x.date) <= 1)
    if (dueSoon.length) {
      const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
      const { data: alreadySent } = await supabase
        .from('notifications')
        .select('title')
        .eq('user_id', user.id)
        .eq('type', 'market_reminder')
        .gte('created_at', startOfToday.toISOString())
      const sentTitles = new Set((alreadySent || []).map(n => n.title))

      for (const { loc, date } of dueSoon) {
        const title = `Reminder: ${loc.name} is ${daysUntil(date) === 0 ? 'today' : 'tomorrow'}`
        if (sentTitles.has(title)) continue
        supabase.from('notifications').insert({
          user_id: user.id, type: 'market_reminder', title,
          body: formatScheduleLine(loc), link: '/dashboard/profile?section=producer&tab=find-us',
        }).then(() => {})
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">Welcome back, {profile?.full_name || 'there'}</h1>
        <p className="text-[14px] text-stone">One Grano account — {[...roles].length > 1 ? 'here\'s everything across your roles.' : 'here\'s what\'s new.'}</p>
      </div>

      {roles.has('admin') && (
        <div>
          <h2 className="font-serif text-[18px] font-semibold text-soil mb-3">Admin</h2>
          <Link href="/dashboard/admin" className="inline-block bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">
            Open Admin Panel →
          </Link>
        </div>
      )}

      {roles.has('producer') && (
        <section className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="font-serif text-[18px] font-semibold text-soil">Producer — {farm?.name}</h2>
            <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded ${
              farm?.verification_status === 'verified' ? 'bg-[#EBF3EC] text-sage' : 'bg-linen text-stone'
            }`}>
              {VERIFICATION_LABELS[farm?.verification_status] || 'Unverified'}
            </span>
          </div>

          {farm?.onboarding_status && farm.onboarding_status !== 'published' && (
            <OnboardingCard farmId={farm.id} />
          )}

          {producerStats && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-[#ECEAE4] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[13px] font-semibold text-soil">Messages</div>
                    {unreadMessageCount > 0 && (
                      <span className="text-[10px] font-bold text-white bg-rust w-5 h-5 rounded-full flex items-center justify-center">{unreadMessageCount}</span>
                    )}
                  </div>
                  <p className="text-[12px] text-stone mb-3">{recentMessages.length ? `${recentMessages.length} recent` : 'No messages yet.'}</p>
                  <Link href="/dashboard/messages?section=inbox" className="text-[12px] font-semibold text-rust hover:underline">View all →</Link>
                </div>

                <div className="bg-white border border-[#ECEAE4] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[13px] font-semibold text-soil">Requests</div>
                    {pendingInquiryCount > 0 && (
                      <span className="text-[10px] font-bold text-white bg-rust w-5 h-5 rounded-full flex items-center justify-center">{pendingInquiryCount}</span>
                    )}
                  </div>
                  <p className="text-[12px] text-stone mb-3">{recentInquiries.length ? `${pendingInquiryCount} pending` : 'No inquiries yet.'}</p>
                  <Link href="/dashboard/messages?section=inquiries" className="text-[12px] font-semibold text-rust hover:underline">View all →</Link>
                </div>

                <div className="bg-white border border-[#ECEAE4] rounded-xl p-5">
                  <div className="text-[13px] font-semibold text-soil mb-1">Upcoming Market Dates</div>
                  {upcomingMarketDates.length ? (
                    <div className="flex flex-col gap-2 mb-3 mt-2">
                      {upcomingMarketDates.slice(0, 2).map(({ loc, date }) => {
                        const days = daysUntil(date)
                        return (
                          <div key={loc.id} className="text-[12px]">
                            <span className="font-semibold text-soil">{loc.name}</span>
                            <p className="text-stone">
                              <span className={days <= 2 ? 'text-rust font-semibold' : ''}>{dayLabel(days)}</span>
                              {' · '}{formatDate(date, { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[12px] text-stone mb-3">No upcoming dates set.</p>
                  )}
                  <Link href="/dashboard/profile?section=producer&tab=find-us" className="text-[12px] font-semibold text-rust hover:underline">Manage Find Us →</Link>
                </div>
              </div>

              <div className="bg-white border border-[#ECEAE4] rounded-xl p-6">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[14px] font-semibold text-soil">Opportunities</div>
                  {producerOpportunities.length > 0 && (
                    <span className="text-[10px] font-bold text-white bg-rust w-5 h-5 rounded-full flex items-center justify-center">{producerOpportunities.length}</span>
                  )}
                </div>
                <p className="text-[12px] text-stone mb-3">
                  {producerOpportunities.length > 0
                    ? `${producerOpportunities.length} restaurant${producerOpportunities.length === 1 ? ' is' : 's are'} looking for products you sell.`
                    : 'Chicago restaurants are actively looking to buy local — see what they need.'}
                </p>
                <Link href="/dashboard/wholesale?section=opportunities" className="text-[12px] font-semibold text-rust hover:underline">
                  {producerOpportunities.length > 0 ? 'View opportunities →' : 'See what buyers want →'}
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-[#ECEAE4] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[14px] font-semibold text-soil">Profile completion</div>
                    <div className="font-serif text-[20px] font-semibold text-rust">{producerStats.percent}%</div>
                  </div>
                  <div className="h-2 bg-linen rounded-full overflow-hidden my-3">
                    <div className="h-full bg-rust rounded-full transition-all" style={{ width: `${producerStats.percent}%` }} />
                  </div>
                  {producerStats.topRecommendation ? (
                    <>
                      <p className="text-[12px] text-stone mb-1.5">{producerStats.topRecommendation.why}</p>
                      <Link href={`/onboarding/${producerStats.topRecommendation.stepKey}`} className="text-[13px] font-semibold text-rust hover:underline">
                        {producerStats.topRecommendation.label} →
                      </Link>
                    </>
                  ) : (
                    <Link href="/dashboard/profile?section=producer" className="text-[13px] font-semibold text-rust hover:underline">
                      Finish your profile →
                    </Link>
                  )}
                </div>

                {sellingReadiness && (
                  <div className="bg-white border border-[#ECEAE4] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[14px] font-semibold text-soil">Ready to Sell</div>
                      <div className="font-serif text-[20px] font-semibold text-rust">{sellingReadiness.percent}%</div>
                    </div>
                    <div className="h-2 bg-linen rounded-full overflow-hidden my-3">
                      <div className="h-full bg-sage rounded-full transition-all" style={{ width: `${sellingReadiness.percent}%` }} />
                    </div>
                    <Link href="/dashboard/profile?section=producer&tab=documents" className="text-[13px] font-semibold text-rust hover:underline">
                      Manage documents →
                    </Link>
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#ECEAE4] rounded-xl p-6">
                <div className="text-[14px] font-semibold text-soil mb-4">Analytics</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  <div>
                    <div className="font-serif text-[26px] font-semibold text-soil">{farm?.profile_view_count || 0}</div>
                    <div className="text-[12px] text-stone">Profile views</div>
                  </div>
                  <div>
                    <div className="font-serif text-[26px] font-semibold text-soil">{producerStats.totalProductViews}</div>
                    <div className="text-[12px] text-stone">Product views</div>
                  </div>
                  <div>
                    <div className="font-serif text-[26px] font-semibold text-soil">{producerStats.followerCount}</div>
                    <div className="text-[12px] text-stone">Followers</div>
                  </div>
                  <div>
                    <div className="font-serif text-[26px] font-semibold text-soil">{producerStats.productCount}</div>
                    <div className="text-[12px] text-stone">Products listed</div>
                  </div>
                </div>
                {producerStats.topProducts.length > 0 && producerStats.topProducts[0].view_count > 0 && (
                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-wide text-stone mb-2">Most viewed</div>
                    <div className="flex flex-col gap-1.5">
                      {producerStats.topProducts.map(p => (
                        <div key={p.id} className="flex justify-between text-[13px]">
                          <span className="text-soil">{p.name}</span>
                          <span className="text-stone">{p.view_count} views</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {roles.has('restaurant') && (
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="font-serif text-[18px] font-semibold text-soil">Restaurant / Buyer — {restaurant?.name || profile?.restaurant_name || 'Your restaurant'}</h2>
            {restaurant?.verification_status === 'verified' && (
              <span className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded bg-[#EBF3EC] text-sage">Verified</span>
            )}
          </div>
          <div className="bg-white border border-[#ECEAE4] rounded-xl p-6">
            <div className="text-[13px] text-stone leading-relaxed mb-4">
              Browse the <Link href="/wholesale" className="text-rust font-semibold hover:underline">Wholesale Marketplace</Link>, post <Link href="/dashboard/wholesale?section=sourcing" className="text-rust font-semibold hover:underline">what you're looking for</Link>, track
              your <Link href="/dashboard/following" className="text-rust font-semibold hover:underline">vendors</Link> and <Link href="/dashboard/messages?section=sent" className="text-rust font-semibold hover:underline">wholesale inquiries</Link>, message
              producers directly from any producer's page, and leave reviews after ordering.
            </div>
            {restaurant && (
              <div className="flex items-center gap-3">
                <Link href="/dashboard/profile?section=restaurant" className="bg-rust text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-[#A8521F] transition-colors">
                  Edit Restaurant Profile →
                </Link>
                <Link href={`/restaurants/${restaurant.slug}`} className="text-[13px] font-semibold text-soil hover:underline">
                  View public page →
                </Link>
              </div>
            )}
          </div>

          {potentialVendors.length > 0 && (
            <div className="bg-white border border-[#ECEAE4] rounded-xl p-6">
              <div className="text-[14px] font-semibold text-soil mb-1">Potential Vendors</div>
              <p className="text-[12px] text-stone mb-3">
                {potentialVendors.length} local producer{potentialVendors.length === 1 ? '' : 's'} match{potentialVendors.length === 1 ? 'es' : ''} your sourcing needs.
              </p>
              <Link href="/dashboard/wholesale?section=matches" className="text-[13px] font-semibold text-rust hover:underline">View matches →</Link>
            </div>
          )}

          {recentSentInquiries.length > 0 && (
            <div className="bg-white border border-[#ECEAE4] rounded-xl p-5">
              <div className="text-[13px] font-semibold text-soil mb-1">Recent Inquiry Activity</div>
              <p className="text-[12px] text-stone mb-3">{recentSentInquiries.length} sent recently.</p>
              <Link href="/dashboard/messages?section=sent" className="text-[12px] font-semibold text-rust hover:underline">View all →</Link>
            </div>
          )}
        </section>
      )}

      {roles.has('customer') && !roles.has('producer') && !roles.has('restaurant') && (
        <div className="bg-white border border-[#ECEAE4] rounded-xl p-6">
          <div className="text-[14px] text-stone">Signed in as</div>
          <div className="text-[15px] font-semibold text-soil mb-3">{user.email}</div>
          <div className="text-[13px] text-stone leading-relaxed mb-4">
            Follow producers and restaurants, shop the market, and see what's in season — browse the <Link href="/" className="text-rust font-semibold hover:underline">market</Link>, <Link href="/producers" className="text-rust font-semibold hover:underline">producers</Link>, or <Link href="/restaurants" className="text-rust font-semibold hover:underline">restaurants</Link>.
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/following" className="text-[13px] font-semibold text-rust hover:underline">My Network →</Link>
            <Link href="/dashboard/orders" className="text-[13px] font-semibold text-rust hover:underline">Your orders →</Link>
          </div>
        </div>
      )}
    </div>
  )
}
