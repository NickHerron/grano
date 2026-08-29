'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Recipient drives the lifecycle (new -> in_discussion -> accepted/declined -> closed);
// the sender can only withdraw. The DB trigger (enforce_work_inquiry_update_rules)
// enforces this regardless of what buttons render here — this is just the UI for it.
export default function InquiryStatusActions({ inquiryId, status, isRecipientSide, isSenderSide }) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function setStatus(next) {
    setSaving(true)
    setError('')
    const { error: dbError } = await supabase.from('work_inquiries').update({ status: next }).eq('id', inquiryId)
    setSaving(false)
    if (dbError) { setError(dbError.message); return }
    router.refresh()
  }

  if (isRecipientSide && ['new', 'responded', 'in_discussion'].includes(status)) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button disabled={saving} onClick={() => setStatus('accepted')}
            className="text-[12px] font-semibold text-white bg-sage px-3.5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            Accept
          </button>
          <button disabled={saving} onClick={() => setStatus('declined')}
            className="text-[12px] font-semibold text-stone bg-linen px-3.5 py-2 rounded-lg hover:bg-[#E4E0D5] transition-colors disabled:opacity-50">
            Decline
          </button>
          {status === 'new' && (
            <button disabled={saving} onClick={() => setStatus('in_discussion')}
              className="text-[12px] font-semibold text-rust hover:underline">
              Mark as In Discussion
            </button>
          )}
        </div>
        {error && <p className="text-[12px] text-rust">{error}</p>}
      </div>
    )
  }

  if (isRecipientSide && ['accepted', 'declined'].includes(status)) {
    return (
      <div>
        <button disabled={saving} onClick={() => setStatus('closed')}
          className="text-[12px] font-semibold text-stone bg-linen px-3.5 py-2 rounded-lg hover:bg-[#E4E0D5] transition-colors disabled:opacity-50">
          Mark Closed
        </button>
        {error && <p className="text-[12px] text-rust mt-2">{error}</p>}
      </div>
    )
  }

  if (isSenderSide && !isRecipientSide && ['new', 'responded', 'in_discussion'].includes(status)) {
    return (
      <div>
        <button disabled={saving} onClick={() => setStatus('closed')}
          className="text-[12px] font-semibold text-[#C0A090] hover:text-rust transition-colors">
          Withdraw inquiry
        </button>
        {error && <p className="text-[12px] text-rust mt-2">{error}</p>}
      </div>
    )
  }

  return null
}
