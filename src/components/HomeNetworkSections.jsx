import Link from 'next/link'
import { FREQUENCY_OPTIONS, seasonRangeLabel } from '@/lib/sourcingOptions'

export function SourceLocalSection({ sourcingRequests }) {
  return (
    <section className="bg-white border-y border-[#ECEAE4]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-14 sm:py-16">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          <div className="lg:max-w-[380px] flex-shrink-0">
            <div className="font-mono text-[10px] tracking-[.2em] uppercase text-rust mb-3">For Restaurants</div>
            <h2 className="font-serif text-[28px] sm:text-[34px] font-semibold tracking-tight text-soil mb-4">Source Local</h2>
            <p className="text-[15px] text-stone leading-relaxed mb-6">
              Find Chicago-area farms, bakeries, and food producers. Tell Grano what you're looking for and discover local suppliers.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/producers" className="bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#A8521F] transition-colors">
                Find Local Vendors →
              </Link>
              <Link href="/dashboard/wholesale?section=sourcing" className="border-[1.5px] border-[#ECEAE4] text-soil text-[14px] font-semibold px-5 py-2.5 rounded-xl hover:border-rust hover:text-rust transition-colors">
                Post a Sourcing Request
              </Link>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {sourcingRequests?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sourcingRequests.map(r => (
                  <div key={r.id} className="bg-linen rounded-xl p-5">
                    <div className="font-serif text-[17px] font-semibold text-soil mb-1.5">{r.product_name}</div>
                    <div className="text-[12px] text-stone mb-3">
                      {[r.quantity, FREQUENCY_OPTIONS.find(([k]) => k === r.frequency)?.[1], seasonRangeLabel(r.season_start_month, r.season_end_month), r.preferred_location].filter(Boolean).join(' · ')}
                    </div>
                    <Link href="/sourcing-requests" className="text-[12px] font-semibold text-rust hover:underline">I'm Interested →</Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-linen rounded-xl p-8 text-center h-full flex flex-col items-center justify-center">
                <p className="text-[14px] text-stone mb-4">No open sourcing requests yet — be the first restaurant to post one.</p>
                <Link href="/dashboard/wholesale?section=sourcing" className="text-[13px] font-semibold text-rust hover:underline">Post a Sourcing Request →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export function GetDiscoveredSection() {
  return (
    <section className="bg-linen">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-14 sm:py-16">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-16">
          <div className="flex-1">
            <div className="font-mono text-[10px] tracking-[.2em] uppercase text-rust mb-3">For Producers</div>
            <h2 className="font-serif text-[28px] sm:text-[34px] font-semibold tracking-tight text-soil mb-4">Get Discovered</h2>
            <p className="text-[15px] text-stone leading-relaxed max-w-[480px]">
              Build your business profile, showcase what you make, find wholesale buyers, and sell when you're ready.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <Link href="/signup?as=producer" className="bg-rust text-white text-[14px] font-semibold px-5 py-3 rounded-xl hover:bg-[#A8521F] transition-colors whitespace-nowrap">
              Create Producer Profile →
            </Link>
            <Link href="/producers" className="bg-white border-[1.5px] border-[#ECEAE4] text-soil text-[14px] font-semibold px-5 py-3 rounded-xl hover:border-rust hover:text-rust transition-colors whitespace-nowrap">
              Explore Producers
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
