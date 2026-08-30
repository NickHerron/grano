'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { sendWorkInquiry } from '@/lib/actions/inquiries'

const initialState = {}
const FREQ = [
  ['one_time', 'One-time'],
  ['weekly', 'Weekly'],
  ['monthly', 'Monthly'],
  ['', 'Other'],
]

function SendButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="w-full bg-rust text-white text-[14px] font-semibold px-5 py-3 rounded-full hover:bg-[#A8521F] transition-colors disabled:opacity-50">
      {pending ? 'Sending…' : 'Send Wholesale Inquiry'}
    </button>
  )
}

export default function WholesaleInquirySheet({ farm, user, viewerBusinesses = [] }) {
  const [open, setOpen] = useState(false)
  const [freq, setFreq] = useState('one_time')
  const [state, formAction] = useFormState(sendWorkInquiry, initialState)
  const restaurant = viewerBusinesses.find(b => b.type === 'restaurant')

  if (!farm.sells_wholesale) return null

  const serviceBits = [
    farm.wholesale_service_area && `Service area: ${farm.wholesale_service_area}`,
    farm.practices?.pickup_available ? 'Pickup: Available' : null,
  ].filter(Boolean)

  return (
    <section className="scroll-mt-20">
      <h2 className="font-serif text-[22px] sm:text-[26px] font-semibold text-soil mb-4">Wholesale</h2>
      <div className="bg-white border border-[#ECEAE4] rounded-2xl p-5 sm:p-6 shadow-[0_1px_8px_rgba(30,21,9,0.04)]">
        <div className="flex items-center gap-2 text-[14px] text-soil mb-2">
          <span className="text-sage">✓</span> Available for wholesale
        </div>
        {serviceBits.length > 0 && (
          <div className="text-[13px] text-stone mb-4">{serviceBits.join(' · ')}</div>
        )}

        {state.success ? (
          <p className="text-[14px] font-medium text-sage">Inquiry sent. They’ll see it in their dashboard.</p>
        ) : !user ? (
          <p className="text-[13px] text-stone">
            <Link href={`/login?next=/producers/${farm.slug}`} className="font-semibold text-rust hover:underline">Sign in</Link>
            {' '}to request wholesale information.
          </p>
        ) : (
          <button type="button" onClick={() => setOpen(true)}
            className="bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-full hover:bg-[#A8521F] transition-colors">
            Request wholesale information
          </button>
        )}
      </div>

      {open && user && !state.success && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-soil/45" onClick={() => setOpen(false)} aria-label="Close overlay" />
          <div role="dialog" aria-labelledby="inq-title" className="relative bg-white rounded-2xl max-w-[440px] w-full p-7 shadow-xl">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute top-3 right-4 text-[22px] text-stone hover:text-soil">×</button>
            <form action={formAction} className="flex flex-col gap-3">
              <input type="hidden" name="toType" value="farm" />
              <input type="hidden" name="toId" value={farm.id} />
              <input type="hidden" name="toSlug" value={farm.slug} />
              <input type="hidden" name="inquiryType" value="wholesale" />
              <input type="hidden" name="frequency" value={freq} />
              {restaurant && (
                <>
                  <input type="hidden" name="fromType" value="restaurant" />
                  <input type="hidden" name="fromId" value={restaurant.id} />
                </>
              )}
              <div>
                <h3 id="inq-title" className="font-serif text-[24px] font-semibold text-soil">Request Wholesale Information</h3>
                <p className="text-[13px] text-stone mt-1">A note to {farm.name}. Not an order.</p>
              </div>
              {state.error && <p className="text-[13px] text-rust">{state.error}</p>}
              <label className="text-[11px] font-semibold tracking-wide uppercase text-stone">
                Interested in
                <input name="subject" placeholder="Sourdough, focaccia, granola…"
                  className="mt-1 w-full bg-linen rounded-lg px-3 py-2.5 text-[14px] font-normal normal-case text-soil outline-none focus:bg-white border border-transparent focus:border-wheat" />
              </label>
              <label className="text-[11px] font-semibold tracking-wide uppercase text-stone">
                Quantity
                <input name="quantity" placeholder="How much, roughly"
                  className="mt-1 w-full bg-linen rounded-lg px-3 py-2.5 text-[14px] font-normal normal-case text-soil outline-none focus:bg-white border border-transparent focus:border-wheat" />
              </label>
              <fieldset>
                <legend className="text-[11px] font-semibold tracking-wide uppercase text-stone mb-2">Frequency</legend>
                <div className="flex flex-wrap gap-2">
                  {FREQ.map(([value, label]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFreq(value)}
                      className={`text-[13px] px-3.5 py-1.5 rounded-full border ${freq === value ? 'border-rust text-rust' : 'border-[#ECEAE4] text-soil'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="text-[11px] font-semibold tracking-wide uppercase text-stone">
                Message
                <textarea name="message" rows={4} placeholder="Who you are and what you need"
                  className="mt-1 w-full bg-linen rounded-lg px-3 py-2.5 text-[14px] font-normal normal-case text-soil outline-none focus:bg-white border border-transparent focus:border-wheat resize-y" />
              </label>
              <SendButton />
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
