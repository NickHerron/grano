'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FREQUENCY_OPTIONS, DELIVERY_OPTIONS, seasonRangeLabel } from '@/lib/sourcingOptions'

const inputClass = "bg-linen border border-transparent rounded-lg px-3 py-2.5 text-[13px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors w-full"
const empty = {
  product_name: '', category: '', quantity: '', frequency: 'weekly',
  season_start_month: '', season_end_month: '', preferred_location: '', budget_target: '',
  wholesale_only: true, organic_preference: false, delivery_preference: 'either', notes: '',
}

// ownerType/ownerId — genericized from a restaurant-only "restaurantId" prop so any
// business type can post a sourcing need, not just restaurants (schema_wholesale_
// polymorphic_sourcing.sql). Mounted from the restaurant dashboard's Sourcing tab and,
// as of the wholesale capability rework, the producer onboarding wizard + dashboard.
export default function SourcingRequestsManager({ ownerType, ownerId, initialRequests }) {
  const router = useRouter()
  const supabase = createClient()
  const [requests, setRequests] = useState(initialRequests)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(key, value) { setForm(f => ({ ...f, [key]: value })) }

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      owner_type: ownerType,
      owner_id: ownerId,
      ...form,
      season_start_month: form.season_start_month ? Number(form.season_start_month) : null,
      season_end_month: form.season_end_month ? Number(form.season_end_month) : null,
    }

    const { data: row, error: dbError } = await supabase.from('sourcing_requests').insert(payload).select().single()
    setSaving(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    setRequests([row, ...requests])
    setForm(empty)
    router.refresh()
  }

  async function handleStatus(id, status) {
    setRequests(requests.map(r => r.id === id ? { ...r, status } : r))
    await supabase.from('sourcing_requests').update({ status }).eq('id', id)
    router.refresh()
  }

  async function handleDelete(id) {
    setRequests(requests.filter(r => r.id !== id))
    await supabase.from('sourcing_requests').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="bg-white border border-[#ECEAE4] rounded-xl p-5 mb-6 flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input required className={inputClass} value={form.product_name} onChange={e => update('product_name', e.target.value)} placeholder="Product — e.g. Heirloom tomatoes" />
          <input className={inputClass} value={form.category} onChange={e => update('category', e.target.value)} placeholder="Category — e.g. Produce" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className={inputClass} value={form.quantity} onChange={e => update('quantity', e.target.value)} placeholder="Quantity — e.g. 50 lbs" />
          <select className={inputClass} value={form.frequency} onChange={e => update('frequency', e.target.value)}>
            {FREQUENCY_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select className={inputClass} value={form.season_start_month} onChange={e => update('season_start_month', e.target.value)}>
            <option value="">Season start (optional)</option>
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className={inputClass} value={form.season_end_month} onChange={e => update('season_end_month', e.target.value)}>
            <option value="">Season end (optional)</option>
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className={inputClass} value={form.preferred_location} onChange={e => update('preferred_location', e.target.value)} placeholder="Preferred location — e.g. Chicago / Illinois" />
          <input className={inputClass} value={form.budget_target} onChange={e => update('budget_target', e.target.value)} placeholder="Budget / target price — e.g. $3-4/lb" />
        </div>
        <select className={inputClass} value={form.delivery_preference} onChange={e => update('delivery_preference', e.target.value)}>
          {DELIVERY_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-[13px] text-stone cursor-pointer">
            <input type="checkbox" checked={form.wholesale_only} onChange={e => update('wholesale_only', e.target.checked)} className="w-4 h-4 accent-rust" />
            Wholesale only
          </label>
          <label className="flex items-center gap-2 text-[13px] text-stone cursor-pointer">
            <input type="checkbox" checked={form.organic_preference} onChange={e => update('organic_preference', e.target.checked)} className="w-4 h-4 accent-rust" />
            Prefer organic
          </label>
        </div>
        <textarea className={inputClass + ' resize-none h-16'} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Notes (optional)" />
        {error && <p className="text-[12px] text-rust">{error}</p>}
        <button type="submit" disabled={saving} className="self-start bg-rust text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-60">
          {saving ? 'Adding…' : '+ Post What We\'re Looking For'}
        </button>
      </form>

      {requests.length ? (
        <div className="flex flex-col gap-3">
          {requests.map(r => (
            <div key={r.id} className="bg-white border border-[#ECEAE4] rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-serif text-[16px] font-semibold text-soil">{r.product_name}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${
                    r.status === 'open' ? 'bg-[#EBF3EC] text-sage' : r.status === 'fulfilled' ? 'bg-[#FDF0E8] text-rust' : 'bg-[#F0EDE7] text-stone'
                  }`}>{r.status}</span>
                </div>
                <div className="text-[12px] text-stone">
                  {[r.quantity, FREQUENCY_OPTIONS.find(([k]) => k === r.frequency)?.[1], seasonRangeLabel(r.season_start_month, r.season_end_month), r.budget_target].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {r.status === 'open' && (
                  <button onClick={() => handleStatus(r.id, 'fulfilled')} className="text-[11px] font-semibold text-sage hover:underline whitespace-nowrap">Mark fulfilled</button>
                )}
                <button onClick={() => handleDelete(r.id)} className="text-[11px] text-[#C0A090] hover:text-rust transition-colors">Remove</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
          <p className="text-[14px] text-stone">Nothing posted yet — tell producers what you're looking to source.</p>
        </div>
      )}
    </div>
  )
}
