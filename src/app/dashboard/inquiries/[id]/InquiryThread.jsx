'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/formatDate'

// The conversation for this inquiry — plain `messages` rows scoped by inquiry_id, not
// a separate thread store. Authorized by messages_insert_inquiry_participant, which
// only requires being a participant on the inquiry itself.
export default function InquiryThread({ inquiryId, recipientOwnerId, senderId, messages, currentUserId, isRecipientSide, status }) {
  const router = useRouter()
  const supabase = createClient()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    if (!text.trim()) return
    setSending(true)
    setError('')

    const { error: insertError } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      inquiry_id: inquiryId,
      recipient_id: currentUserId === senderId ? recipientOwnerId : senderId,
      text: text.trim(),
    })
    if (insertError) {
      setSending(false)
      setError(insertError.message)
      return
    }

    // A recipient's first reply moves the inquiry out of "new" — the same unread/read
    // distinction the rest of the app already uses, just applied to status.
    if (isRecipientSide && status === 'new') {
      await supabase.from('work_inquiries').update({ status: 'responded' }).eq('id', inquiryId)
    }

    setSending(false)
    setText('')
    router.refresh()
  }

  return (
    <div>
      <div className="text-[12px] font-semibold uppercase tracking-wide text-stone mb-3">Conversation</div>
      <div className="flex flex-col gap-3 mb-4">
        {messages.map(m => {
          const isOwn = m.sender_id === currentUserId
          return (
            <div key={m.id} className={`border rounded-xl p-4 ${isOwn ? 'bg-linen border-transparent ml-8' : 'bg-white border-[#ECEAE4]'}`}>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="text-[13px] font-semibold text-soil">
                  {isOwn ? 'You' : (m.sender?.restaurant_name || m.sender?.full_name || 'Them')}
                </div>
                <div className="text-[11px] text-stone">{formatDate(m.created_at, { month: 'short', day: 'numeric' })}</div>
              </div>
              <p className="text-[13px] text-stone leading-relaxed">{m.text}</p>
            </div>
          )
        })}
      </div>

      {status !== 'closed' && (
        <div className="flex flex-col gap-2">
          <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
            placeholder="Write a reply…"
            className="bg-linen border border-transparent rounded-lg px-3 py-2.5 text-[13px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors resize-none" />
          {error && <p className="text-[12px] text-rust">{error}</p>}
          <button onClick={handleSend} disabled={sending || !text.trim()}
            className="self-start text-[12px] font-semibold text-white bg-rust px-3.5 py-2 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-50">
            {sending ? 'Sending…' : 'Send Reply'}
          </button>
        </div>
      )}
    </div>
  )
}
