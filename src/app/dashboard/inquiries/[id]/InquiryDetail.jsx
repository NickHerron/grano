import Link from 'next/link'
import { formatDate } from '@/lib/formatDate'
import { WORK_OPTION_DEFS } from '@/lib/workOptions'
import { FREQUENCY_OPTIONS } from '@/lib/sourcingOptions'
import { businessTypeLabel } from '@/lib/businessNetwork'
import InquiryStatusActions from './InquiryStatusActions'
import InquiryThread from './InquiryThread'
import AddToNetworkPrompt from './AddToNetworkPrompt'
import AddToFindUsPrompt from './AddToFindUsPrompt'

// Which relationship type makes sense to suggest depends on both the inquiry type and
// which side is viewing — a wholesale inquiry's recipient is the one being bought
// from (they supply), while its sender is the one buying (they source from); a
// sourcing response flips that, since there the sender (a producer) is the one
// offering to supply. Anything else (event, collaboration, custom order, product
// inquiry, general) has no inherent buy/sell direction.
function defaultRelationshipTypeFor(inquiry, isRecipientSide) {
  if (inquiry.inquiry_type === 'wholesale') return isRecipientSide ? 'supplies_to' : 'source_from'
  // sourcing and supplier_pitch are both "sender offers to supply the recipient" —
  // directionally identical, just two different entry points (responding to a posted
  // want-ad vs. an unsolicited pitch).
  if (inquiry.inquiry_type === 'sourcing' || inquiry.inquiry_type === 'supplier_pitch') return isRecipientSide ? 'source_from' : 'supplies_to'
  return 'collaboration'
}

const STATUS_LABELS = { new: 'New', responded: 'Responded', in_discussion: 'In Discussion', accepted: 'Accepted', declined: 'Declined', closed: 'Closed' }
const STATUS_STYLES = {
  new: 'bg-[#FDF0E8] text-rust',
  responded: 'bg-linen text-stone',
  in_discussion: 'bg-linen text-stone',
  accepted: 'bg-[#EBF3EC] text-sage',
  declined: 'bg-[#F0EDE7] text-stone',
  closed: 'bg-[#F0EDE7] text-stone',
}

function formatTime(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const displayHour = h % 12 === 0 ? 12 : h % 12
  return `${displayHour}:${String(m).padStart(2, '0')} ${period}`
}

function Field({ label, value }) {
  if (!value) return null
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-stone">{label}</div>
      <div className="text-[14px] text-soil">{value}</div>
    </div>
  )
}

