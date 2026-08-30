import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInitials } from '@/lib/initials'
import { FREQUENCY_OPTIONS, seasonRangeLabel, hydrateSourcingRequestOwners } from '@/lib/sourcingOptions'
import { businessProfileHref, businessTypeLabel } from '@/lib/businessNetwork'

export const metadata = {
  title: "What Local Businesses Are Looking For | Grano",
  description: "Chicago-area farms, restaurants, and other local businesses actively sourcing local product — see what they need and reach out.",
}

// Any business type can post a want-ad now (schema_wholesale_polymorphic_sourcing.sql
// — sourcing_requests.owner_type/owner_id), not just restaurants — a farm buying
// packaging shows up here exactly like a restaurant buying produce would. The poster
// is hydrated in JS (hydrateSourcingRequestOwners) rather than a single-table
// PostgREST join, same reason work_inquiries/business_relationships already do this.
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
    <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-8 pb-20">
      <div className="mb-8">
        <h1 className="font-serif text-[32px] sm:text-[40px] font-semibold tracking-tight text-soil mb-2">
          What Local Businesses Are <em className="italic text-rust">Looking For</em>
        </h1>
        <p className="text-[15px] text-stone mb-3">
          {requests?.length ? `${requests.length} open request${requests.length === 1 ? '' : 's'} from Chicago-area farms, restaurants, and other local businesses.` : 'No open requests right now — check back soon.'}
        </p>
        <Link href="/wholesale" className="text-[13px] font-semibold text-rust hover:underline">Browse the Wholesale Marketplace →</Link>
      </div>

      {requests?.length ? (
        <div className="flex flex-col gap-3">
          {requests.map(r => (
            <div key={r.id} className="bg-white border border-[#ECEAE4] rounded-xl p-5 flex items-start gap-4">
              <Link href={r.owner ? businessProfileHref(r.owner.type, r.owner.slug) : '#'} className="w-12 h-12 rounded-lg bg-linen flex items-center justify-center overflow-hidden flex-shrink-0">
                <span className="font-serif text-base font-semibold text-soil/30">{getInitials(r.owner?.name || '?')}</span>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-[18px] font-semibold text-soil mb-0.5">{r.product_name}</div>
                <div className="text-[12px] text-stone mb-2">
                  {r.owner ? (
                    <>
                      Wanted by <Link href={businessProfileHref(r.owner.type, r.owner.slug)} className="font-semibold text-rust hover:underline">{r.owner.name}</Link>
                      <span className="text-[10px] font-semibold bg-linen text-stone px-1.5 py-0.5 rounded ml-1.5 align-middle">{businessTypeLabel(r.owner.type)}</span>
                    </>
                  ) : 'Wanted by a Grano business'}
                </div>
                <div className="text-[13px] text-stone mb-2">
                  {[r.quantity, FREQUENCY_OPTIONS.find(([k]) => k === r.frequency)?.[1], seasonRangeLabel(r.season_start_month, r.season_end_month), r.preferred_location, r.budget_target].filter(Boolean).join(' · ')}
                </div>
                {r.notes && <p className="text-[13px] text-stone leading-relaxed mb-2">{r.notes}</p>}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {r.wholesale_only && <span className="text-[10px] font-semibold bg-[#FDF0E8] text-rust px-2 py-0.5 rounded">Wholesale</span>}
                  {r.organic_preference && <span className="text-[10px] font-semibold bg-[#EBF3EC] text-sage px-2 py-0.5 rounded">Organic preferred</span>}
                </div>
                {r.owner && (
                  <Link href={`${businessProfileHref(r.owner.type, r.owner.slug)}?inquire=sourcing&request=${r.id}&subject=${encodeURIComponent(r.product_name)}#work-with-us`}
                    className="text-[13px] font-semibold text-rust hover:underline">
                    Respond →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-20 text-center">
          <p className="text-[14px] text-stone">No open requests right now — check back soon.</p>
        </div>
      )}
    </div>
  )
}
