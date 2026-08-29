import Link from 'next/link'

export default function MatchesContent({ vendors }) {
  return (
    <div>
      <p className="text-[13px] text-stone mb-5">
        {vendors.length
          ? `${vendors.length} local producer${vendors.length === 1 ? '' : 's'} match${vendors.length === 1 ? 'es' : ''} your sourcing needs.`
          : "No matches yet — post what you're looking for in Sourcing and producers who sell it will show up here."}
      </p>
      {vendors.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {vendors.map(({ farm: f, matchedProducts }) => (
            <div key={f.id} className="flex items-center justify-between gap-3 bg-white border border-[#ECEAE4] rounded-lg px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-semibold text-soil">{f.name}</span>
                  {f.verification_status === 'verified' && (
                    <span title="Verified" className="w-3.5 h-3.5 rounded-full bg-sage text-white flex items-center justify-center text-[8px] flex-shrink-0">✓</span>
                  )}
                </div>
                <div className="text-[11px] text-stone">{[f.producer_type, f.location].filter(Boolean).join(' · ')}</div>
                <div className="text-[11px] text-sage mt-0.5">Matches: {matchedProducts.join(', ')}</div>
              </div>
              <Link href={`/producers/${f.slug}`} className="flex-shrink-0 text-[12px] font-semibold text-rust hover:underline whitespace-nowrap">View Producer →</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
