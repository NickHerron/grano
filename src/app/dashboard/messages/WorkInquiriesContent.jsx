import Link from 'next/link'
import { formatDate } from '@/lib/formatDate'
import { WORK_OPTION_DEFS } from '@/lib/workOptions'

const STATUS_LABELS = { new: 'New', responded: 'Responded', in_discussion: 'In Discussion', accepted: 'Accepted', declined: 'Declined', closed: 'Closed' }
const STATUS_STYLES = {
  new: 'bg-[#FDF0E8] text-rust',
  responded: 'bg-linen text-stone',
  in_discussion: 'bg-linen text-stone',
  accepted: 'bg-[#EBF3EC] text-sage',
  declined: 'bg-[#F0EDE7] text-stone',
  closed: 'bg-[#F0EDE7] text-stone',
}

// Read-only list for now — accept/decline/reply live on the inquiry detail page
// (a later phase). This is the "can I see what's come in / what I've sent" checkpoint.
export default function WorkInquiriesContent({ inquiries, perspective }) {
  if (!inquiries.length) {
    return (
      <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
        <p className="text-[14px] text-stone">{perspective === 'received' ? 'No inquiries yet.' : "You haven't sent any inquiries yet."}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {inquiries.map(i => {
        const other = perspective === 'received' ? i.fromBusiness : i.toBusiness
        const otherLabel = other?.name || (perspective === 'received' ? 'A Grano member' : null)
        const href = other ? (other.type === 'farm' ? `/producers/${other.slug}` : `/restaurants/${other.slug}`) : null

        return (
          <div key={i.id} className="bg-white border border-[#ECEAE4] rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div>
                {href ? (
                  <Link href={href} className="font-serif text-[16px] font-semibold text-soil hover:text-rust transition-colors">{otherLabel}</Link>
                ) : (
                  <span className="font-serif text-[16px] font-semibold text-soil">{otherLabel}</span>
                )}
                <div className="text-[11px] font-semibold uppercase tracking-wide text-rust mt-0.5">
                  {WORK_OPTION_DEFS[i.inquiry_type]?.label || i.inquiry_type}
                </div>
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded flex-shrink-0 ${STATUS_STYLES[i.status]}`}>
                {STATUS_LABELS[i.status]}
              </span>
            </div>
            {(i.subject || i.quantity) && (
              <div className="text-[12px] text-stone mb-1.5">{[i.subject, i.quantity].filter(Boolean).join(' · ')}</div>
            )}
            {i.message && <p className="text-[13px] text-stone leading-relaxed mb-2 line-clamp-2">"{i.message}"</p>}
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] text-stone">{perspective === 'received' ? 'Received' : 'Sent'} {formatDate(i.created_at)}</div>
              <Link href={`/dashboard/inquiries/${i.id}`} className="text-[12px] font-semibold text-rust hover:underline">View →</Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
