import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildAvailableStoryCards } from '@/lib/storyCards'
import ShareHub from '@/components/socialCards/ShareHub'

// Mirrors dashboard/wholesale/page.jsx's own shape: a business can own a farm, a
// restaurant, or both — buildAvailableStoryCards() runs once per owned business, and
// ShareHub (client) handles the picker/customize/preview UI for whichever is selected.
export default async function SharePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: farm }, { data: restaurant }] = await Promise.all([
    supabase.from('farms').select('*').eq('owner_id', user.id).maybeSingle(),
    supabase.from('restaurants').select('*').eq('owner_id', user.id).maybeSingle(),
  ])
  if (!farm && !restaurant) redirect('/dashboard')

  const businesses = []
  for (const [business, businessType] of [[farm, 'farm'], [restaurant, 'restaurant']]) {
    if (!business) continue
    const [{ data: workOptionRows }, { data: locations }, { count: productCount }, { count: sourcingCount }, { data: sourcedProducts }] = await Promise.all([
      supabase.from('business_work_options').select('*').eq('business_type', businessType).eq('business_id', business.id),
      supabase.from('farm_locations').select('*').eq('farm_id', business.id),
      businessType === 'farm'
        ? supabase.from('products').select('id', { count: 'exact', head: true }).eq('farm_id', business.id)
        : Promise.resolve({ count: 0 }),
      supabase.from('sourcing_requests').select('id', { count: 'exact', head: true })
        .eq('owner_type', businessType).eq('owner_id', business.id).eq('status', 'open'),
      // Which of this farm's products have Sourced From tags — feeds the Product
      // Story card's own product picker (a business-wide "unlocked" flag isn't
      // enough there since it's inherently per-product).
      businessType === 'farm'
        ? supabase.from('products').select('id, name, product_sources!product_sources_product_id_fkey(id)').eq('farm_id', business.id)
        : Promise.resolve({ data: [] }),
    ])
    const ctx = { hasProducts: (productCount || 0) > 0, hasOpenSourcingRequests: (sourcingCount || 0) > 0 }
    const storyCards = await buildAvailableStoryCards(supabase, business, businessType, { workOptionRows, locations, ctx })
    const productsWithSources = (sourcedProducts || []).filter(p => p.product_sources?.length > 0).map(p => ({ id: p.id, name: p.name }))

    businesses.push({ business, businessType, storyCards, productsWithSources })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">Share Your Grano Story</h1>
        <p className="text-[14px] text-stone">Turn what's already on your Grano profile into something shareable — no writing, no design work.</p>
      </div>
      <ShareHub businesses={businesses} />
    </div>
  )
}
