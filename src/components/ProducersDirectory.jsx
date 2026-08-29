'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import ProducerCard from '@/components/ProducerCard'
import { PRODUCER_TYPES } from '@/lib/producerOptions'

export default function ProducersDirectory({ farms }) {
  const [type, setType] = useState('all')
  const [sellingOnly, setSellingOnly] = useState(false)
  const [pickupOnly, setPickupOnly] = useState(false)
  const [wholesaleOnly, setWholesaleOnly] = useState(false)
  const [buyingWholesaleOnly, setBuyingWholesaleOnly] = useState(false)
  const [csaOnly, setCsaOnly] = useState(false)

  const presentTypes = useMemo(
    () => PRODUCER_TYPES.filter(t => farms.some(f => f.producerType === t || f.secondaryTypes?.includes(t))),
    [farms]
  )

  const filtered = farms.filter(f => {
    if (type !== 'all' && f.producerType !== type && !f.secondaryTypes?.includes(type)) return false
    if (sellingOnly && !f.sellOnGrano) return false
    if (pickupOnly && !f.practices?.pickup_available) return false
    if (wholesaleOnly && !f.sellsWholesale) return false
    if (buyingWholesaleOnly && !f.buysWholesale) return false
    if (csaOnly && !f.practices?.csa_available) return false
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
          <button onClick={() => setSellingOnly(v => !v)} className={filterBtn(sellingOnly)}>Selling on Grano</button>
          <button onClick={() => setPickupOnly(v => !v)} className={filterBtn(pickupOnly)}>Pickup Available</button>
          <button onClick={() => setWholesaleOnly(v => !v)} className={filterBtn(wholesaleOnly)}>Sells Wholesale</button>
          <button onClick={() => setBuyingWholesaleOnly(v => !v)} className={filterBtn(buyingWholesaleOnly)}>Buying Wholesale</button>
          <button onClick={() => setCsaOnly(v => !v)} className={filterBtn(csaOnly)}>CSA Available</button>
        </div>
      </div>

      <p className="text-[13px] text-stone mb-4">{filtered.length} of {farms.length} producers</p>

      {filtered.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(f => <ProducerCard key={f.slug} farm={f} />)}
        </div>
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-20 text-center px-4">
          <p className="text-[14px] text-stone mb-3">No producers match those filters.</p>
          <Link href="/signup" className="inline-block bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">
            Sign up as a producer →
          </Link>
        </div>
      )}
    </div>
  )
}
