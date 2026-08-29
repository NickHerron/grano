'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Manage controls for one relationship row, rendered under its LocalNetworkCard in
// the dashboard (never shown on the public profile). `role` is 'initiator' or
// 'target' — the target of a still-pending invitation gets Accept/Decline instead of
// the usual edit controls, matching what the update trigger actually allows each side
// to do.
export default function NetworkRelationshipActions({ relationship, role, farmId }) {
  const router = useRouter()
  const supabase = createClient()
  const [busy, setBusy] = useState(false)
  const [managingProducts, setManagingProducts] = useState(false)
  const [farmProducts, setFarmProducts] = useState(null)
  const [selectedProductIds, setSelectedProductIds] = useState(new Set(relationship.products.map(p => p.id)))
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  async function openManageProducts() {
    if (farmProducts === null && farmId) {
      const { data } = await supabase.from('products').select('id, name').eq('farm_id', farmId).order('name')
      setFarmProducts(data || [])
    }
    setManagingProducts(v => !v)
  }

  async function respond(status) {
    setBusy(true)
    await supabase.from('business_relationships').update({ status }).eq('id', relationship.id)
    setBusy(false)
    router.refresh()
  }

  async function toggleVisibility() {
    setBusy(true)
    const next = relationship.visibility === 'public' ? 'private' : 'public'
    await supabase.from('business_relationships').update({ visibility: next }).eq('id', relationship.id)
    setBusy(false)
    router.refresh()
  }

  async function remove() {
    setBusy(true)
    await supabase.from('business_relationships').delete().eq('id', relationship.id)
    setBusy(false)
    router.refresh()
  }

  async function saveProducts() {
    setBusy(true)
    const current = new Set(relationship.products.map(p => p.id))
    const toAdd = [...selectedProductIds].filter(id => !current.has(id))
    const toRemove = [...current].filter(id => !selectedProductIds.has(id))
    if (toAdd.length) {
      await supabase.from('business_relationship_products').insert(toAdd.map(product_id => ({ relationship_id: relationship.id, product_id })))
    }
    if (toRemove.length) {
      await supabase.from('business_relationship_products').delete().eq('relationship_id', relationship.id).in('product_id', toRemove)
    }
    setBusy(false)
    setManagingProducts(false)
    router.refresh()
  }

  function toggleProduct(id) {
    setSelectedProductIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (relationship.status === 'pending' && role === 'target') {
    return (
      <div className="flex items-center gap-2 pt-1">
        <button onClick={() => respond('accepted')} disabled={busy}
          className="text-[12px] font-semibold text-white bg-sage px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
          Accept
        </button>
        <button onClick={() => respond('declined')} disabled={busy}
          className="text-[12px] font-semibold text-stone bg-linen px-3 py-1.5 rounded-lg hover:bg-[#E4E0D5] transition-colors disabled:opacity-50">
          Decline
        </button>
      </div>
    )
  }

  if (relationship.status === 'pending' && role === 'initiator') {
    return (
      <div className="flex items-center gap-2 pt-1">
        <span className="text-[11px] font-semibold text-stone uppercase tracking-wide">Awaiting response</span>
        {confirmingRemove ? (
          <span className="inline-flex gap-1.5 items-center">
            <button onClick={remove} disabled={busy} className="text-[11px] font-semibold text-white bg-rust px-2 py-1 rounded-md disabled:opacity-60">Confirm</button>
            <button onClick={() => setConfirmingRemove(false)} className="text-[11px] text-stone">Cancel</button>
          </span>
        ) : (
          <button onClick={() => setConfirmingRemove(true)} className="text-[11px] text-[#C0A090] hover:text-rust transition-colors">Cancel invitation</button>
        )}
      </div>
    )
  }

  if (relationship.status === 'declined') {
    return <span className="text-[11px] font-semibold text-stone uppercase tracking-wide">Declined</span>
  }

  // accepted
  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className="flex items-center gap-2 flex-wrap">
        {farmId && (
          <button onClick={openManageProducts} className="text-[11px] font-semibold text-soil bg-linen px-2.5 py-1 rounded-md hover:bg-[#E4E0D5] transition-colors">
            Manage Products
          </button>
        )}
        <button onClick={toggleVisibility} disabled={busy}
          className="text-[11px] font-semibold text-soil bg-linen px-2.5 py-1 rounded-md hover:bg-[#E4E0D5] transition-colors disabled:opacity-50">
          {relationship.visibility === 'public' ? 'Public' : 'Private'}
        </button>
        {confirmingRemove ? (
          <span className="inline-flex gap-1.5 items-center">
            <button onClick={remove} disabled={busy} className="text-[11px] font-semibold text-white bg-rust px-2 py-1 rounded-md disabled:opacity-60">Confirm</button>
            <button onClick={() => setConfirmingRemove(false)} className="text-[11px] text-stone">Cancel</button>
          </span>
        ) : (
          <button onClick={() => setConfirmingRemove(true)} className="text-[11px] font-semibold text-rust bg-white border border-[#ECEAE4] px-2.5 py-1 rounded-md hover:border-rust transition-colors">
            Remove
          </button>
        )}
      </div>

      {managingProducts && (
        <div className="bg-linen rounded-lg p-3 flex flex-col gap-2">
          {farmProducts === null && <p className="text-[12px] text-stone">Loading…</p>}
          {(farmProducts || []).map(p => (
            <label key={p.id} className="flex items-center gap-2 text-[12px] text-soil cursor-pointer">
              <input type="checkbox" checked={selectedProductIds.has(p.id)} onChange={() => toggleProduct(p.id)} className="w-3.5 h-3.5 accent-rust" />
              {p.name}
            </label>
          ))}
          <button onClick={saveProducts} disabled={busy}
            className="self-start text-[11px] font-semibold text-white bg-rust px-3 py-1.5 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-50 mt-1">
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
