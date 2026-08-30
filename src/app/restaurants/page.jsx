import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RestaurantsDirectory from '@/components/RestaurantsDirectory'

export const metadata = {
  title: "Chicago-Area Restaurants & Buyers | Grano",
  description: "Restaurants and businesses sourcing local food through Chicago's local food network.",
  robots: { index: false, follow: false },
}

export default async function RestaurantsPage() {
  const supabase = createClient()
  const { data: restaurants } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false })

  if (!restaurants?.length) redirect('/producers')

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 pb-20">
      <div className="mb-8">
        <h1 className="font-serif text-[32px] sm:text-[40px] font-semibold tracking-tight text-soil mb-2">
          Chicago-Area <em className="italic text-rust">Restaurants</em>
        </h1>
        <p className="text-[15px] text-stone">
          {restaurants.length} restaurant{restaurants.length === 1 ? '' : 's'} and businesses sourcing local
        </p>
      </div>
      <RestaurantsDirectory restaurants={restaurants} />
    </div>
  )
}
