'use client'
import { useState } from 'react'
import CardCustomizer from './CardCustomizer'

// "YOUR STORIES" — the picker itself. Per the design spec's own UX requirement, the
// user should never have to think "what should I post" — only unlocked cards (real
// data behind them) are ever offered, each with a one-line reason to post it. Product
// Story is handled as its own extra row rather than one of storyCards.js's business-
// level "cards" entries, since it's inherently per-product, not a single yes/no unlock.
export default function ShareHub({ businesses }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [selectedCard, setSelectedCard] = useState(null)

  const active = businesses[activeIdx]
  if (!active) return null
  const { business, businessType, storyCards, productsWithSources } = active
  const unlocked = storyCards.cards.filter(c => c.unlocked)
  const locked = storyCards.cards.filter(c => !c.unlocked)

  if (selectedCard) {
    return (
      <CardCustomizer
        business={business} businessType={businessType} card={selectedCard}
        productsWithSources={productsWithSources}
        onBack={() => setSelectedCard(null)}
      />
    )
  }

  return (
    <div>
      {businesses.length > 1 && (
        <div className="flex gap-2 mb-6">
          {businesses.map((b, i) => (
            <button key={b.businessType} onClick={() => { setActiveIdx(i); setSelectedCard(null) }}
              className={`text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors ${
                i === activeIdx ? 'bg-soil text-white' : 'bg-linen text-stone hover:text-soil'
              }`}>
              {b.business.name}
            </button>
          ))}
        </div>
      )}

      <div className="mb-6">
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">Your Stories</h2>
        <p className="text-[13px] text-stone">Ready to post, built from what's already on your profile — nothing to write.</p>
      </div>

      {unlocked.length === 0 && !productsWithSources.length ? (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center px-6">
          <p className="text-[14px] text-stone mb-1">Nothing to share yet.</p>
          <p className="text-[13px] text-stone">As you add products, tag local sources, and connect with your Local Network, stories will show up here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mb-8">
          {unlocked.map(c => (
            <button key={c.key} onClick={() => setSelectedCard(c)}
              className="text-left flex items-center justify-between gap-4 bg-white border border-[#ECEAE4] rounded-xl px-5 py-4 hover:border-rust transition-colors">
              <div className="min-w-0">
                <div className="font-serif text-[18px] font-semibold text-soil truncate">{c.label}</div>
                <div className="text-[13px] text-stone mt-0.5">{c.why}</div>
              </div>
              <span className="text-[13px] font-semibold text-rust flex-shrink-0">Create Card →</span>
            </button>
          ))}
          {productsWithSources.length > 0 && (
            <button
              onClick={() => setSelectedCard({ key: 'product_story', label: 'This Product Has a Story', why: 'Credit exactly what goes into one of your products.' })}
              className="text-left flex items-center justify-between gap-4 bg-white border border-[#ECEAE4] rounded-xl px-5 py-4 hover:border-rust transition-colors">
              <div className="min-w-0">
                <div className="font-serif text-[18px] font-semibold text-soil">This Product Has a Story</div>
                <div className="text-[13px] text-stone mt-0.5">Credit exactly what goes into one of your products.</div>
              </div>
              <span className="text-[13px] font-semibold text-rust flex-shrink-0">Create Card →</span>
            </button>
          )}
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wide text-stone mb-3">Not Ready Yet</div>
          <div className="flex flex-col gap-2">
            {locked.map(c => (
              <div key={c.key} className="text-[13px] text-stone bg-linen rounded-lg px-4 py-3">{c.why}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
