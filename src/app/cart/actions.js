'use server'
import { createClient } from '@/lib/supabase/server'
import { getLiveMarketplaceEnabled } from '@/lib/marketplace'

// Places a real order from the signed-in user's current cart. There's no payment
// processor wired up — this just records what was bought (so producers can see who
// their customers are, and so buyers can leave a verified review) and clears the cart.
export async function placeOrder() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to place an order.' }

  // The authoritative gate — the UI hides "Place Order" when the marketplace is
  // paused, but this is what actually stops it, in case someone has a stale page
  // open or hits this action directly.
  const liveMarketplaceEnabled = await getLiveMarketplaceEnabled()
  if (!liveMarketplaceEnabled) return { error: "Grano's marketplace is temporarily paused while payments are being set up — check back soon." }

  const { data: rows, error: cartError } = await supabase
    .from('cart_items')
    .select('id, quantity, product:products(id, name, price, farm_id)')
    .eq('user_id', user.id)

  if (cartError) return { error: cartError.message }
  const items = (rows || []).filter(r => r.product)
  if (!items.length) return { error: 'Your cart is empty.' }

  const subtotal = items.reduce((s, r) => s + r.product.price * r.quantity, 0)
  const delivery = 8
  const serviceFee = Math.round(subtotal * 0.05 * 100) / 100
  const total = subtotal + delivery + serviceFee

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ buyer_id: user.id, subtotal, delivery_fee: delivery, service_fee: serviceFee, total })
    .select('id')
    .single()

  if (orderError) return { error: orderError.message }

  for (const r of items) {
    const { error: itemError } = await supabase.from('order_items').insert({
      order_id: order.id,
      farm_id: r.product.farm_id,
      product_id: r.product.id,
      product_name: r.product.name,
      price: r.product.price,
      quantity: r.quantity,
    })
    if (itemError) return { error: itemError.message }
  }

  await supabase.from('cart_items').delete().eq('user_id', user.id)

  return { success: true, orderId: order.id }
}
