'use client'
import { useState } from 'react'
import Link from 'next/link'
import { getInitials } from '@/lib/initials'
import MessageProducerWidget from '@/components/MessageProducerWidget'

export default function Sidebar({ recentProducts = [], farms = [], canMessage = false, isLoggedIn = false }) {
  const [email, setEmail] = useState('')

  return (
    <aside className="flex flex-col gap-5">

      {/* RECENTLY ADDED */}
      <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#F0EDE7] flex justify-between items-center">
          <span className="font-serif text-[17px] font-semibold text-soil">Recently Added</span>
        </div>
        {recentProducts.length ? recentProducts.map(item => (
          <Link key={item.slug} href={`/products/${item.slug}`}
            className="flex items-center gap-2.5 px-5 py-2.5 hover:bg-[#FAFAF8] transition-colors border-b border-[#F7F5F1] last:border-0">
            <div className="w-8 h-8 rounded-lg bg-linen flex items-center justify-center flex-shrink-0 overflow-hidden">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-[11px] font-semibold text-soil/40">{getInitials(item.name)}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-soil">{item.name}</div>
              <div className="text-[11px] text-stone">{item.farmName}</div>
            </div>
          </Link>
        )) : (
          <div className="px-5 py-6 text-[13px] text-stone">Nothing listed yet.</div>
        )}
      </div>

      {/* MESSAGE */}
      <MessageProducerWidget farms={farms} canMessage={canMessage} isLoggedIn={isLoggedIn} />

      {/* NEWSLETTER */}
      <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
        <div className="p-5">
          <div className="mb-2.5">
            <div className="text-[14px] font-semibold text-soil">The Grano Weekly</div>
            <div className="text-[11px] text-stone">Every Monday morning</div>
          </div>
          <div className="text-[13px] text-stone leading-relaxed mb-3">What's happening in Chicago's local food system — season, producers, and sourcing.</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@restaurant.com"
            className="w-full bg-linen border border-transparent rounded-lg px-3 py-2 text-[13px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors placeholder:text-[#A09880] mb-2" />
          <Link href="/newsletter"
            className="block w-full bg-soil text-white text-center text-[13px] font-semibold py-2 rounded-lg hover:bg-rust transition-colors">
            Subscribe — It's Free
          </Link>
        </div>
      </div>

    </aside>
  )
}
