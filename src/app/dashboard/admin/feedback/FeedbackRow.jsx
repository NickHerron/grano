'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_LABELS, PRIORITY_LABELS } from '@/lib/feedbackLabels'
import { formatDate } from '@/lib/formatDate'
import FeedbackStatusSelect from './FeedbackStatusSelect'

const PRIORITY_COLORS = {
  blocking: 'bg-rust text-white',
  really_important: 'bg-[#FDF0E8] text-rust',
  important: 'bg-[#FDF0E8] text-rust',
  nice_to_have: 'bg-linen text-stone',
}

// Admin_notes (private, never shown to the submitter) and admin_response (shown to the
// submitter in "My Feedback," see FeedbackHistory.jsx) are two separate fields, saved
// together — same "notes + save" shape as DocumentReviewControl.jsx, one text area per
// field instead of one, since these serve different audiences.
export default function FeedbackRow({ row }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [response, setResponse] = useState(row.admin_response || '')
  const [notes, setNotes] = useState(row.admin_notes || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [attachmentUrl, setAttachmentUrl] = useState(null)
  const [loadingAttachment, setLoadingAttachment] = useState(false)

  async function saveNotes() {
    setSaving(true)
    setSaved(false)
    await supabase.from('feedback_submissions').update({ admin_response: response || null, admin_notes: notes || null }).eq('id', row.id)
    setSaving(false)
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2500)
  }

  async function viewAttachment() {
    if (!row.attachment_path) return
    setLoadingAttachment(true)
    const { data } = await supabase.storage.from('feedback-attachments').createSignedUrl(row.attachment_path, 120)
    setLoadingAttachment(false)
    if (data?.signedUrl) setAttachmentUrl(data.signedUrl)
  }

  return (
    <div className="border-b border-[#F0EDE7] last:border-0">
      <button onClick={() => setOpen(o => !o)} className="w-full text-left px-5 py-3.5 flex items-start justify-between gap-4 hover:bg-[#FAFAF8] transition-colors">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-linen text-stone">
              {CATEGORY_LABELS[row.category] || row.category}
            </span>
            {row.feature && <span className="text-[11px] text-stone">{row.feature}</span>}
            {row.priority && (
              <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${PRIORITY_COLORS[row.priority] || 'bg-linen text-stone'}`}>
                {PRIORITY_LABELS[row.priority]}
              </span>
            )}
            {row.attachment_path && <span className="text-[11px] text-stone">📎</span>}
          </div>
          <p className={`text-[13px] text-soil ${open ? '' : 'truncate'}`}>{row.message}</p>
          <div className="text-[11px] text-stone mt-1">
            {row.sender_name || 'Unknown'} · {[row.account_type, row.business_type].filter(Boolean).join(' · ') || '—'} · {formatDate(row.created_at, { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
          <FeedbackStatusSelect feedbackId={row.id} status={row.status} />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 flex flex-col gap-3">
          <div className="text-[11px] text-stone">
            Page: {row.page_path || '—'}{row.onboarding_step ? ` (onboarding: ${row.onboarding_step})` : ''} · Device: {row.device_type || '—'}
          </div>

          {row.attachment_path && (
            <div>
              {attachmentUrl ? (
                <a href={attachmentUrl} target="_blank" rel="noreferrer" className="text-[12px] font-semibold text-rust hover:underline">Open attachment →</a>
              ) : (
                <button onClick={viewAttachment} disabled={loadingAttachment} className="text-[12px] font-semibold text-rust hover:underline disabled:opacity-50">
                  {loadingAttachment ? 'Loading…' : 'View attachment'}
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-stone">Response (shown to the sender in their My Feedback history)</label>
            <textarea value={response} onChange={e => setResponse(e.target.value)} rows={2}
              className="bg-linen border border-transparent rounded-md px-2.5 py-1.5 text-[12px] text-soil outline-none focus:border-wheat resize-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-stone">Internal notes (private, admin-only)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="bg-linen border border-transparent rounded-md px-2.5 py-1.5 text-[12px] text-soil outline-none focus:border-wheat resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={saveNotes} disabled={saving}
              className="self-start text-[12px] font-semibold text-white bg-rust px-4 py-1.5 rounded-md hover:bg-[#A8521F] transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            {saved && <span className="text-[12px] font-semibold text-sage">Saved.</span>}
          </div>
        </div>
      )}
    </div>
  )
}
