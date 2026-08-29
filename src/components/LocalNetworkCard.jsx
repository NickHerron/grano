import Link from 'next/link'
import { getInitials } from '@/lib/initials'
import { businessTypeLabel, businessProfileHref, RELATIONSHIP_TYPE_LABELS, ORG_TYPE_LABELS } from '@/lib/businessNetwork'

// The one card used everywhere a network relationship is shown — the public "Our
// Local Network" section and the dashboard's "Our Business Network" manager both
// render this, just with different `actions` passed in.
export default function LocalNetworkCard({ entry, showRelationshipLabel = true, actions = null }) {
  const b = entry.otherBusiness
  const typeLabel = b.type === 'farm' ? b.producer_type : b.type === 'restaurant' ? b.restaurant_type : ORG_TYPE_LABELS[b.org_type]
  const locationLine = [typeLabel, b.location].filter(Boolean).join(' · ')
  const href = businessProfileHref(b.type, b.slug)

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl p-4 flex flex-col gap-3">
      <Link href={href} className="flex items-center gap-3 group">
        <div className="w-12 h-12 rounded-lg bg-linen flex items-center justify-center overflow-hidden flex-shrink-0">
          {b.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logo_url} alt={b.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-serif text-base font-semibold text-soil/30">{getInitials(b.name)}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold text-soil truncate group-hover:text-rust transition-colors">{b.name}</span>
            {b.verification_status === 'verified' && (
              <span title="Grano Verified" className="w-3.5 h-3.5 rounded-full bg-sage text-white flex items-center justify-center text-[8px] flex-shrink-0">✓</span>
            )}
          </div>
          <div className="text-[11px] text-stone truncate">{locationLine || businessTypeLabel(b.type)}</div>
        </div>
      </Link>

      {showRelationshipLabel && (
        <div className="text-[11px] font-semibold text-rust uppercase tracking-wide">{RELATIONSHIP_TYPE_LABELS[entry.perspective]}</div>
      )}

      {entry.description && <p className="text-[12px] text-stone leading-relaxed">{entry.description}</p>}

      {entry.products.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-[#F0EDE7]">
          {entry.products.map(p => {
            const available = p.for_sale && p.is_available !== false
            return (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-soil truncate">{p.name}</span>
                {available ? (
                  <Link href={`/products/${p.slug}`} className="flex-shrink-0 text-[11px] font-semibold text-rust hover:underline whitespace-nowrap">
                    View Product →
                  </Link>
                ) : (
                  <span className="flex-shrink-0 text-[10px] font-semibold text-stone uppercase tracking-wide whitespace-nowrap">Currently unavailable</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Link href={href} className="text-[12px] font-semibold text-soil hover:text-rust transition-colors">
        View Business →
      </Link>

      {actions}
    </div>
  )
}
