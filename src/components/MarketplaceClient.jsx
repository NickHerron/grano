'use client'
import { useState } from 'react'
import Link from 'next/link'
import LiveBanner from '@/components/LiveBanner'
import CategoryBar, { filterCategories } from '@/components/CategoryBar'
import ProductCard from '@/components/ProductCard'
import ProducerCard from '@/components/ProducerCard'
import SeasonalCalendar from '@/components/SeasonalCalendar'
import Sidebar from '@/components/Sidebar'
import { seasonalWindows } from '@/data'

export default function MarketplaceClient({ newProducers, realProducts, allFarms, canMessage, isLoggedIn, liveMarketplaceEnabled = true, areaLabel = 'Chicago-area' }) {
  const [category, setCategory] = useState('all')
  const activeCategory = filterCategories.find(c => c.key === category)
  const filteredProducts = activeCategory?.match ? realProducts.filter(p => activeCategory.match.includes(p.category)) : realProducts
  const categoryLabel = activeCategory?.label

  const currentMonth = new Date().getMonth()
  const compactMonthRange = [currentMonth, currentMonth + 1, currentMonth + 2].filter(m => m <= 11)

  return (
    <>
      <LiveBanner products={realProducts.slice(0, 6)} />
      <CategoryBar active={category} onChange={setCategory} />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-20 grid grid-cols-1 lg:grid-cols-[1fr_296px] gap-8 lg:gap-10">
        <div>

          {/* IN SEASON */}
          <section id="whats-available" className="mb-14 scroll-mt-20">
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <h2 className="font-serif text-[26px] font-semibold tracking-tight">
                  {category === 'all' ? (
                    <>In Season <em className="italic text-rust">This Week</em></>
                  ) : (
                    <em className="italic text-rust">{categoryLabel}</em>
                  )}
                </h2>
                <p className="text-[13px] text-stone mt-0.5">
                  {realProducts.length
                    ? (category === 'all' ? `Fresh from ${areaLabel} producers` : `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'} available`)
                    : 'Nothing listed yet'}
                </p>
              </div>
            </div>
            {!liveMarketplaceEnabled && realProducts.length > 0 && (
              <div className="bg-linen border border-[#ECEAE4] rounded-lg px-4 py-3 mb-4 text-[13px] text-stone">
                Ordering is coming soon. In the meantime, discover local producers, explore their products, and find out where to meet them in person.
              </div>
            )}
            {filteredProducts.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(p => <ProductCard key={p.slug} product={p} purchasable={liveMarketplaceEnabled} />)}
              </div>
            ) : (
              <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
                <p className="text-[14px] text-stone mb-3">
                  {realProducts.length ? 'No products in this category yet — check back soon.' : "No products listed yet — be the first producer to add one."}
                </p>
                <Link href="/signup" className="text-[13px] font-semibold text-rust hover:underline">Sign up as a producer →</Link>
              </div>
            )}
          </section>

          {/* NEW PRODUCERS */}
          <section className="mb-14">
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <h2 className="font-serif text-[26px] font-semibold tracking-tight">
                  New <em className="italic text-rust">Producers</em>
                </h2>
                <p className="text-[13px] text-stone mt-0.5">Just joined — follow them to get notified when they add products</p>
              </div>
              {newProducers.length > 0 && <a href="/producers" className="text-[13px] font-medium text-rust hover:underline">Browse all →</a>}
            </div>
            {newProducers.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {newProducers.map(f => <ProducerCard key={f.slug} farm={f} />)}
              </div>
            ) : (
              <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
                <p className="text-[14px] text-stone mb-3">No producers have joined yet.</p>
                <Link href="/signup" className="text-[13px] font-semibold text-rust hover:underline">Be the first to sign up →</Link>
              </div>
            )}
          </section>

          {/* SEASONAL CALENDAR */}
          <section className="mb-14">
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <h2 className="font-serif text-[26px] font-semibold tracking-tight">
                  Illinois <em className="italic text-rust">Seasonal Calendar</em>
                </h2>
                <p className="text-[13px] text-stone mt-0.5">Plan your menu around what's coming</p>
              </div>
              <Link href="/seasonal" className="text-[13px] font-medium text-rust hover:underline whitespace-nowrap">Full calendar →</Link>
            </div>
            <SeasonalCalendar windows={seasonalWindows} monthRange={compactMonthRange} compact />
          </section>

        </div>
        <Sidebar recentProducts={realProducts.slice(0, 5)} farms={allFarms} canMessage={canMessage} isLoggedIn={isLoggedIn} />
      </div>
    </>
  )
}
