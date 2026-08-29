'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { addToCart } from '@/lib/cart'

export default function AddToCartButton({ productId, qty = 1, className, addedClassName, children, addedChildren, onClick }) {
  const router = useRouter()
  const supabase = createClient()
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick(e) {
    onClick?.(e)
    if (loading) return
    setLoading(true)
    setError('')
    const result = await addToCart(supabase, productId, qty)
    setLoading(false)

    if (result.needsLogin) {
      router.push('/login')
      return
    }
    if (result.error) {
      setError(result.error)
      setTimeout(() => setError(''), 3000)
      return
    }
    if (result.success) {
      setAdded(true)
      router.refresh()
      setTimeout(() => setAdded(false), 1400)
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} title={error || undefined}
      className={error ? 'px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white bg-rust' : (added ? addedClassName : className)}>
      {loading ? '…' : error ? 'Error' : added ? (addedChildren ?? '✓ Added') : (children ?? '+ Add')}
    </button>
  )
}
