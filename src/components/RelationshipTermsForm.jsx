'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RELATIONSHIP_TYPES } from '@/lib/businessNetwork'

// The "how are you connected, which products, any notes" form for creating a
// business_relationships row — extracted out of AddBusinessPanel.jsx so the same
// form can also power the post-inquiry "Add to Our Local Network" prompt, instead of
// a second copy of this logic. Behavior-identical to what AddBusinessPanel had inline.
export default function RelationshipTermsForm({
  myBusiness, otherBusiness, initialRelationshipType = 'source_from',
  submitLabel = 'Send Invitation', onDone, onSuccess, onChangeBusiness,
}) {
  const router = useRouter()
  const supabase = createClient()
  const [relationshipType, setRelationshipType] = useState(initialRelationshipType)
  const [description, setDescription] = useState('')
  const [availableProducts, setAvailableProducts] = useState([])
  const [selectedProductIds, setSelectedProductIds] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Which business's catalog the product picker should show depends on the direction:
  // sourcing FROM them means picking from THEIR products; supplying THEM means
  // picking from OUR OWN products (and only if that side is actually a farm — a
  // restaurant has no product catalog to pick from either way).
  useEffect(() => {
    if (!otherBusiness) {
      setAvailableProducts([])
      return
    }
    let farmId = null
    if (relationshipType === 'source_from' && otherBusiness.type === 'farm') farmId = otherBusiness.id
    else if (relationshipType === 'supplies_to' && myBusiness.type === 'farm') farmId = myBusiness.id
    else if (relationshipType === 'collaboration') {
      // No fixed direction for a collaboration — feature whichever side actually has
      // a product catalog, preferring theirs (e.g. a chef featuring a farm's produce
      // in a joint event) and falling back to ours.
      if (otherBusiness.type === 'farm') farmId = otherBusiness.id
      else if (myBusiness.type === 'farm') farmId = myBusiness.id
    }

    setSelectedProductIds(new Set())
    if (!farmId) {
      setAvailableProducts([])
      return
    }
    supabase.from('products').select('id, name').eq('farm_id', farmId).order('name').then(({ data }) => {
      setAvailableProducts(data || [])
    })
  }, [otherBusiness, relationshipType]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleProduct(id) {
    setSelectedProductIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data: relationship, error: insertError } = await supabase.from('business_relationships').insert({
      initiator_type: myBusiness.type,
      initiator_id: myBusiness.id,
      target_type: otherBusiness.type,
      target_id: otherBusiness.id,
      relationship_type: relationshipType,
      description: description.trim() || null,
      created_by: myBusiness.userId,
    }).select().single()

    if (insertError) {
      setSaving(false)
      setError(insertError.code === '23505' ? "You've already sent an invitation like this to this business." : insertError.message)
      return
    }

    if (selectedProductIds.size > 0) {
      const rows = [...selectedProductIds].map(product_id => ({ relationship_id: relationship.id, product_id }))
      await supabase.from('business_relationship_products').insert(rows)
    }

    setSaving(false)
    router.refresh()
    if (onSuccess) onSuccess(relationship)
    if (onDone) onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 bg-linen rounded-lg px-4 py-3">
        <div>
          <div className="text-[13px] font-semibold text-soil">{otherBusiness.name}</div>
          <div className="text-[11px] text-stone">{[otherBusiness.typeLabel, otherBusiness.location].filter(Boolean).join(' · ')}</div>
        </div>
        {onChangeBusiness && (
          <button type="button" onClick={onChangeBusiness} className="text-[12px] text-rust hover:underline flex-shrink-0">Change</button>
        )}
      </div>

      <div>
        <label className="text-[12px] font-semibold tracking-wide uppercase text-stone block mb-1.5">How are you connected?</label>
        <div className="flex flex-col gap-1.5">
          {RELATIONSHIP_TYPES.map(([key, label, description]) => (
            <label key={key} className={`flex flex-col gap-0.5 text-[13px] text-soil cursor-pointer rounded-lg px-3 py-2.5 border-[1.5px] transition-colors ${
              relationshipType === key ? 'bg-[#FDF0E8] border-rust' : 'bg-linen border-transparent'
            }`}>
              <span className="flex items-center gap-2">
                <input type="radio" name="relationshipType" checked={relationshipType === key} onChange={() => setRelationshipType(key)} className="w-4 h-4 accent-rust" />
                {label}
              </span>
              <span className="text-[11px] text-stone pl-6">{description}</span>
            </label>
          ))}
        </div>
      </div>

      {availableProducts.length > 0 && (
        <div>
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone block mb-1.5">Products (optional)</label>
          <div className="flex flex-col gap-1.5">
            {availableProducts.map(p => (
              <label key={p.id} className="flex items-center gap-2 text-[13px] text-soil cursor-pointer bg-linen rounded-lg px-3 py-2.5">
                <input type="checkbox" checked={selectedProductIds.has(p.id)} onChange={() => toggleProduct(p.id)} className="w-4 h-4 accent-rust" />
                {p.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-[12px] font-semibold tracking-wide uppercase text-stone block mb-1.5">Message (optional)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          placeholder="e.g. We use their flour in our sourdough bread."
          className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors w-full resize-none" />
      </div>

      {error && <p className="text-[12px] text-rust">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="bg-rust text-white text-[14px] font-bold px-6 py-3 rounded-xl hover:bg-[#A8521F] transition-colors disabled:opacity-60">
          {saving ? 'Sending…' : submitLabel}
        </button>
        {onDone && <button type="button" onClick={onDone} className="text-[13px] font-medium text-stone hover:text-soil transition-colors">Cancel</button>}
      </div>
    </form>
  )
}
