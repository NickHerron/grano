'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteProductButton({ id, name }) {
  const router = useRouter()
  const supabase = createClient()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await supabase.from('products').delete().eq('id', id)
    setLoading(false)
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex gap-1.5 items-center">
        <span className="text-[12px] text-stone">Delete {name}?</span>
        <button onClick={handleDelete} disabled={loading}
          className="text-[13px] font-semibold text-white bg-rust px-3 py-2 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-60">
          {loading ? '…' : 'Yes'}
        </button>
        <button onClick={() => setConfirming(false)}
          className="text-[13px] font-medium text-stone px-2 py-2">
          No
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="text-[13px] font-semibold text-rust bg-white border border-[#ECEAE4] px-3.5 py-2 rounded-lg hover:border-rust transition-colors">
      Delete
    </button>
  )
}
