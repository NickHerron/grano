'use client'
import { useState } from 'react'
import Link from 'next/link'
import { getInitials } from '@/lib/initials'
import { categories } from '@/components/CategoryBar'

function ProductRow({ p, signedIn }) {
  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <Link href={`/products/${p.slug}`} className="w-16 h-16 rounded-lg bg-linen flex items-center justify-center overflow-hidden flex-shrink-0">
        {p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-serif text-lg font-semibold text-soil/30">{getInitials(p.name)}</span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/products/${p.slug}`} className="font-serif text-[17px] font-semibold text-soil hover:text-rust transition-colors">{p.name}</Link>
        <div className="text-[12px] text-stone mb-1">
          <Link href={`/producers/${p.farm?.slug}`} className="hover:underline">{p.farm?.name}</Link>
          {p.farm?.location ? ` · ${p.farm.location}` : ''}
          {p.farm?.verification_status === 'verified' && ' · ✓ Verified'}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {p.wholesale_min_order && <span className="text-[10px] font-semibold bg-linen text-stone px-2 py-0.5 rounded">Min: {p.wholesale_min_order}</span>}
          {p.wholesale_case_size && <span className="text-[10px] font-semibold bg-linen text-stone px-2 py-0.5 rounded">Case: {p.wholesale_case_size}</span>}
          {p.wholesale_lead_time_days != null && <span className="text-[10px] font-semibold bg-linen text-stone px-2 py-0.5 rounded">{p.wholesale_lead_time_days}d lead time</span>}
        </div>
      </div>

      <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
        <div className="font-serif text-[18px] font-semibold text-soil">
          ${p.wholesale_price}<span className="text-[12px] font-normal text-stone"> / {p.wholesale_unit || 'unit'}</span>
        </div>
        {signedIn && (
          // Wholesale inquiries go through the Work With Us panel on the producer's
          // own profile now — same form everything else uses, not a separate one here.
          // Any signed-in business can buy wholesale now, not just restaurant accounts
          // — see schema_wholesale_capabilities.sql and workOptions.js's capability-
          // driven allowedWorkOptionKeys(), which is the real enforcement point.
          <Link href={`/producers/${p.farm?.slug}#work-with-us`}
            className="text-[12px] font-semibold text-white bg-rust px-3 py-1.5 rounded-lg hover:bg-[#A8521F] transition-colors whitespace-nowrap">
            Send Inquiry →
          </Link>
        )}
      </div>
    </div>
  )
}

export default function WholesaleMarketplace({ products, signedIn }) {
  const [category, setCategory] = useState('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const filtered = products.filter(p => {
    if (category !== 'all' && p.category !== category) return false
    if (verifiedOnly && p.farm?.verification_status !== 'verified') return false
    return true
  })

  return (
    <div>
      {!signedIn && (
        <div className="bg-linen rounded-xl p-4 text-[13px] text-stone mb-6">
          <Link href="/signup" className="text-rust font-semibold hover:underline">Sign up</Link> or <Link href="/login" className="text-rust font-semibold hover:underline">sign in</Link> to send a wholesale inquiry — any Grano business can buy wholesale, not just restaurants.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-white border border-[#ECEAE4] rounded-lg px-3 py-2 text-[13px] text-soil outline-none focus:border-wheat">
          {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-[13px] text-stone cursor-pointer bg-white border border-[#ECEAE4] rounded-lg px-3 py-2">
          <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} className="w-4 h-4 accent-rust" />
          Verified producers only
        </label>
      </div>

      {filtered.length ? (
        <div className="flex flex-col gap-3">
          {filtered.map(p => <ProductRow key={p.id} p={p} signedIn={signedIn} />)}
        </div>
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
          <p className="text-[14px] text-stone">No wholesale listings match these filters yet.</p>
        </div>
      )}
    </div>
  )
}