export default function InquiryDetail({ inquiry, toBusiness, fromBusiness, products, messages, currentUserId, isRecipientSide }) {
  const isSenderSide = inquiry.sender_id === currentUserId || Boolean(fromBusiness)
  const fromLabel = fromBusiness?.name || 'A Grano member'
  const fromHref = fromBusiness ? (fromBusiness.type === 'farm' ? `/producers/${fromBusiness.slug}` : `/restaurants/${fromBusiness.slug}`) : null
  const toHref = toBusiness ? (toBusiness.type === 'farm' ? `/producers/${toBusiness.slug}` : `/restaurants/${toBusiness.slug}`) : null
  const eventTimeRange = [formatTime(inquiry.event_start_time), formatTime(inquiry.event_end_time)].filter(Boolean).join(' – ')

  // Only offer "add to network" once both sides are real businesses (not a plain
  // consumer) and the viewer is one of them.
  const viewerBusiness = isRecipientSide
    ? (toBusiness && { type: toBusiness.type, id: toBusiness.id, name: toBusiness.name, slug: toBusiness.slug, userId: currentUserId })
    : (fromBusiness && { type: fromBusiness.type, id: fromBusiness.id, name: fromBusiness.name, slug: fromBusiness.slug, userId: currentUserId })
  const counterpartBusiness = isRecipientSide
    ? (fromBusiness && { ...fromBusiness, typeLabel: businessTypeLabel(fromBusiness.type) })
    : (toBusiness && { ...toBusiness, typeLabel: businessTypeLabel(toBusiness.type) })

  return (
    <div className="max-w-[720px] mx-auto">
      <Link href="/dashboard/messages?section=work-received" className="text-[12px] font-semibold text-rust hover:underline mb-4 inline-block">← Back to inquiries</Link>

      <div className="bg-white border border-[#ECEAE4] rounded-xl p-6 mb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-rust mb-1">
              {WORK_OPTION_DEFS[inquiry.inquiry_type]?.label || inquiry.inquiry_type}
            </div>
            <h1 className="font-serif text-[24px] font-semibold text-soil">{inquiry.subject || WORK_OPTION_DEFS[inquiry.inquiry_type]?.label}</h1>
          </div>
          <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded flex-shrink-0 ${STATUS_STYLES[inquiry.status]}`}>
            {STATUS_LABELS[inquiry.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-[#F0EDE7]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone">From</div>
            {fromHref ? (
              <Link href={fromHref} className="text-[14px] font-semibold text-soil hover:text-rust transition-colors">{fromLabel}</Link>
            ) : (
              <div className="text-[14px] font-semibold text-soil">{fromLabel}</div>
            )}
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone">To</div>
            {toHref ? (
              <Link href={toHref} className="text-[14px] font-semibold text-soil hover:text-rust transition-colors">{toBusiness?.name}</Link>
            ) : (
              <div className="text-[14px] text-soil">{toBusiness?.name}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Quantity" value={inquiry.quantity} />
          <Field label="Frequency" value={FREQUENCY_OPTIONS.find(([k]) => k === inquiry.frequency)?.[1]} />
          <Field label={inquiry.inquiry_type === 'event' ? 'Event Date' : 'Desired Date'} value={inquiry.desired_date ? formatDate(inquiry.desired_date) : null} />
          <Field label="Time" value={eventTimeRange || null} />
          <Field label="Location" value={inquiry.event_location} />
          <Field label="Estimated Guests" value={inquiry.guest_count} />
          <Field label="Budget" value={inquiry.budget} />
        </div>

        {products.length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone mb-1.5">Product{products.length > 1 ? 's' : ''}</div>
            <div className="flex flex-wrap gap-1.5">
              {products.map(p => (
                <Link key={p.id} href={`/products/${p.slug}`} className="text-[12px] font-semibold text-rust bg-[#FDF0E8] px-2.5 py-1 rounded-full hover:underline">
                  {p.name} →
                </Link>
              ))}
            </div>
          </div>
        )}

        {inquiry.message && (
          <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone mb-1">Message</div>
            <p className="text-[14px] text-soil leading-relaxed">"{inquiry.message}"</p>
          </div>
        )}

        <div className="text-[11px] text-stone mb-4">Sent {formatDate(inquiry.created_at)}</div>

        <InquiryStatusActions
          inquiryId={inquiry.id}
          status={inquiry.status}
          isRecipientSide={isRecipientSide}
          isSenderSide={isSenderSide}
        />
      </div>

      {inquiry.status === 'accepted' && inquiry.inquiry_type === 'event' && isRecipientSide && inquiry.to_type === 'farm' && (
        <div className="mb-5">
          <AddToFindUsPrompt inquiryId={inquiry.id} farmId={inquiry.to_id} inquiry={inquiry} />
        </div>
      )}

      {inquiry.status === 'accepted' && viewerBusiness && counterpartBusiness && (
        <div className="mb-5">
          <AddToNetworkPrompt
            inquiryId={inquiry.id}
            myBusiness={viewerBusiness}
            otherBusiness={counterpartBusiness}
            defaultRelationshipType={defaultRelationshipTypeFor(inquiry, isRecipientSide)}
          />
        </div>
      )}

      <div className="bg-white border border-[#ECEAE4] rounded-xl p-6">
        <InquiryThread
          inquiryId={inquiry.id}
          recipientOwnerId={toBusiness?.owner_id}
          senderId={inquiry.sender_id}
          messages={messages}
          currentUserId={currentUserId}
          isRecipientSide={isRecipientSide}
          status={inquiry.status}
        />
      </div>
    </div>
  )
}
