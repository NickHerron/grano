import Link from 'next/link'
import { businessProfileHref } from '@/lib/businessNetwork'

// request.owner is hydrated by hydrateSourcingRequestOwners() (sourcingOptions.js) —
// {id, name, slug, type}, type is 'farm' or 'restaurant'. Any business type can post a
// want-ad now, not just restaurants, so this no longer assumes the poster is one.
export default function OpportunitiesContent({ opportunities }) {
  return (
    <div>
      <p className="text-[13px] text-stone mb-5">
        {opportunities.length
          ? `${opportunities.length} business${opportunities.length === 1 ? ' is' : 'es are'} looking for products you sell.`
          : "Other Grano businesses are actively looking to buy local — nothing matches what you sell yet."}
      </p>
      {opportunities.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {opportunities.map(({ request, matchedProducts }) => (
            <div key={request.id} className="flex items-center justify-between gap-3 bg-white border border-[#ECEAE4] rounded-lg px-4 py-3">
              <div className="min-w-0">
                <span className="text-[13px] font-semibold text-soil">{request.owner?.name || 'A business'}</span>
                <span className="text-[13px] text-stone"> is looking for {request.product_name.toLowerCase()}</span>
                <div className="text-[11px] text-stone mt-0.5">Matches your {matchedProducts.map(p => p.name).join(', ')}</div>
              </div>
              {request.owner && (
                <Link
                  href={`${businessProfileHref(request.owner.type, request.owner.slug)}?inquire=sourcing&request=${request.id}&subject=${encodeURIComponent(request.product_name)}${matchedProducts[0] ? `&product=${matchedProducts[0].id}` : ''}#work-with-us`}
                  className="flex-shrink-0 text-[12px] font-semibold text-rust hover:underline whitespace-nowrap">
                  Respond →
                </Link>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Link href="/sourcing-requests" className="inline-block text-[13px] font-semibold text-rust hover:underline">See what buyers want →</Link>
      )}
    </div>
  )
}
