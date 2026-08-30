'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { sendWorkInquiry } from '@/lib/actions/inquiries'

const initialState = {}

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
  const [state, formAction] = useFormState(sendWorkInquiry, initialState)
  const restaurant = viewerBusinesses.find(b => b.type === 'restaurant')

  if (!farm.sells_wholesale) return null

  return (
    <section className="scroll-mt-20">
      <h2 className="font-serif text-[22px] sm:text-[26px] font-semibold text-soil mb-4">Wholesale</h2>
      <div className="bg-white border border-[#ECEAE4] rounded-2xl p-5 sm:p-6 shadow-[0_1px_8px_rgba(30,21,9,0.04)]">
        <div className="flex items-center gap-2 text-[14px] text-soil mb-2">
          <span className="text-sage">✓</span> Available for wholesale
        </div>
        <div className="text-[13px] text-stone mb-4">
          {[farm.wholesale_service_area && `Service area: ${farm.wholesale_service_area}`,
            farm.practices?.pickup_available ? 'Pickup: Available' : null].filter(Boolean).join(' · ') || 'Service area: Chicago'}
        </div>

        {state.success ? (
          <p className="text-[14px] font-medium text-sage">Inquiry sent. They’ll see it in their dashboard.</p>
        ) : !user ? (
          <p className="text-[13px] text-stone">
            <Link href={`/login?next=/producers/${farm.slug}`} className="font-semibold text-rust hover:underline">Sign in</Link>
            {' '}to request wholesale information.
          </p>
        ) : !open ? (
          <button type="button" onClick={() => setOpen(true)}
            className="bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-full hover:bg-[#A8521F] transition-colors">
            Request wholesale information
          </button>
        ) : (
          <form action={formAction} className="flex flex-col gap-3 mt-2">
            <input type="hidden" name="toType" value="farm" />
            <input type="hidden" name="toId" value={farm.id} />
            <input type="hidden" name="toSlug" value={farm.slug} />
            <input type="hidden" name="inquiryType" value="wholesale" />
            {restaurant && (
              <>
                <input type="hidden" name="fromType" value="restaurant" />
                <input type="hidden" name="fromId" value={restaurant.id} />
              </>
            )}
            <div>
              <h3 className="font-serif text-[22px] font-semibold text-soil">Request Wholesale Information</h3>
              <p className="text-[13px] text-stone mt-1">A note to {farm.name}. Not an order.</p>
            </div>
            {state.error && <p className="text-[13px] text-rust">{state.error}</p>}
            <label className="text-[12px] font-semibold text-stone">
              Interested in
              <input name="subject" placeholder="Sourdough, focaccia, granola…"
                className="mt-1 w-full bg-linen rounded-lg px-3 py-2.5 text-[13px] text-soil outline-none focus:bg-white border border-transparent focus:border-wheat" />
            </label>
            <label className="text-[12px] font-semibold text-stone">
              Quantity
              <input name="quantity" placeholder="How much, roughly"
                className="mt-1 w-full bg-linen rounded-lg px-3 py-2.5 text-[13px] text-soil outline-none focus:bg-white border border-transparent focus:border-wheat" />
            </label>
            <fieldset>
              <legend className="text-[12px] font-semibold text-stone mb-1.5">Frequency</legend>
              <div className="flex flex-wrap gap-3 text-[13px] text-soil">
                <label className="flex items-center gap-1.5"><input type="radio" name="frequency" value="one_time" defaultChecked /> One-time</label>
                <label className="flex items-center gap-1.5"><input type="radio" name="frequency" value="weekly" /> Weekly</label>
                <label className="flex items-center gap-1.5"><input type="radio" name="frequency" value="monthly" /> Monthly</label>
                <label className="flex items-center gap-1.5"><input type="radio" name="frequency" value="" /> Other</label>
              </div>
            </fieldset>
            <label className="text-[12px] font-semibold text-stone">
              Message
              <textarea name="message" rows={4} placeholder="Who you are and what you need"
                className="mt-1 w-full bg-linen rounded-lg px-3 py-2.5 text-[13px] text-soil outline-none focus:bg-white border border-transparent focus:border-wheat resize-y" />
            </label>
            <SendButton />
            <button type="button" onClick={() => setOpen(false)} className="text-[13px] text-stone hover:text-soil">Cancel</button>
          </form>
        )}
      </div>
    </section>
  )
}
