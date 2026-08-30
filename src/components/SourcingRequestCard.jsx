import Link from 'next/link'
import { FREQUENCY_OPTIONS, seasonRangeLabel } from '@/lib/sourcingOptions'
import { businessProfileHref } from '@/lib/businessNetwork'

export function sourcingMeta(r) {
  return [
    r.quantity,
    FREQUENCY_OPTIONS.find(([k]) => k === r.frequency)?.[1],
    seasonRangeLabel(r.season_start_month, r.season_end_month),
    r.preferred_location,
    r.budget_target,
  ].filter(Boolean).join(' · ')
}

export function comparePriceHref(r) {
  if (!r.owner?.slug) return '/sourcing-requests'
  const base = businessProfileHref(r.owner.type, r.owner.slug)
  const subject = encodeURIComponent(r.product_name || '')
  return `${base}?inquire=sourcing&request=${r.id}&subject=${subject}#work-with-us`
}

export default function SourcingRequestCard({ r, showOwner = true }) {
  const meta = sourcingMeta(r)
  return (
    <article className="bg-card border border-hair rounded-panel p-5 flex flex-col gap-2">
      <div className="font-serif text-[18px] font-medium text-ink">{r.product_name}</div>
      {showOwner && r.owner && (
        <div className="text-[13px] text-stone">
          Wanted by{' '}
          <Link href={businessProfileHref(r.owner.type, r.owner.slug)} className="font-semibold text-brick hover:underline">
            {r.owner.name}
          </Link>
        </div>
      )}
      {meta && <div className="text-[13px] text-stone">{meta}</div>}
      {r.notes ? <p className="text-[13px] text-stone leading-relaxed">{r.notes}</p> : null}
      <div className="flex flex-wrap gap-1.5">
        {r.wholesale_only && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-forest bg-sage-wash px-2 py-0.5 rounded-btn">Wholesale</span>
        )}
        {r.organic_preference && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-forest bg-sage-wash px-2 py-0.5 rounded-btn">Organic preferred</span>
        )}
      </div>
      <Link href={comparePriceHref(r)} className="text-[15px] font-semibold text-brick hover:underline mt-1 self-start">
        Compare price →
      </Link>
    </article>
  )
}
