'use client'
import { useState } from 'react'

const notifyOptions = ['New products', 'In-season alerts', 'Group buy openings', 'New producers', 'Restaurant sourcing requests', 'Producer stories']

export default function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', restaurant: '', email: '', type: '' })
  const [checked, setChecked] = useState(['New products', 'In-season alerts', 'Group buy openings'])

  function toggleCheck(label) {
    setChecked(c => c.includes(label) ? c.filter(x => x !== label) : [...c, label])
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (form.email) setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-full bg-sage/20 border border-sage text-sage flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
        <h2 className="font-serif text-[32px] font-semibold text-white mb-2">You're on the list.</h2>
        <p className="text-[16px] text-white/50">See you next Monday at 6am.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-white/40">Your name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Maria Chen"
            className="bg-white/7 border border-white/12 rounded-lg px-4 py-3 text-[14px] text-white outline-none focus:border-wheat transition-colors placeholder:text-white/25 font-sans" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-white/40">Restaurant / Business</label>
          <input value={form.restaurant} onChange={e => setForm({ ...form, restaurant: e.target.value })} placeholder="Optional"
            className="bg-white/7 border border-white/12 rounded-lg px-4 py-3 text-[14px] text-white outline-none focus:border-wheat transition-colors placeholder:text-white/25 font-sans" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold tracking-wide uppercase text-white/40">Email address</label>
        <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"
          className="bg-white/7 border border-white/12 rounded-lg px-4 py-3 text-[14px] text-white outline-none focus:border-wheat transition-colors placeholder:text-white/25 font-sans" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold tracking-wide uppercase text-white/40">I am a…</label>
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
          className="bg-white/7 border border-white/12 rounded-lg px-4 py-3 text-[14px] text-white outline-none focus:border-wheat transition-colors font-sans appearance-none">
          <option value="" disabled>Choose one</option>
          <option>Chef / Restaurant</option>
          <option>Home cook</option>
          <option>Food retailer</option>
          <option>Caterer</option>
          <option>Food journalist / blogger</option>
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-semibold tracking-wide uppercase text-white/40">Notify me about</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {notifyOptions.map(label => (
            <label key={label} className="flex items-center gap-2 text-[13px] text-white/60 cursor-pointer">
              <input type="checkbox" checked={checked.includes(label)} onChange={() => toggleCheck(label)}
                className="w-4 h-4 accent-[#C8943A]" />
              {label}
            </label>
          ))}
        </div>
      </div>
      <button type="submit" className="w-full bg-wheat text-soil text-[15px] font-bold py-4 rounded-xl hover:bg-[#DAA445] transition-colors mt-2">
        Subscribe to the Grano Weekly →
      </button>
      <p className="text-[12px] text-white/25 text-center leading-relaxed">
        No spam, ever. One email per week, every Monday at 6am. Unsubscribe any time.
      </p>
    </form>
  )
}
