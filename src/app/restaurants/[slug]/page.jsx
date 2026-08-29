import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RestaurantProfile from '@/components/RestaurantProfile'
import { getPublicNetwork } from '@/lib/networkQueries'
import { getRolesFor } from '@/lib/businessRoleQueries'
import { allowedWorkOptionKeys, defaultWorkOptionKeys, resolveWorkOptions } from '@/lib/workOptions'

async function getRestaurant(slug) {
  const supabase = createClient()
  const { data } = await supabase.from('restaurants').select('*').eq('slug', slug).maybeSingle()
  return data
}

export async function generateMetadata({ params }) {
  const restaurant = await getRestaurant(params.slug)
  if (!restaurant) return { title: 'Restaurant not found | Grano' }

  const place = restaurant.neighborhood || restaurant.location
  const title = [restaurant.name, [place, restaurant.restaurant_type].filter(Boolean).join(' '), 'Grano'].filter(Boolean).join(' — ')
  const description = restaurant.about || `${restaurant.name} on Grano — Chicago's local food network.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: restaurant.cover_photo_url ? [restaurant.cover_photo_url] : (restaurant.logo_url ? [restaurant.logo_url] : []),
    },
  }
}

export default async function RestaurantPage({ params }) {
  const supabase = createClient()
  const restaurant = await getRestaurant(params.slug)

  if (!restaurant) {
    return (
      <div className="max-w-[600px] mx-auto px-8 py-24 text-center">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-2">Restaurant not found</h1>
        <p className="text-[14px] text-stone mb-6">This restaurant doesn't exist or hasn't joined yet.</p>
        <Link href="/restaurants" className="inline-block bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">
          Browse restaurants →
        </Link>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: sourcingRequests }, { data: myFollow }, { data: followerCount }, localNetwork, roles] = await Promise.all([
    supabase.from('sourcing_requests').select('*').eq('owner_type', 'restaurant').eq('owner_id', restaurant.id).eq('status', 'open').order('created_at', { ascending: false }),
    user ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('restaurant_id', restaurant.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.rpc('get_follow_count', { p_restaurant_id: restaurant.id }),
    getPublicNetwork(supabase, { type: 'restaurant', id: restaurant.id }),
    getRolesFor(supabase, 'restaurant', restaurant.id),
  ])

  // best-effort view counter, not critical if it fails
  supabase.from('restaurants').update({ profile_view_count: (restaurant.profile_view_count || 0) + 1 }).eq('id', restaurant.id).then(() => {})

  const { data: workOptionRows } = await supabase.from('business_work_options').select('*').eq('business_type', 'restaurant').eq('business_id', restaurant.id)
  const workOptionCtx = { hasOpenSourcingRequests: Boolean(sourcingRequests?.length) }
  const workOptions = resolveWorkOptions(
    allowedWorkOptionKeys(restaurant, 'restaurant', workOptionCtx),
    defaultWorkOptionKeys(restaurant, 'restaurant', workOptionCtx),
    workOptionRows || [],
  )

  // Businesses the signed-in viewer could send this inquiry "as" — a producer
  // responding to this restaurant's sourcing needs as their farm, for instance.
  let viewerBusinesses = []
  let viewerProducts = []
  if (user) {
    const [{ data: viewerFarm }, { data: viewerRestaurant }] = await Promise.all([
      supabase.from('farms').select('id, name').eq('owner_id', user.id).maybeSingle(),
      supabase.from('restaurants').select('id, name').eq('owner_id', user.id).neq('id', restaurant.id).maybeSingle(),
    ])
    if (viewerFarm) viewerBusinesses.push({ type: 'farm', id: viewerFarm.id, name: viewerFarm.name })
    if (viewerRestaurant) viewerBusinesses.push({ type: 'restaurant', id: viewerRestaurant.id, name: viewerRestaurant.name })

    // For "Respond to Sourcing Need" — a producer picks from their own catalog, never
    // from a copy of the restaurant's request.
    if (viewerFarm) {
      const { data: products } = await supabase.from('products').select('id, name').eq('farm_id', viewerFarm.id).order('name')
      viewerProducts = products || []
    }
  }

  return (
    <RestaurantProfile
      restaurant={{ ...restaurant, sourcingRequests: sourcingRequests || [] }}
      isFollowing={Boolean(myFollow)}
      followerCount={followerCount || 0}
      localNetwork={localNetwork}
      roles={roles}
      workOptions={workOptions}
      user={user ? { id: user.id } : null}
      viewerBusinesses={viewerBusinesses}
      viewerProducts={viewerProducts}
    />
  )
}
