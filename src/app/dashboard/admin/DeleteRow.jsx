'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteRow({ table, id, confirmLabel = 'Delete' }) {
  const router = useRouter()
  const supabase = createClient()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await supabase.from(table).delete().eq('id', id)
    setLoading(false)
    router.refresh()
  }

  if (confirming) {
    return (
      <span className="inline-flex gap-1.5 items-center">
        <button onClick={handleDelete} disabled={loading}
          className="text-[12px] font-semibold text-white bg-rust px-2.5 py-1 rounded-md hover:bg-[#A8521F] transition-colors disabled:opacity-60">
          {loading ? '…' : 'Confirm'}
        </button>
        <button onClick={() => setConfirming(false)} className="text-[12px] text-stone px-1">Cancel</button>
      </span>
    )
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="text-[12px] font-semibold text-rust bg-white border border-[#ECEAE4] px-2.5 py-1 rounded-md hover:border-rust transition-colors">
      {confirmLabel}
    </button>
  )
}
