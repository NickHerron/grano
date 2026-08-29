'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateCartQty, removeFromCart } from '@/lib/cart'
import { getInitials } from '@/lib/initials'
import { placeOrder } from './actions'

export default function CartClient({ initialItems, liveMarketplaceEnabled = true }) {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState(initialItems)
  const [, startTransition] = useTransition()
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState('')

  async function handlePlaceOrder() {
    setPlacing(true)
    setPlaceError('')
    const result = await placeOrder()
    setPlacing(false)
    if (result.error) {
      setPlaceError(result.error)
      return
    }
    router.push(`/orders/${result.orderId}`)
  }

  function updateQty(id, delta) {
    const item = items.find(i => i.id === id)
    if (!item) return
    const newQty = Math.max(1, item.qty + delta)
    setItems(items.map(i => i.id === id ? { ...i, qty: newQty } : i))
    startTransition(async () => {
      await updateCartQty(supabase, id, newQty)
      router.refresh()
    })
  }

  function removeItem(id) {
    setItems(items.filter(i => i.id !== id))
    startTransition(async () => {
      await removeFromCart(supabase, id)
      router.refresh()
    })
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const delivery = items.length ? 8 : 0
  const fee = subtotal * 0.05
  const total = subtotal + delivery + fee

  const farmGroups = items.reduce((acc, item) => {
    acc[item.farm] = acc[item.farm] || []
    acc[item.farm].push(item)
    return acc
  }, {})

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="font-serif text-[28px] font-semibold text-soil mb-2">Your cart is empty</h2>
        <p className="text-[14px] text-stone mb-6">Head back to the market to find something fresh.</p>
        <Link href="/" className="inline-block bg-rust text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#A8521F] transition-colors">Browse the Market →</Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-7 items-start">
      <div className="flex flex-col gap-3">
        {Object.entries(farmGroups).map(([farm, farmItems]) => (
          <div key={farm}>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-stone uppercase tracking-widest py-2 mb-1">
              {farm}
              <div className="flex-1 h-px bg-[#ECEAE4]" />
            </div>
            {farmItems.map(item => (
              <div key={item.id} className="bg-white border border-[#ECEAE4] rounded-xl p-4 grid grid-cols-[56px_1fr_auto] gap-4 items-center mb-2.5">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-serif text-base font-semibold text-soil/30">{getInitials(item.name)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-rust uppercase tracking-wide mb-0.5">{item.farm}</div>
                  <div className="font-serif text-[18px] font-semibold text-soil mb-0.5 truncate">{item.name}</div>
                  <div className="text-[12px] text-stone">{item.meta}</div>
                </div>
                <div className="text-right">
                  <div className="font-serif text-[20px] font-semibold text-soil mb-2">${(item.price * item.qty).toFixed(2)}</div>
                  <div className="flex border-[1.5px] border-[#ECEAE4] rounded-lg overflow-hidden mb-1.5">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 text-[15px] text-soil hover:bg-linen transition-colors">−</button>
                    <span className="w-8 text-center text-[13px] font-semibold text-soil flex items-center justify-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 text-[15px] text-soil hover:bg-linen transition-colors">+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-[11px] text-[#C0A090] hover:text-rust transition-colors">Remove</button>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div className="bg-white border border-[#ECEAE4] rounded-xl p-5 mt-2">
          <div className="text-[13px] font-semibold text-soil mb-1.5">Keep Shopping</div>
          <div className="text-[13px] text-stone mb-4">Browse more from Chicago-area producers.</div>
          <Link href="/" className="inline-block border-[1.5px] border-[#ECEAE4] text-soil text-[14px] py-2.5 px-5 rounded-xl hover:border-soil transition-colors">
            ← Back to Market
          </Link>
        </div>
      </div>

      <div className="bg-white border border-[#ECEAE4] rounded-xl p-6 lg:sticky lg:top-20">
        <h3 className="font-serif text-[20px] font-semibold text-soil mb-5">Order Summary</h3>
        {items.map(i => (
          <div key={i.id} className="flex justify-between text-[14px] text-stone mb-2.5">
            <span>{i.name} × {i.qty}</span>
            <span>${(i.price * i.qty).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between text-[14px] text-stone mb-2.5">
          <span>Delivery fee</span><span>${delivery.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[14px] text-stone mb-2.5">
          <span>Grano service fee (5%)</span><span>${fee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[16px] font-bold text-soil border-t border-[#ECEAE4] pt-3 mt-1 mb-4">
          <span>Total</span><span>${total.toFixed(2)}</span>
        </div>
        <div className="bg-[#EBF3EC] rounded-lg p-3 text-[12px] text-sage mb-4 leading-relaxed">
          Combined delivery from {Object.keys(farmGroups).length} farm{Object.keys(farmGroups).length === 1 ? '' : 's'} in one drop.
        </div>
        {placeError && <p className="text-[12px] text-rust mb-2">{placeError}</p>}
        <button onClick={handlePlaceOrder} disabled={placing || !liveMarketplaceEnabled}
          className="w-full bg-rust text-white py-3.5 rounded-xl text-[15px] font-bold mb-1.5 hover:bg-[#A8521F] transition-colors disabled:opacity-60">
          {!liveMarketplaceEnabled ? 'Ordering Paused' : placing ? 'Placing order…' : 'Place Order'}
        </button>
        <p className="text-[11px] text-stone text-center mb-2.5">No payment is collected — Grano checkout is a demo for now.</p>
        <Link href="/" className="block w-full text-center border-[1.5px] border-[#ECEAE4] text-soil text-[14px] py-3 rounded-xl hover:border-soil transition-colors">
          ← Continue Shopping
        </Link>
        <div className="mt-5 text-center">
          <div className="font-mono text-[11px] text-stone uppercase tracking-widest mb-2">Producers in this order</div>
          <div className="flex justify-center gap-2">
            {Object.values(farmGroups).map(g => (
              <span key={g[0].farm} title={g[0].farm}
                className="w-7 h-7 rounded-md overflow-hidden flex items-center justify-center font-serif text-[11px] font-semibold text-soil/40"
                style={{ background: g[0].bg }}>
                {g[0].farmLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g[0].farmLogoUrl} alt={g[0].farm} className="w-full h-full object-cover" />
                ) : getInitials(g[0].farm)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
