import { createClient } from '@/lib/supabase/server'
import ProducersDirectory from '@/components/ProducersDirectory'

export const metadata = {
  title: "Chicago-Area Producers | Grano",
  description: "Discover local farms, bakeries, and food producers around Chicago — direct, local, and easy to follow.",
}

export default async function ProducersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: realFarms }, { data: products }, { data: myFollows }] = await Promise.all([
    supabase.from('farms').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('farm_id, name, for_sale, is_available'),
    user ? supabase.from('follows').select('farm_id').eq('follower_id', user.id) : { data: [] },
  ])

  const followedFarmIds = new Set((myFollows || []).map(f => f.farm_id))
  const productsByFarm = (products || []).reduce((acc, p) => {
    (acc[p.farm_id] = acc[p.farm_id] || []).push(p)
    return acc
  }, {})

  const farms = (realFarms || []).map(f => {
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
      secondaryTypes: f.secondary_types || [],
      verificationStatus: f.verification_status,
      sellOnGrano: f.sell_on_grano,
      practices: f.practices,
      sellsWholesale: f.sells_wholesale,
      buysWholesale: f.buys_wholesale,
      isFollowing: followedFarmIds.has(f.id),
      productCount: farmProducts.length,
      // "Currently available" only ever means for_sale + actually available — not just
      // "listed on the profile" (a product can exist without being for sale yet).
      availableProducts: farmProducts.filter(p => p.for_sale && p.is_available !== false).map(p => p.name),
    }
  })

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 pb-20">
      <div className="mb-8">
        <h1 className="font-serif text-[32px] sm:text-[40px] font-semibold tracking-tight text-soil mb-2">
          Chicago-Area <em className="italic text-rust">Producers</em>
        </h1>
        <p className="text-[15px] text-stone">
          {farms.length ? `${farms.length} local farm${farms.length === 1 ? '' : 's'} and food producers — all direct, all local` : 'No producers have joined yet.'}
        </p>
      </div>
      <ProducersDirectory farms={farms} />
    </div>
  )
}
