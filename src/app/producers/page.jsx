import { createClient } from '@/lib/supabase/server'
import ProducersDirectory from '@/components/ProducersDirectory'
import { overlayProducerCopy } from '@/lib/producerCopy'

export const metadata = {
  title: "Chicago-Area Producers | Grano",
  description: "Discover local farms, bakeries, and food producers around Chicago — people you can find this week.",
}

export default async function ProducersPage() {
  const supabase = createClient()
  const [{ data: realFarms }, { data: farmLocationRows }] = await Promise.all([
    supabase.from('farms').select('*').order('created_at', { ascending: false }),
    supabase.from('farm_locations').select('farm_id, location_type'),
  ])

  const pickupFarmIds = new Set(
    (farmLocationRows || [])
      .filter(l => l.location_type === 'pickup' || l.location_type === 'farm_stand')
      .map(l => l.farm_id)
  )

  const farms = (realFarms || []).map(f => {
    const overlaid = overlayProducerCopy(f)
    return {
      id: overlaid.id,
      slug: overlaid.slug,
      name: overlaid.name,
      location: overlaid.location,
      city: overlaid.city,
      state: overlaid.state,
      bio: overlaid.bio,
      tags: overlaid.tags,
      avatarBg: overlaid.avatar_bg,
      logoUrl: overlaid.logo_url,
      coverPhotoUrl: overlaid.cover_photo_url,
      producerType: overlaid.producer_type,
      secondaryTypes: overlaid.secondary_types || [],
      verificationStatus: overlaid.verification_status,
      sellOnGrano: overlaid.sell_on_grano,
      practices: overlaid.practices,
      sellsWholesale: overlaid.sells_wholesale,
      buysWholesale: overlaid.buys_wholesale,
      hasPickup: Boolean(overlaid.practices?.pickup_available || pickupFarmIds.has(overlaid.id)),
    }
  })

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 pb-20">
      <div className="mb-8">
        <h1 className="font-serif text-[32px] sm:text-[40px] font-semibold tracking-tight text-soil mb-2">
          Chicago-Area <em className="italic text-rust">Producers</em>
        </h1>
        <p className="text-[15px] text-stone">
          {farms.length ? `${farms.length} local producer${farms.length === 1 ? '' : 's'} you can find this week` : 'No producers have joined yet.'}
        </p>
      </div>
      <ProducersDirectory farms={farms} />
    </div>
  )
}
