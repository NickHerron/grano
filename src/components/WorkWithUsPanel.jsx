'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import { sendWorkInquiry } from '@/lib/actions/inquiries'
import { WORK_OPTION_DEFS, FIELDS_BY_TYPE } from '@/lib/workOptions'
import { FREQUENCY_OPTIONS } from '@/lib/sourcingOptions'
import WorkOptionsDisplay from './WorkOptionsDisplay'

const initialState = {}
const inputClass = "bg-linen border border-transparent rounded-lg px-3 py-2.5 text-[13px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors w-full"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="bg-rust text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-50">
      {pending ? 'Sending…' : 'Send Inquiry'}
    </button>
  )
}

// The "how can I work with this business?" CTA + structured picker, shared by both
// producer and restaurant public profiles. `options` is the resolved (enabled/
// disabled) list from src/lib/workOptions.js — this component only ever offers the
// enabled ones. `preset` (optional prop) pre-selects a type and pre-fills fields; the
// same thing can also arrive via URL (?inquire=sourcing&request={id}&product={id}) —
// how "Respond to Sourcing Need" links into this from a restaurant's public profile,
// same panel, no separate response form.
export default function WorkWithUsPanel({
  businessType, businessId, businessSlug, businessName, options, heading,
  products = [], user, viewerBusinesses = [], preset = null,
}) {
  const searchParams = useSearchParams()
  const urlInquiryType = searchParams.get('inquire')
  const effectivePreset = preset || (urlInquiryType ? {
    inquiryType: urlInquiryType,
    sourcingRequestId: searchParams.get('request') || null,
    productId: searchParams.get('product') || null,
    subject: searchParams.get('subject') || null,
  } : null)

  const [state, formAction] = useFormState(sendWorkInquiry, initialState)
  const [open, setOpen] = useState(Boolean(effectivePreset))
  const enabled = options.filter(o => o.enabled)
  // Only honor the preset's type if this business actually has it enabled — a stale
  // or crafted link shouldn't be able to pre-select something that isn't offered.
  const presetTypeIsEnabled = effectivePreset && enabled.some(o => o.key === effectivePreset.inquiryType)
  const [selectedType, setSelectedType] = useState((presetTypeIsEnabled ? effectivePreset.inquiryType : enabled[0]?.key) || null)
  const [actingAs, setActingAs] = useState('') // '' = myself, else "type:id"
  const [selectedProductIds, setSelectedProductIds] = useState(new Set(effectivePreset?.productId ? [effectivePreset.productId] : []))

  if (!enabled.length) return null

  const fields = new Set(FIELDS_BY_TYPE[selectedType] || [])
  const [actingType, actingId] = actingAs ? actingAs.split(':') : [null, null]

  function toggleProduct(id) {
    setSelectedProductIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (state.success) {
    return (
      <section id="work-with-us" className="scroll-mt-20">
        <WorkOptionsDisplay options={options} heading={heading} />
        <div className="mt-3 bg-[#EBF3EC] border border-sage/30 rounded-xl p-5">
          <div className="text-[14px] font-semibold text-sage mb-1">Your inquiry has been sent.</div>
          <p className="text-[13px] text-stone">{businessName} will follow up — you can track its status from your dashboard.</p>
          <Link href="/dashboard/messages?section=inquiries" className="inline-block mt-2 text-[13px] font-semibold text-rust hover:underline">View my inquiries →</Link>
        </div>
      </section>
    )
  }

  return (
    <section id="work-with-us" className="scroll-mt-20">
      <WorkOptionsDisplay options={options} heading={heading} />

      {!user ? (
        <div className="mt-3 bg-linen rounded-xl p-4 text-[13px] text-stone">
          <Link href={`/login?next=/${businessType === 'farm' ? 'producers' : 'restaurants'}/${businessSlug}`} className="font-semibold text-rust hover:underline">Sign in</Link>
          {' '}to start an inquiry with {businessName}.
        </div>
      ) : !open ? (
        <button onClick={() => setOpen(true)}
          className="mt-3 bg-rust text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">
          Start an Inquiry →
        </button>
      ) : (
        <form action={formAction} className="mt-3 bg-white border border-[#ECEAE4] rounded-xl p-5 flex flex-col gap-4">
          <input type="hidden" name="toType" value={businessType} />
          <input type="hidden" name="toId" value={businessId} />
          <input type="hidden" name="toSlug" value={businessSlug} />
          <input type="hidden" name="inquiryType" value={selectedType} />
          {actingType && <input type="hidden" name="fromType" value={actingType} />}
          {actingId && <input type="hidden" name="fromId" value={actingId} />}
          {effectivePreset?.sourcingRequestId && <input type="hidden" name="sourcingRequestId" value={effectivePreset.sourcingRequestId} />}
          {[...selectedProductIds].map(id => <input key={id} type="hidden" name="productIds" value={id} />)}

          <div>
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone block mb-1.5">How can we help?</label>
            <div className="flex flex-col gap-1.5">
              {enabled.map(o => (
                <label key={o.key} className={`flex flex-col gap-0.5 text-[13px] text-soil cursor-pointer rounded-lg px-3 py-2.5 border-[1.5px] transition-colors ${
                  selectedType === o.key ? 'bg-[#FDF0E8] border-rust' : 'bg-linen border-transparent'
                }`}>
                  <span className="flex items-center gap-2">
                    <input type="radio" name="_type" checked={selectedType === o.key} onChange={() => setSelectedType(o.key)} className="w-4 h-4 accent-rust" />
                    {WORK_OPTION_DEFS[o.key].label}
                  </span>
                  <span className="text-[11px] text-stone pl-6">{o.headline || WORK_OPTION_DEFS[o.key].prompt}</span>
                </label>
              ))}
            </div>
          </div>

          {viewerBusinesses.length > 0 && (
            <div>
              <label className="text-[12px] font-semibold tracking-wide uppercase text-stone block mb-1.5">Sending as</label>
              <select className={inputClass} value={actingAs} onChange={e => setActingAs(e.target.value)}>
                <option value="">Myself</option>
                {viewerBusinesses.map(b => <option key={`${b.type}:${b.id}`} value={`${b.type}:${b.id}`}>{b.name}</option>)}
              </select>
            </div>
          )}

          {fields.has('product') && products.length > 0 && (
            <div>
              <label className="text-[12px] font-semibold tracking-wide uppercase text-stone block mb-1.5">Product (optional)</label>
              <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto">
                {products.map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-[13px] text-soil cursor-pointer bg-linen rounded-lg px-3 py-2">
                    <input type="checkbox" checked={selectedProductIds.has(p.id)} onChange={() => toggleProduct(p.id)} className="w-4 h-4 accent-rust" />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {fields.has('subject') && (
            <input name="subject" placeholder="What's this about?" className={inputClass} defaultValue={effectivePreset?.subject || ''} />
          )}

          {(fields.has('quantity') || fields.has('frequency')) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fields.has('quantity') && <input name="quantity" placeholder="Quantity — e.g. 50 lbs" className={inputClass} />}
              {fields.has('frequency') && (
                <select name="frequency" defaultValue="" className={inputClass}>
                  <option value="">Frequency (optional)</option>
                  {FREQUENCY_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              )}
            </div>
          )}

          {fields.has('desiredDate') && (
            <div>
              <label className="text-[12px] font-semibold tracking-wide uppercase text-stone block mb-1.5">
                {selectedType === 'event' ? 'Event date' : 'Desired date'}
              </label>
              <input name="desiredDate" type="date" className={inputClass} />
            </div>
          )}

          {selectedType === 'event' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold tracking-wide uppercase text-stone block mb-1.5">Start time</label>
                  <input name="eventStartTime" type="time" className={inputClass} />
                </div>
                <div>
                  <label className="text-[12px] font-semibold tracking-wide uppercase text-stone block mb-1.5">End time</label>
                  <input name="eventEndTime" type="time" className={inputClass} />
                </div>
              </div>
              <input name="eventLocation" placeholder="Event location" className={inputClass} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input name="guestCount" type="number" min="1" placeholder="Estimated guests" className={inputClass} />
                {fields.has('budget') && <input name="budget" placeholder="Budget (optional)" className={inputClass} />}
              </div>
            </>
          )}

          {fields.has('budget') && selectedType !== 'event' && (
            <input name="budget" placeholder="Budget (optional)" className={inputClass} />
          )}

          <textarea name="message" placeholder="A note for them…" defaultValue={effectivePreset?.message || ''}
            className={inputClass + ' resize-none h-24'} />

          {state.error && <p className="text-[12px] text-rust">{state.error}</p>}

          <div className="flex items-center gap-3">
            <SubmitButton />
            <button type="button" onClick={() => setOpen(false)} className="text-[12px] text-stone hover:text-soil transition-colors">Cancel</button>
          </div>
        </form>
      )}
    </section>
  )
}
