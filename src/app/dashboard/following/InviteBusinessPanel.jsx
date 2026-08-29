'use client'
import { useState } from 'react'

// For when the business you want to connect with isn't on Grano yet — generates a
// personal invite link (no account or DB record needed for this, it's just a signup
// link with the inviter's name attached for a warm landing) and three ways to send
// it: email, text message, or copy for pasting into an Instagram DM.
export default function InviteBusinessPanel({ initialName, myBusinessName, onDone }) {
  const [businessName, setBusinessName] = useState(initialName || '')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  const link = typeof window !== 'undefined'
    ? `${window.location.origin}/signup?invited_by_name=${encodeURIComponent(myBusinessName)}`
    : ''

  const message = `Hey${businessName ? ` ${businessName}` : ''}! I'd love to add you to ${myBusinessName}'s local network on Grano — it's a free platform for Chicago-area food businesses to show who they source from and supply. Join here: ${link}`

  async function handleCopy() {
    setCopyError(false)
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission denied/unsupported (older browser, blocked permission,
      // non-HTTPS context) — fall back to a manual select-and-copy instead of
      // silently doing nothing.
      setCopyError(true)
    }
  }

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl p-5 flex flex-col gap-4">
      <div>
        <div className="text-[14px] font-semibold text-soil mb-1">Invite a business to Grano</div>
        <p className="text-[12px] text-stone">Not on Grano yet? Send them a link — once they join, you can add them to your network.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Business name (optional)</label>
        <input value={businessName} onChange={e => setBusinessName(e.target.value)}
          placeholder="e.g. Midwest Farm"
          className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors w-full" />
      </div>

      <textarea readOnly value={message} rows={4}
        onFocus={e => e.target.select()}
        className="bg-linen rounded-lg p-3 text-[13px] text-stone leading-relaxed resize-none border border-transparent focus:border-wheat outline-none" />

      <div className="flex items-center gap-2 flex-wrap">
        <a href={`mailto:?subject=${encodeURIComponent('Join me on Grano')}&body=${encodeURIComponent(message)}`}
          className="text-[13px] font-semibold text-soil bg-linen px-4 py-2 rounded-lg hover:bg-[#E4E0D5] transition-colors">
          Email →
        </a>
        <a href={`sms:?&body=${encodeURIComponent(message)}`}
          className="text-[13px] font-semibold text-soil bg-linen px-4 py-2 rounded-lg hover:bg-[#E4E0D5] transition-colors">
          Text Message →
        </a>
        <button type="button" onClick={handleCopy}
          className="text-[13px] font-semibold text-white bg-rust px-4 py-2 rounded-lg hover:bg-[#A8521F] transition-colors">
          {copied ? '✓ Copied' : 'Copy for Instagram DM →'}
        </button>
      </div>
      {copyError && (
        <p className="text-[12px] text-rust">
          Couldn't copy automatically — click the message above to select it, then copy manually (⌘/Ctrl+C).
        </p>
      )}

      <button type="button" onClick={onDone} className="self-start text-[12px] font-medium text-stone hover:text-soil transition-colors">
        Done
      </button>
    </div>
  )
}
