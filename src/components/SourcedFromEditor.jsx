'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { hydrateProductSources } from '@/lib/productSources'
import BusinessSearchField from '@/components/BusinessSearchField'
import RelationshipTermsForm from '@/components/RelationshipTermsForm'

// Self-contained — fetches its own data and saves itself, same pattern as
// LocationsManager/WorkOptionsManager, so it can be dropped into both the product
// edit page and the onboarding wizard's Products step without either one wiring up
// its data-fetch. Only needs a product that already has an id (a brand-new,
// not-yet-saved product has nothing to attach a source to yet).
export default function SourcedFromEditor({ productId, farmId, farmName }) {
  const supabase = createClient()
  const [sources, setSources] = useState(null) // null = still loading
  const [userId, setUserId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [sourceProducts, setSourceProducts] = useState([])
  const [sourceProductId, setSourceProductId] = useState('')
  const [ingredientLabel, setIngredientLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Set right after saving a source with no existing Local Network connection to that
  // business — an optional, dismissible offer, never automatic. See RelationshipTermsForm.
  const [networkPromptFor, setNetworkPromptFor] = useState(null)

  async function load() {
    const [{ data }, { data: { user } }] = await Promise.all([
      supabase.from('product_sources').select('*').eq('product_id', productId).order('sort_order', { ascending: true }),
      supabase.auth.getUser(),
    ])
    setSources(await hydrateProductSources(supabase, data || []))
    setUserId(user?.id || null)
  }

  useEffect(() => { load() }, [productId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function selectBusiness(b) {
    setSelectedBusiness(b)
    setSourceProductId('')
    if (b.type === 'farm') {
      const { data } = await supabase.from('products').select('id, name').eq('farm_id', b.id).order('name')
      setSourceProducts(data || [])
    } else {
      setSourceProducts([])
    }
  }

  function resetForm() {
    setAdding(false)
    setSelectedBusiness(null)
    setSourceProducts([])
    setSourceProductId('')
    setIngredientLabel('')
    setError('')
  }

  async function handleSave() {
    if (!selectedBusiness) return
    setSaving(true)
    setError('')
    const { error: dbError } = await supabase.from('product_sources').insert({
      product_id: productId,
      source_type: selectedBusiness.type,
      source_id: selectedBusiness.id,
      source_product_id: sourceProductId || null,
      ingredient_label: ingredientLabel.trim() || null,
      created_by: userId,
      sort_order: sources?.length || 0,
    })
    setSaving(false)
    if (dbError) { setError(dbError.message); return }

    // Never automatic — just check whether a Local Network connection already exists,
    // and if not, offer (don't force) creating one.
    const { data: existing } = await supabase
      .from('business_relationships')
      .select('id')
      .or(`and(initiator_type.eq.farm,initiator_id.eq.${farmId},target_type.eq.${selectedBusiness.type},target_id.eq.${selectedBusiness.id}),and(initiator_type.eq.${selectedBusiness.type},initiator_id.eq.${selectedBusiness.id},target_type.eq.farm,target_id.eq.${farmId})`)
      .maybeSingle()
    if (!existing) setNetworkPromptFor(selectedBusiness)

    resetForm()
    load()
  }

  async function handleDelete(id) {
    setSources(sources.filter(s => s.id !== id))
    await supabase.from('product_sources').delete().eq('id', id)
  }

  if (sources === null) return null

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[13px] font-semibold text-soil">Sourced From</div>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[12px] font-semibold text-rust hover:underline">
            + Add a source
          </button>
        )}
      </div>
      <p className="text-[12px] text-stone mb-3">Credit another business for an ingredient in this product — shown publicly on the product page.</p>

      {sources.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {sources.map(s => (
            <div key={s.id} className="flex items-center justify-between gap-3 bg-linen rounded-lg px-3 py-2.5">
              <div className="text-[13px] text-soil min-w-0">
                {s.ingredient_label && <span className="font-semibold">{s.ingredient_label} · </span>}
                {s.sourceBusiness.name}
                {s.sourceProduct && ` · ${s.sourceProduct.name}`}
              </div>
              <button type="button" onClick={() => handleDelete(s.id)} className="text-[11px] text-[#C0A090] hover:text-rust transition-colors flex-shrink-0">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="bg-linen rounded-lg p-4 flex flex-col gap-3">
          {!selectedBusiness ? (
            <BusinessSearchField excludeType="farm" excludeId={farmId} onSelect={selectBusiness} placeholder="Who supplies this ingredient?" />
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[13px] font-semibold text-soil">{selectedBusiness.name}</div>
                <button type="button" onClick={() => setSelectedBusiness(null)} className="text-[11px] text-rust hover:underline flex-shrink-0">Change</button>
              </div>
              {sourceProducts.length > 0 && (
                <select value={sourceProductId} onChange={e => setSourceProductId(e.target.value)}
                  className="bg-white border border-[#ECEAE4] rounded-lg px-3 py-2.5 text-[13px] text-soil outline-none focus:border-wheat transition-colors">
                  <option value="">Which of their products? (optional)</option>
                  {sourceProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
              <input value={ingredientLabel} onChange={e => setIngredientLabel(e.target.value)}
                placeholder='Ingredient — e.g. "flour" (optional)'
                className="bg-white border border-[#ECEAE4] rounded-lg px-3 py-2.5 text-[13px] text-soil outline-none focus:border-wheat transition-colors" />
              {error && <p className="text-[12px] text-rust">{error}</p>}
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleSave} disabled={saving}
                  className="text-[12px] font-semibold text-white bg-rust px-4 py-2 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save source'}
                </button>
                <button type="button" onClick={resetForm} className="text-[12px] text-stone hover:text-soil transition-colors">Cancel</button>
              </div>
            </>
          )}
          {!selectedBusiness && (
            <button type="button" onClick={resetForm} className="self-start text-[12px] text-stone hover:text-soil transition-colors">Cancel</button>
          )}
        </div>
      )}

      {networkPromptFor && (
        <div className="mt-4 bg-[#FBF7EE] border-l-[3px] border-wheat rounded-r-lg p-4">
          <div className="text-[13px] font-semibold text-soil mb-2">Add {networkPromptFor.name} to your Local Network?</div>
          <RelationshipTermsForm
            myBusiness={{ type: 'farm', id: farmId, name: farmName, userId }}
            otherBusiness={networkPromptFor}
            initialRelationshipType="source_from"
            submitLabel="Send Invitation"
            onDone={() => setNetworkPromptFor(null)}
          />
          <button type="button" onClick={() => setNetworkPromptFor(null)} className="text-[11px] text-stone hover:text-soil transition-colors mt-2">
            Not now
          </button>
        </div>
      )}
    </div>
  )
}
