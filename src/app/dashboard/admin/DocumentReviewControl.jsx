'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DocumentReviewControl({ documentId, status, adminNotes }) {
  const router = useRouter()
  const supabase = createClient()
  const [value, setValue] = useState(status)
  const [notes, setNotes] = useState(adminNotes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save(nextStatus) {
    setSaving(true)
    setError('')
    const payload = { status: nextStatus, admin_notes: notes || null }
    if (nextStatus === 'verified') {
      const { data: { user } } = await supabase.auth.getUser()
      payload.verified_at = new Date().toISOString()
      payload.verified_by = user?.id || null
    }
    const { error: dbError } = await supabase.from('documents').update(payload).eq('id', documentId)
    setSaving(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    setValue(nextStatus)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Note for the account (optional, shown to them if needs attention)"
        className="bg-linen border border-transparent rounded-md px-2.5 py-1.5 text-[12px] text-soil outline-none focus:border-wheat resize-none h-14" />
      <div className="flex items-center gap-2">
        <button disabled={saving || value === 'verified'} onClick={() => save('verified')}
          className="text-[11px] font-semibold text-white bg-sage px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50">
          Verify
        </button>
        <button disabled={saving} onClick={() => save('needs_attention')}
          className="text-[11px] font-semibold text-white bg-rust px-3 py-1.5 rounded-md hover:bg-[#A8521F] transition-colors disabled:opacity-50">
          Needs Attention
        </button>
        <button disabled={saving} onClick={() => save('under_review')}
          className="text-[11px] font-semibold text-stone bg-linen px-3 py-1.5 rounded-md hover:bg-[#E4E0D5] transition-colors disabled:opacity-50">
          Mark Under Review
        </button>
      </div>
      {error && <p className="text-[11px] text-rust">{error}</p>}
    </div>
  )
}
