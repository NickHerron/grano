import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RealProducerProfile from '@/components/RealProducerProfile'
import { getLiveMarketplaceEnabled } from '@/lib/marketplace'
import { getPublicNetwork } from '@/lib/networkQueries'
import { allowedWorkOptionKeys, defaultWorkOptionKeys, resolveWorkOptions } from '@/lib/workOptions'
import { getRolesFor } from '@/lib/businessRoleQueries'
import { overlayProducerCopy } from '@/lib/producerCopy'

async function getFarm(slug) {
  const supabase = createClient()
  const { data: farm } = await supabase.from('farms').select('*').eq('slug', slug).maybeSingle()
  return farm ? overlayProducerCopy(farm) : farm
}

export async function generateMetadata({ params }) {
  const farm = await getFarm(params.slug)
  if (!farm) return { title: "Producer not found | Grano" }

  const place = farm.neighborhood || farm.location
  const title = [farm.name, [place, farm.producer_type].filter(Boolean).join(' '), 'Grano'].filter(Boolean).join(' — ')
  const description = farm.bio || `${farm.name} on Grano — Chicago's local food network.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: farm.cover_photo_url ? [farm.cover_photo_url] : (farm.logo_url ? [farm.logo_url] : []),
    },
  }
}

export default async function ProducerPage({ params }) {
  const supabase = createClient()
  const farm = await getFarm(params.slug)

  if (!farm) {
    return (
      <div className="max-w-[600px] mx-auto px-8 py-24 text-center">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-2">Producer not found</h1>
        <p className="text-[14px] text-stone mb-6">This producer doesn't exist or hasn't joined yet.</p>
        <Link href="/producers" className="inline-block bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">
          Browse producers →
        </Link>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()
  const [
    { data: products },
    { data: reviews },
    { data: statsRows },
    { data: isRestaurantRole },
    { data: myFollow },
    { data: photos },
    { data: locations },
    { data: posts },
    { data: followerCountRaw },
  ] = await Promise.all([
    supabase.from('products').select('*').eq('farm_id', farm.id).order('created_at', { ascending: false }),
    supabase.from('reviews').select('*, buyer:profiles(restaurant_name, full_name)').eq('farm_id', farm.id).order('created_at', { ascending: false }),
    supabase.from('farm_stats').select('*').eq('farm_id', farm.id).maybeSingle(),
    user ? supabase.from('account_roles').select('role').eq('user_id', user.id).eq('role', 'restaurant').maybeSingle() : { data: null },
    user ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('farm_id', farm.id).maybeSingle() : { data: null },
    supabase.from('farm_photos').select('*').eq('farm_id', farm.id).order('sort_order', { ascending: true }),
    supabase.from('farm_locations').select('*').eq('farm_id', farm.id).order('sort_order', { ascending: true }),
    supabase.from('farm_posts').select('*').eq('farm_id', farm.id).order('created_at', { ascending: false }).limit(20),
    // get_follow_count() is a security definer function — the raw follows table is
    // RLS-locked to each follower's own rows, so a plain count() against it would
    // silently read as 0 for every visitor except the one follower being counted.
    supabase.rpc('get_follow_count', { p_farm_id: farm.id }),
  ])
  const followerCount = followerCountRaw || 0

  // Does this signed-in buyer have an order from this farm they haven't reviewed yet?
  let reviewableOrderId = null
  if (user) {
    const reviewedOrderIds = new Set((reviews || []).filter(r => r.buyer_id === user.id && r.order_id).map(r => r.order_id))
    const { data: myOrderItems } = await supabase
      .from('order_items')
      .select('order_id, order:orders(buyer_id, created_at)')
      .eq('farm_id', farm.id)
    const mine = (myOrderItems || [])
      .filter(oi => oi.order?.buyer_id === user.id && !reviewedOrderIds.has(oi.order_id))
      .sort((a, b) => new Date(b.order.created_at) - new Date(a.order.created_at))
    reviewableOrderId = mine[0]?.order_id || null
  }

  // best-effort view counter, not critical if it fails
  supabase.from('farms').update({ profile_view_count: (farm.profile_view_count || 0) + 1 }).eq('id', farm.id).then(() => {})

  const stats = { ...(statsRows || { avg_rating: null, restaurant_count: 0, review_count: 0 }), follower_count: followerCount || 0 }
  const canReview = Boolean(isRestaurantRole) || Boolean(reviewableOrderId)
  const liveMarketplaceEnabled = await getLiveMarketplaceEnabled()
  const localNetwork = await getPublicNetwork(supabase, { type: 'farm', id: farm.id })
  const roles = await getRolesFor(supabase, 'farm', farm.id)
  const [{ data: workOptionRows }, { data: sourcingRequests }] = await Promise.all([
    supabase.from('business_work_options').select('*').eq('business_type', 'farm').eq('business_id', farm.id),
    supabase.from('sourcing_requests').select('*').eq('owner_type', 'farm').eq('owner_id', farm.id).eq('status', 'open').order('created_at', { ascending: false }),
  ])
  const workOptionCtx = { hasOpenSourcingRequests: Boolean(sourcingRequests?.length), hasProducts: Boolean(products?.length) }
  const wholesaleProducts = (products || []).filter(p => p.wholesale_price != null)
  const workOptions = resolveWorkOptions(
    allowedWorkOptionKeys(farm, 'farm', workOptionCtx),
    defaultWorkOptionKeys(farm, 'farm', workOptionCtx),
    workOptionRows || [],
  )

  // Businesses the signed-in viewer could send this inquiry "as" — e.g. a restaurant
  // owner sending a wholesale inquiry as their restaurant rather than as themselves.
  let viewerBusinesses = []
  if (user) {
    const [{ data: viewerFarm }, { data: viewerRestaurant }] = await Promise.all([
      supabase.from('farms').select('id, name').eq('owner_id', user.id).neq('id', farm.id).maybeSingle(),
      supabase.from('restaurants').select('id, name').eq('owner_id', user.id).maybeSingle(),
    ])
    if (viewerFarm) viewerBusinesses.push({ type: 'farm', id: viewerFarm.id, name: viewerFarm.name })
    if (viewerRestaurant) viewerBusinesses.push({ type: 'restaurant', id: viewerRestaurant.id, name: viewerRestaurant.name })
  }

  return (
    <RealProducerProfile
      farm={{ ...farm, photos: photos || [], locations: locations || [], posts: posts || [] }}
      products={products || []}
      reviews={reviews || []}
      stats={stats}
      canReview={canReview}
      reviewOrderId={reviewableOrderId}
      liveMarketplaceEnabled={liveMarketplaceEnabled}
      isFollowing={Boolean(myFollow)}
      isRestaurantViewer={Boolean(isRestaurantRole)}
      localNetwork={localNetwork}
      roles={roles}
      workOptions={workOptions}
      wholesaleProducts={wholesaleProducts}
      sourcingRequests={sourcingRequests || []}
      user={user ? { id: user.id } : null}
      viewerBusinesses={viewerBusinesses}
    />
  )
}
