import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CartClient from './CartClient'
import { getLiveMarketplaceEnabled } from '@/lib/marketplace'

export default async function CartPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="max-w-[600px] mx-auto px-8 py-24 text-center">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-2">Sign in to see your cart</h1>
        <p className="text-[14px] text-stone mb-6">Your cart is saved to your account.</p>
        <Link href="/login" className="inline-block bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">
          Sign in →
        </Link>
      </div>
    )
  }

  const [{ data: rows }, liveMarketplaceEnabled] = await Promise.all([
    supabase
      .from('cart_items')
      .select('id, quantity, product:products(id, name, price, unit, unit_detail, img_bg, image_url, farm:farms(name, avatar_bg, logo_url))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    getLiveMarketplaceEnabled(),
  ])

  const items = (rows || [])
    .filter(r => r.product)
    .map(r => ({
      id: r.id,
      name: r.product.name,
      price: r.product.price,
      qty: r.quantity,
      meta: r.product.unit_detail || r.product.unit,
      farm: r.product.farm?.name || 'Unknown farm',
      bg: r.product.img_bg,
      imageUrl: r.product.image_url,
      farmLogoUrl: r.product.farm?.logo_url,
    }))

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-7 sm:py-9 pb-20">
      <h1 className="font-serif text-[28px] sm:text-[36px] font-semibold text-soil mb-1">Your Cart</h1>
      <p className="text-[14px] text-stone mb-8">All producers in one delivery.</p>
      {!liveMarketplaceEnabled && (
        <div className="bg-linen border border-[#ECEAE4] rounded-xl px-5 py-4 mb-6 text-[13px] text-stone">
          Grano's marketplace is temporarily paused while payments are being set up — you can't place an order right now.
        </div>
      )}
      <CartClient initialItems={items} liveMarketplaceEnabled={liveMarketplaceEnabled} />
    </div>
  )
}
