'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { submitInvitedReview } from '@/app/producers/[slug]/actions'

const initialState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="w-full bg-rust text-white text-[14px] font-semibold py-3 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-50">
      {pending ? 'Posting…' : 'Post Review'}
    </button>
  )
}

export default function InviteReviewForm({ token, slug }) {
  const [state, formAction] = useFormState(submitInvitedReview, initialState)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)

  if (state.success) {
    return (
      <div className="bg-[#EBF3EC] border border-sage/30 rounded-xl p-6 text-center">
        <div className="text-[15px] font-semibold text-sage mb-1">Thanks — your review is live.</div>
        <Link href={`/producers/${slug}`} className="text-[13px] text-rust font-semibold hover:underline">View the profile →</Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="bg-white border border-[#ECEAE4] rounded-xl p-6">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />

      <div className="flex justify-center gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className={`text-3xl leading-none transition-colors ${(hover || rating) >= n ? 'text-wheat' : 'text-[#E4E0D5]'}`}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        name="text"
        placeholder="How was the quality, and would you buy from them again?"
        className="w-full bg-linen rounded-lg p-3 text-[13px] text-soil outline-none resize-none h-24 placeholder:text-[#A09880] font-sans mb-4"
      />

      {state.error && <div className="text-[12px] text-rust mb-3 text-center">{state.error}</div>}

      <SubmitButton />
    </form>
  )
}
