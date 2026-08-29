'use client'
import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { submitReview } from '@/app/producers/[slug]/actions'

const initialState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="bg-rust text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-50">
      {pending ? 'Posting…' : 'Post Review'}
    </button>
  )
}

export default function ReviewForm({ farmId, slug, orderId }) {
  const [state, formAction] = useFormState(submitReview, initialState)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)

  if (state.success) {
    return (
      <div className="bg-[#EBF3EC] border border-sage/30 rounded-xl p-5 text-center">
        <div className="text-[14px] font-semibold text-sage mb-0.5">Thanks — your review is live.</div>
        <div className="text-[12px] text-stone">Other customers can now see it.</div>
      </div>
    )
  }

  return (
    <form action={formAction} className="bg-white border border-[#ECEAE4] rounded-xl p-5">
      <input type="hidden" name="farmId" value={farmId} />
      <input type="hidden" name="slug" value={slug} />
      {orderId && <input type="hidden" name="orderId" value={orderId} />}
      <input type="hidden" name="rating" value={rating} />

      <div className="text-[14px] font-semibold text-soil mb-3">Leave a review</div>

      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className={`text-2xl leading-none transition-colors ${(hover || rating) >= n ? 'text-wheat' : 'text-[#E4E0D5]'}`}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        name="text"
        placeholder="How was the quality, consistency, and communication?"
        className="w-full bg-linen rounded-lg p-3 text-[13px] text-soil outline-none resize-none h-20 placeholder:text-[#A09880] font-sans mb-3"
      />

      {state.error && <div className="text-[12px] text-rust mb-3">{state.error}</div>}

      <SubmitButton />
    </form>
  )
}
