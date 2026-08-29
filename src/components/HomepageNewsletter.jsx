'use client'
import { useState } from 'react'

export default function HomepageNewsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  if (submitted) {
    return (
      <p className="text-[15px] text-sage font-medium text-center">You&apos;re on the list. See you Monday.</p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-[480px] mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email address"
        className="flex-1 bg-white border border-[#ECEAE4] rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat transition-colors placeholder:text-stone/60"
      />
      <button type="submit" className="bg-rust text-white text-[14px] font-semibold px-5 py-3 rounded-lg hover:bg-[#A8521F] transition-colors whitespace-nowrap">
        Subscribe
      </button>
    </form>
  )
}
