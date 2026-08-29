'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ReplyForm({ message, farmId, onSent }) {
  const router = useRouter()
  const supabase = createClient()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    if (!text.trim()) return
    setSending(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: insertError } = await supabase.from('messages').insert({
      sender_id: user.id,
      farm_id: farmId,
      recipient_id: message.sender_id,
      text: text.trim(),
    })
    setSending(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setText('')
    onSent()
    router.refresh()
  }

  return (
    <div className="mt-3 pt-3 border-t border-[#ECEAE4] flex flex-col gap-2">
      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder="Write a reply…" rows={2}
        className="bg-linen border border-transparent rounded-lg px-3 py-2.5 text-[13px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors resize-none" />
      {error && <p className="text-[12px] text-rust">{error}</p>}
      <button onClick={handleSend} disabled={sending || !text.trim()}
        className="self-start text-[12px] font-semibold text-white bg-rust px-3 py-1.5 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-50">
        {sending ? 'Sending…' : 'Send Reply'}
      </button>
    </div>
  )
}

export default function MessagesContent({ farmId, farmName, currentUserId, messages }) {
  const [replyOpenId, setReplyOpenId] = useState(null)

  return (
    <div>
      <p className="text-[13px] text-stone mb-5">Direct messages to {farmName || 'your farm'}, plus open sourcing requests from any restaurant — reply to let them know what you've got.</p>

      {!messages?.length ? (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
          <p className="text-[14px] text-stone">No messages yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map(m => {
            const isOwnReply = m.sender_id === currentUserId
            return (
              <div key={m.id} className={`border rounded-xl p-5 ${isOwnReply ? 'bg-linen border-transparent ml-8' : 'bg-white border-[#ECEAE4]'}`}>
                <div className="flex items-start justify-between gap-4 mb-2.5">
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-soil truncate">
                      {isOwnReply ? 'You' : (m.sender?.restaurant_name || m.sender?.full_name || 'A restaurant')}
                    </div>
                    <div className="text-[11px] text-stone">{new Date(m.created_at).toLocaleDateString()}</div>
                  </div>
                  {!isOwnReply && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {!m.read_at && m.farm_id !== null && (
                        <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-rust text-white">New</span>
                      )}
                      {m.farm_id === null ? (
                        <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-[#FBF5E6] text-[#8A6B1C]">
                          Open request
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-[#EBF3EC] text-sage">
                          Direct
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[13px] text-stone leading-relaxed">{m.text}</p>

                {!isOwnReply && m.sender_id && (
                  replyOpenId === m.id ? (
                    <ReplyForm message={m} farmId={farmId} onSent={() => setReplyOpenId(null)} />
                  ) : (
                    <button onClick={() => setReplyOpenId(m.id)} className="mt-2 text-[12px] font-semibold text-rust hover:underline">
                      Reply →
                    </button>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
