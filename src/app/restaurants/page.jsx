import { createClient } from '@/lib/supabase/server'
import RestaurantsDirectory from '@/components/RestaurantsDirectory'

export const metadata = {
  title: "Chicago-Area Restaurants & Buyers | Grano",
  description: "Restaurants and businesses sourcing local food through Chicago's local food network.",
}

export default async function RestaurantsPage() {
  const supabase = createClient()
  const { data: restaurants } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false })

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 pb-20">
      <div className="mb-8">
        <h1 className="font-serif text-[32px] sm:text-[40px] font-semibold tracking-tight text-soil mb-2">
          Chicago-Area <em className="italic text-rust">Restaurants</em>
        </h1>
        <p className="text-[15px] text-stone">
          {restaurants?.length ? `${restaurants.length} restaurant${restaurants.length === 1 ? '' : 's'} and businesses sourcing local` : 'No restaurants have joined yet.'}
        </p>
      </div>
      {restaurants?.length ? (
        <RestaurantsDirectory restaurants={restaurants} />
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-20 text-center">
          <p className="text-[14px] text-stone">No restaurants have joined yet — check back soon.</p>
        </div>
      )}
    </div>
  )
}
