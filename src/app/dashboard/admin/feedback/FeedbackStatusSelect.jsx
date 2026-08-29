'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { STATUS_LABELS } from '@/lib/feedbackLabels'

// Same direct-client-update pattern as VerificationSelect.jsx (../VerificationSelect.jsx)
// — is_admin() RLS already permits this write, so no server action is needed.
export default function FeedbackStatusSelect({ feedbackId, status }) {
  const router = useRouter()
  const supabase = createClient()
  const [value, setValue] = useState(status)
  const [saving, setSaving] = useState(false)

  async function handleChange(e) {
    const next = e.target.value
    setValue(next)
    setSaving(true)
    await supabase.from('feedback_submissions').update({ status: next }).eq('id', feedbackId)
    setSaving(false)
    router.refresh()
  }

  return (
    <select value={value} onChange={handleChange} disabled={saving} onClick={e => e.stopPropagation()}
      className="text-[11px] font-semibold bg-linen border border-transparent rounded-md px-2 py-1 outline-none focus:border-wheat disabled:opacity-50">
      {Object.entries(STATUS_LABELS).map(([k, label]) => (
        <option key={k} value={k}>{label}</option>
      ))}
    </select>
  )
}
