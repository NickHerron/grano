'use client'
import { useState, useMemo } from 'react'
import RestaurantCard from '@/components/RestaurantCard'
import { RESTAURANT_TYPES } from '@/lib/restaurantOptions'

// Mirrors ProducersDirectory.jsx's exact filter-chip pattern — restaurants had no
// filter UI at all before this (just a bare grid), which meant no parity with the
// producer side even though restaurants can now sell wholesale and buy wholesale
// exactly like producers can (schema_wholesale_capabilities.sql).
export default function RestaurantsDirectory({ restaurants }) {
  const [type, setType] = useState('all')
  const [sellsWholesaleOnly, setSellsWholesaleOnly] = useState(false)
  const [buysWholesaleOnly, setBuysWholesaleOnly] = useState(false)

  const presentTypes = useMemo(
    () => RESTAURANT_TYPES.filter(t => restaurants.some(r => r.restaurant_type === t || r.business_types?.includes(t))),
    [restaurants]
  )

  const filtered = restaurants.filter(r => {
    if (type !== 'all' && r.restaurant_type !== type && !r.business_types?.includes(type)) return false
    if (sellsWholesaleOnly && !r.sells_wholesale) return false
    if (buysWholesaleOnly && !r.buys_wholesale) return false
    return true
  })

  const filterBtn = (active) => `text-[13px] font-medium px-3.5 py-2 rounded-lg border-[1.5px] transition-all whitespace-nowrap ${
    active ? 'bg-soil border-soil text-white' : 'border-[#ECEAE4] text-stone hover:border-rust hover:text-rust'
  }`

  return (
    <div>
      <div className="flex flex-col gap-3 mb-8">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button onClick={() => setType('all')} className={filterBtn(type === 'all')}>All Types</button>
          {presentTypes.map(t => (
            <button key={t} onClick={() => setType(t)} className={filterBtn(type === t)}>{t}</button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSellsWholesaleOnly(v => !v)} className={filterBtn(sellsWholesaleOnly)}>Sells Wholesale</button>
          <button onClick={() => setBuysWholesaleOnly(v => !v)} className={filterBtn(buysWholesaleOnly)}>Buying Wholesale</button>
        </div>
      </div>

      <p className="text-[13px] text-stone mb-4">{filtered.length} of {restaurants.length} restaurants</p>

      {filtered.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
        </div>
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-20 text-center px-4">
          <p className="text-[14px] text-stone">No restaurants match those filters.</p>
        </div>
      )}
    </div>
  )
}
