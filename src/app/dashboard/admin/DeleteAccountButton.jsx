'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAccount } from './actions'

export default function DeleteAccountButton({ userId, disabled }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (disabled) return null

  async function handleDelete() {
    setLoading(true)
    setError('')
    const result = await deleteAccount(userId)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <p className="text-[11px] text-rust text-right max-w-[160px] leading-snug">
          Permanently deletes their account, business profile, products, and orders.
        </p>
        <span className="inline-flex gap-1.5 items-center">
          <button onClick={handleDelete} disabled={loading}
            className="text-[12px] font-semibold text-white bg-rust px-2.5 py-1 rounded-md hover:bg-[#A8521F] transition-colors disabled:opacity-60">
            {loading ? '…' : 'Confirm Delete'}
          </button>
          <button onClick={() => setConfirming(false)} className="text-[12px] text-stone px-1">Cancel</button>
        </span>
        {error && <span className="text-[11px] text-rust">{error}</span>}
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="text-[12px] font-semibold text-rust bg-white border border-[#ECEAE4] px-2.5 py-1 rounded-md hover:border-rust transition-colors whitespace-nowrap">
      Delete Account
    </button>
  )
}
