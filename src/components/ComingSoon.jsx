'use client'
import { useState } from 'react'

export default function ComingSoon({ title, description }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  return (
    <div className="bg-soil min-h-screen py-16 sm:py-24 px-4 sm:px-8 flex items-center justify-center">
      <div className="max-w-[560px] text-center w-full">
        <div className="flex items-center justify-center gap-2.5 font-mono text-[10px] tracking-[.2em] uppercase text-wheat mb-5">
          <span className="w-7 h-px bg-wheat inline-block" />
          Coming Soon
          <span className="w-7 h-px bg-wheat inline-block" />
        </div>
        <h1 className="font-serif font-light text-[clamp(36px,6vw,56px)] text-white tracking-tight leading-[1.05] mb-5">
          {title}
        </h1>
        <p className="text-[16px] font-light text-white/50 leading-relaxed mb-10">
          {description} We're cooking up good things — join the waitlist and we'll let you know the moment it's ready.
        </p>

        {submitted ? (
          <div className="py-4">
            <div className="w-12 h-12 rounded-full bg-sage/20 border border-sage text-sage flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
            <h2 className="font-serif text-[24px] font-semibold text-white mb-1.5">You're on the list.</h2>
            <p className="text-[14px] text-white/50">We'll email you as soon as this launches.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@restaurant.com"
              className="flex-1 min-w-0 bg-white/7 border border-white/12 rounded-lg px-4 py-3 text-[14px] text-white outline-none focus:border-wheat transition-colors placeholder:text-white/25 font-sans"
            />
            <button type="submit" className="bg-wheat text-soil text-[14px] font-bold px-6 py-3 rounded-lg hover:bg-[#DAA445] transition-colors whitespace-nowrap">
              Join the Waitlist
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
