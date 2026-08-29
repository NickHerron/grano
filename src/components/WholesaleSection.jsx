import Link from 'next/link'
import { seasonRangeLabel, FREQUENCY_OPTIONS } from '@/lib/sourcingOptions'

// Self-contained (doesn't import SectionHeading from either profile file — both
// define it privately with identical markup, reproduced here) so this can mount from
// either RealProducerProfile.jsx or RestaurantProfile.jsx without cross-coupling them.
function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2 className="font-serif text-[13px] font-semibold tracking-[.15em] uppercase text-stone whitespace-nowrap">{children}</h2>
      <div className="flex-1 h-px bg-[#ECEAE4]" />
    </div>
  )
}

// "WHOLESALE" section for public profiles — shown for any business (farm or
// restaurant) that's turned on sells_wholesale and/or buys_wholesale, independent of
// which table it lives in (see schema_wholesale_capabilities.sql). wholesaleProducts
// only ever has rows for a farm today (products stay farm-only in this pass — the
// stated scope boundary in the wholesale plan); a seller with no priced catalog gets
// a plain "send an inquiry" prompt instead of an empty section, which is also what
// every non-farm seller sees until a future phase gives them real listings.
//
// RestaurantProfile.jsx passes buysWholesale={false} here deliberately — its own
// "What We're Looking For" section already covers that half with its own bespoke
// markup, so this only ever renders the "We Sell" side there.
export default function WholesaleSection({ sellsWholesale, buysWholesale, wholesaleProducts = [], sourcingRequests = [], workWithUsHref = '#work-with-us' }) {
  if (!sellsWholesale && !buysWholesale) return null

  return (
    <section id="wholesale" className="scroll-mt-20">
      <SectionHeading>Wholesale</SectionHeading>
      <div className="flex flex-col gap-6">
        {sellsWholesale && (
          <div>
            <div className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-2">We Sell</div>
            {wholesaleProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {wholesaleProducts.map(p => (
                  <div key={p.id} className="bg-white border border-[#ECEAE4] rounded-xl p-4">
                    <div className="font-serif text-[16px] font-semibold text-soil mb-1">{p.name}</div>
                    <div className="text-[13px] text-soil">${Number(p.wholesale_price).toFixed(2)} / {p.wholesale_unit || 'unit'}</div>
                    {p.wholesale_min_order && <div className="text-[11px] text-stone mt-0.5">Minimum: {p.wholesale_min_order}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-stone">
                Available for wholesale — <Link href={workWithUsHref} className="text-rust font-semibold hover:underline">send an inquiry</Link> to ask about pricing and availability.
              </p>
            )}
          </div>
        )}

        {buysWholesale && (
          <div>
            <div className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-2">We're Sourcing</div>
            {sourcingRequests.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sourcingRequests.map(r => (
                  <div key={r.id} className="bg-white border border-[#ECEAE4] rounded-xl p-4">
                    <div className="font-serif text-[16px] font-semibold text-soil mb-1.5">{r.product_name}</div>
                    <div className="text-[12px] text-stone mb-1.5">
                      {[r.quantity, FREQUENCY_OPTIONS.find(([k]) => k === r.frequency)?.[1], seasonRangeLabel(r.season_start_month, r.season_end_month)].filter(Boolean).join(' · ')}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {r.preferred_location && <span className="text-[10px] font-semibold bg-linen text-stone px-2 py-0.5 rounded">{r.preferred_location}</span>}
                      {r.budget_target && <span className="text-[10px] font-semibold bg-linen text-stone px-2 py-0.5 rounded">{r.budget_target}</span>}
                      {r.organic_preference && <span className="text-[10px] font-semibold bg-[#EBF3EC] text-sage px-2 py-0.5 rounded">Organic preferred</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-stone">
                Looking for local suppliers and wholesale partners — <Link href={workWithUsHref} className="text-rust font-semibold hover:underline">reach out</Link>.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
