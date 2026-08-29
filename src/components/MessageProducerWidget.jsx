'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { sendMessage } from '@/lib/actions/messages'

const initialState = {}
const OPEN = ''

function SendButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="bg-rust text-white w-7 h-7 rounded-md flex items-center justify-center text-[13px] hover:bg-[#A8521F] transition-colors flex-shrink-0 disabled:opacity-50">
      {pending ? '…' : '→'}
    </button>
  )
}

export default function MessageProducerWidget({ farms = [], canMessage, isLoggedIn }) {
  const [state, formAction] = useFormState(sendMessage, initialState)
  const [target, setTarget] = useState(OPEN)

  if (!canMessage) {
    return (
      <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#F0EDE7]">
          <span className="font-serif text-[17px] font-semibold text-soil">Message a Producer</span>
        </div>
        <div className="p-5 text-[13px] text-stone leading-relaxed">
          {isLoggedIn ? (
            'Messaging producers is available to restaurant accounts. Sign up with a restaurant account to message producers directly or post an open sourcing request.'
          ) : (
            <>
              <Link href="/login" className="text-rust font-semibold hover:underline">Sign in</Link> as a restaurant to message producers directly, or post an open request for anyone sourcing a product.
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#F0EDE7]">
        <span className="font-serif text-[17px] font-semibold text-soil">Message a Producer</span>
      </div>
      <div className="p-5">
        {state.success ? (
          <div className="text-center py-2">
            <div className="text-[13px] font-semibold text-sage mb-0.5">Message sent.</div>
            <div className="text-[11px] text-stone">
              {target === OPEN ? 'Every producer can see it in their dashboard.' : "They'll see it in their dashboard."}
            </div>
          </div>
        ) : (
          <form action={formAction}>
            <div className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-1.5">Send to</div>
            <select
              name="farmId"
              value={target}
              onChange={e => setTarget(e.target.value)}
              className="w-full bg-linen border border-transparent rounded-lg px-3 py-2 text-[13px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors mb-3"
            >
              <option value={OPEN}>📣 Open request — all producers</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>

            <div className="bg-linen rounded-lg p-2.5 flex gap-2 items-end">
              <textarea
                name="text"
                placeholder={target === OPEN
                  ? "Looking to source heirloom tomatoes for a summer menu — who's got them?"
                  : "Can you grow more shishitos next month? We'd need 10 lbs/week…"}
                className="flex-1 bg-transparent border-none outline-none font-sans text-[13px] text-soil resize-none h-11 placeholder:text-[#A09880]"
              />
              <SendButton />
            </div>
            {state.error && <p className="text-[12px] text-rust mt-2">{state.error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
