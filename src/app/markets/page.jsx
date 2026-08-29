import { createClient } from '@/lib/supabase/server'
import MarketCard from '@/components/MarketCard'

export const metadata = {
  title: "Chicago-Area Farmers Markets & Organizations | Grano",
  description: "Farmers markets, pickup locations, food hubs, and community organizations that are part of Chicago's local food network.",
}

// Deliberately a plain index, not a filtered directory like /producers or
// /restaurants — organizations are the newest, smallest part of the network layer
// (see the Network Layer plan), so a simple grid is the right amount of UI for how
// few of these exist right now.
export default async function MarketsPage() {
  const supabase = createClient()
  const { data: organizations } = await supabase.from('organizations').select('*').order('created_at', { ascending: false })

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 pb-20">
      <div className="mb-8">
        <h1 className="font-serif text-[32px] sm:text-[40px] font-semibold tracking-tight text-soil mb-2">
          Farmers Markets &amp; <em className="italic text-rust">Organizations</em>
        </h1>
        <p className="text-[15px] text-stone">
          {organizations?.length ? `${organizations.length} organization${organizations.length === 1 ? '' : 's'} in the local food network` : 'No organizations have joined yet.'}
        </p>
      </div>
      {organizations?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {organizations.map(o => <MarketCard key={o.id} organization={o} />)}
        </div>
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-20 text-center">
          <p className="text-[14px] text-stone">No organizations have joined yet — check back soon.</p>
        </div>
      )}
    </div>
  )
}
