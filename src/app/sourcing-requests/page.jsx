import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hydrateSourcingRequestOwners } from '@/lib/sourcingOptions'
import SourcingRequestCard from '@/components/SourcingRequestCard'

export const metadata = {
  title: 'What local businesses are looking for | Grano',
  description: 'Open sourcing requests from Chicago kitchens. If you can supply it, reach out and compare price.',
}

export default async function SourcingRequestsPage() {
  const supabase = createClient()
  const { data: rawRequests } = await supabase
    .from('sourcing_requests')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
  const requests = await hydrateSourcingRequestOwners(supabase, rawRequests || [])

  if (!requests.length) redirect('/')

  return (
    <div className="bg-paper min-h-screen">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-10 sm:py-14 pb-20">
        <h1 className="font-serif text-[32px] sm:text-[40px] font-medium tracking-tight text-ink mb-3">
          What local businesses are looking for
        </h1>
        <p className="text-[15px] text-stone mb-8 max-w-[640px]">
          Open requests from Chicago kitchens. If you can supply it, reach out and compare price. Not a store, and not an order.
        </p>
        <div className="flex flex-col gap-3">
          {requests.map(r => <SourcingRequestCard key={r.id} r={r} />)}
        </div>
      </div>
    </div>
  )
}
