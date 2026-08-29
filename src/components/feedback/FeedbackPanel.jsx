'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { featureForPath } from '@/lib/featureMap'

// The form itself — deliberately presentation-only, no fixed/absolute positioning of
// its own, so the same component works both floating (FeedbackButton, every page) and
// inline (QuickPulse, embedded in a specific onboarding step or the publish screen).
// No AI anywhere: `category` is always the user's own quick-option pick, or 'other' if
// they skip straight to typing. USER -> GRANO only — never touches messages/
// work_inquiries, and nothing here is visible to any other business.

const QUICK_OPTIONS = [
  ['Something is confusing', 'confusing_ux'],
  ["I can't find something", 'confusing_ux'],
  ['I wish Grano could...', 'feature_request'],
  ["Something isn't working", 'bug'],
  ['I have an idea', 'suggestion'],
  ['I love something about Grano', 'positive'],
  ['Something else', 'other'],
]

const PRIORITY_OPTIONS = [
  ['Would be nice', 'nice_to_have'],
  ['Important', 'important'],
  ['Really important', 'really_important'],
  ['Blocking me', 'blocking'],
]

// Priority is only worth asking when the feedback describes a problem or gap — not for
// a suggestion, praise, or anything already routed to "other."
const PRIORITY_ELIGIBLE = new Set(['bug', 'confusing_ux', 'feature_request', 'missing_feature'])

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024 // 8MB — generous for a screenshot, small enough not to need chunked upload

function deviceType() {
  if (typeof window === 'undefined') return null
  return window.innerWidth < 768 ? 'mobile' : 'desktop'
}

export default function FeedbackPanel({ context, onClose, presetCategory = null }) {
  const supabase = createClient()
  const pathname = usePathname()
  const { feature, prompt, onboardingStep } = featureForPath(pathname)

  const [category, setCategory] = useState(presetCategory)
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState(null)
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  function pickQuickOption(label, cat) {
    setCategory(cat)
    if (!message) setMessage(label === 'Something else' ? '' : `${label} — `)
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    setFileError('')
    if (!f) { setFile(null); return }
    if (f.size > MAX_ATTACHMENT_BYTES) {
      setFileError('That image is too large — please pick one under 8MB.')
      setFile(null)
      return
    }
    setFile(f)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) { setError('Add a note before sending.'); return }
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); setError('Please sign in to send feedback.'); return }

    const { data: row, error: dbError } = await supabase.from('feedback_submissions').insert({
      user_id: user.id,
      category: category || 'other',
      message: message.trim(),
      priority,
      account_type: context?.accountType || null,
      business_kind: context?.businessKind || null,
      business_id: context?.businessId || null,
      business_type: context?.businessType || null,
      page_path: pathname,
      feature,
      onboarding_step: onboardingStep,
      device_type: deviceType(),
    }).select().single()

    if (dbError) {
      setSaving(false)
      setError(dbError.message)
      return
    }

    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('feedback-attachments').upload(path, file)
      if (!uploadError) {
        await supabase.from('feedback_attachments').insert({ feedback_id: row.id, storage_path: path })
      }
      // A failed attachment upload doesn't block the feedback itself from being sent —
      // the note already saved successfully.
    }

    setSaving(false)
    setSent(true)
  }

  function reset() {
    setCategory(null)
    setMessage('')
    setPriority(null)
    setFile(null)
    setFileError('')
    setError('')
    setSent(false)
  }

  if (sent) {
    return (
      <div className="p-5 text-center">
        <div className="text-[15px] font-semibold text-soil mb-1">Thanks for helping us improve Grano.</div>
        <p className="text-[13px] text-stone mb-5">Your feedback has been sent to the Grano team. We'll review it as we continue building Grano.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="text-[13px] font-semibold text-rust hover:underline">Tell us anything else?</button>
          {onClose && <button onClick={onClose} className="text-[13px] font-medium text-stone hover:text-soil transition-colors">Done</button>}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
      <div>
        <div className="text-[11px] font-semibold tracking-wide uppercase text-rust mb-1">Grano Feedback</div>
        <h3 className="font-serif text-[18px] font-semibold text-soil leading-tight mb-1">Help Improve Grano</h3>
        <p className="text-[12px] text-stone leading-relaxed">You're helping us build Grano. Tell us what's working, what's confusing, or what you wish Grano could do.</p>
      </div>

      <div>
        <div className="text-[13px] font-semibold text-soil mb-2">{prompt}</div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_OPTIONS.map(([label, cat]) => (
            <button key={label} type="button" onClick={() => pickQuickOption(label, cat)}
              className={`text-[12px] font-medium px-3 py-1.5 rounded-full border-[1.5px] transition-colors ${
                category === cat ? 'bg-[#FDF0E8] border-rust text-rust' : 'bg-linen border-transparent text-soil hover:border-wheat'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} autoFocus
        placeholder="Type your note here…"
        className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors w-full resize-none" />

      {PRIORITY_ELIGIBLE.has(category) && (
        <div>
          <div className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-1.5">How important is this to your experience? (optional)</div>
          <div className="flex flex-wrap gap-1.5">
            {PRIORITY_OPTIONS.map(([label, key]) => (
              <button key={key} type="button" onClick={() => setPriority(p => p === key ? null : key)}
                className={`text-[12px] font-medium px-3 py-1.5 rounded-full border-[1.5px] transition-colors ${
                  priority === key ? 'bg-[#FDF0E8] border-rust text-rust' : 'bg-linen border-transparent text-soil hover:border-wheat'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-[12px] font-semibold text-rust hover:underline cursor-pointer">
          {file ? `📎 ${file.name} — change` : 'Want to show us what you\'re seeing? Add an image'}
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
        {fileError && <p className="text-[11px] text-rust mt-1">{fileError}</p>}
      </div>

      {error && <p className="text-[12px] text-rust">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="bg-rust text-white text-[14px] font-bold px-6 py-2.5 rounded-xl hover:bg-[#A8521F] transition-colors disabled:opacity-60">
          {saving ? 'Sending…' : 'Send'}
        </button>
        {onClose && <button type="button" onClick={onClose} className="text-[13px] font-medium text-stone hover:text-soil transition-colors">Cancel</button>}
      </div>
    </form>
  )
}
