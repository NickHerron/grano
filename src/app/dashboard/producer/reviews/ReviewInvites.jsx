'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inputClass = "bg-linen border border-transparent rounded-lg px-3 py-2.5 text-[13px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors w-full"

export default function ReviewInvites({ farmId, slug, initialInvites }) {
  const router = useRouter()
  const supabase = createClient()
  const [invites, setInvites] = useState(initialInvites)
  const [form, setForm] = useState({ customer_name: '', customer_email: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copiedToken, setCopiedToken] = useState(null)

  function update(key, value) { setForm(f => ({ ...f, [key]: value })) }

  function linkFor(token) {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/producers/${slug}/review/${token}`
  }

  async function copyLink(token) {
    try {
      await navigator.clipboard.writeText(linkFor(token))
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 1800)
    } catch {
      // clipboard unavailable — no-op
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.customer_name.trim()) return
    setSaving(true)
    setError('')
    const { data: row, error: dbError } = await supabase
      .from('review_invites')
      .insert({
        farm_id: farmId,
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim() || null,
        note: form.note.trim() || null,
      })
      .select()
      .single()
    setSaving(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    setInvites([row, ...invites])
    setForm({ customer_name: '', customer_email: '', note: '' })
    router.refresh()
  }

  async function handleRevoke(id) {
    setInvites(invites.map(i => i.id === id ? { ...i, status: 'revoked' } : i))
    await supabase.from('review_invites').update({ status: 'revoked' }).eq('id', id)
    router.refresh()
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="bg-white border border-[#ECEAE4] rounded-xl p-5 mb-6 flex flex-col gap-3">
        <div className="text-[13px] font-semibold text-soil">Send a review link</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input required className={inputClass} value={form.customer_name} onChange={e => update('customer_name', e.target.value)} placeholder="Customer name" />
          <input type="email" className={inputClass} value={form.customer_email} onChange={e => update('customer_email', e.target.value)} placeholder="Email (optional, for your records)" />
        </div>
        <input className={inputClass} value={form.note} onChange={e => update('note', e.target.value)} placeholder="Note to yourself (optional) — e.g. Sat 8/2 farmers market" />
        {error && <p className="text-[12px] text-rust">{error}</p>}
        <button type="submit" disabled={saving} className="self-start bg-rust text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-60">
          {saving ? 'Creating…' : '+ Create Review Link'}
        </button>
      </form>

      {invites.length ? (
        <div className="flex flex-col gap-2.5">
          {invites.map(inv => (
            <div key={inv.id} className="bg-white border border-[#ECEAE4] rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[14px] font-semibold text-soil">{inv.customer_name}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${
                    inv.status === 'used' ? 'bg-[#EBF3EC] text-sage' : inv.status === 'revoked' ? 'bg-[#F0EDE7] text-stone' : 'bg-[#FDF0E8] text-rust'
                  }`}>{inv.status}</span>
                </div>
                {inv.note && <div className="text-[12px] text-stone truncate">{inv.note}</div>}
              </div>
              {inv.status === 'pending' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => copyLink(inv.token)} className="text-[12px] font-semibold text-soil bg-linen px-3 py-1.5 rounded-lg hover:bg-[#E4E0D5] transition-colors whitespace-nowrap">
                    {copiedToken === inv.token ? 'Copied ✓' : 'Copy Link'}
                  </button>
                  <button onClick={() => handleRevoke(inv.id)} className="text-[11px] text-[#C0A090] hover:text-rust transition-colors">Revoke</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-10 text-center">
          <p className="text-[14px] text-stone">No review links sent yet.</p>
        </div>
      )}
    </div>
  )
}
