// Client-side cart helpers — called from client components with a browser supabase client.
// Cart is real and persisted per account; there's no checkout/payment wired up yet.

export async function addToCart(supabase, productId, qty = 1) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { needsLogin: true }

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from('cart_items').update({ quantity: existing.quantity + qty }).eq('id', existing.id)
    : await supabase.from('cart_items').insert({ user_id: user.id, product_id: productId, quantity: qty })

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateCartQty(supabase, cartItemId, quantity) {
  if (quantity < 1) return removeFromCart(supabase, cartItemId)
  const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function removeFromCart(supabase, cartItemId) {
  const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId)
  if (error) return { error: error.message }
  return { success: true }
}
