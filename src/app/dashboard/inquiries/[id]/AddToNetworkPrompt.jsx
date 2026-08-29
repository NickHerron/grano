'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import RelationshipTermsForm from '@/components/RelationshipTermsForm'

// Shown on an accepted inquiry's detail page — "you just did business together, want
// to make it official?" Reuses the exact same form/insert as the Local Network "+ Add
// Business" flow (RelationshipTermsForm), not a second one. Never automatic: this
// still creates a normal pending business_relationships row that the other side has
// to accept, same as every other network invite.
export default function AddToNetworkPrompt({ inquiryId, myBusiness, otherBusiness, defaultRelationshipType }) {
  const supabase = createClient()
  const [checking, setChecking] = useState(true)
  const [existing, setExisting] = useState(null)
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      const { data } = await supabase.from('business_relationships').select('id, status')
        .or(
          `and(initiator_type.eq.${myBusiness.type},initiator_id.eq.${myBusiness.id},target_type.eq.${otherBusiness.type},target_id.eq.${otherBusiness.id}),` +
          `and(initiator_type.eq.${otherBusiness.type},initiator_id.eq.${otherBusiness.id},target_type.eq.${myBusiness.type},target_id.eq.${myBusiness.id})`
        )
        .maybeSingle()
      if (!cancelled) {
        setExisting(data)
        setChecking(false)
      }
    }
    check()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSuccess(relationship) {
    await supabase.from('work_inquiries').update({ resulting_relationship_id: relationship.id }).eq('id', inquiryId)
    setDone(true)
  }

  if (checking) return null

  if (existing || done) {
    return (
      <div className="bg-[#EBF3EC] border border-sage/30 rounded-xl p-4">
        <p className="text-[13px] font-semibold text-sage">
          {done ? 'Added to Our Local Network — pending their acceptance.' : `${otherBusiness.name} is already in your local network.`}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-linen rounded-xl p-5">
      {!open ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[14px] font-semibold text-soil mb-0.5">Are you now working with {otherBusiness.name}?</div>
            <p className="text-[12px] text-stone">Add them to Our Local Network so it shows on your public profile.</p>
          </div>
          <button type="button" onClick={() => setOpen(true)}
            className="flex-shrink-0 bg-rust text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-[#A8521F] transition-colors whitespace-nowrap">
            Add to Our Local Network
          </button>
        </div>
      ) : (
        <RelationshipTermsForm
          myBusiness={myBusiness}
          otherBusiness={otherBusiness}
          initialRelationshipType={defaultRelationshipType}
          submitLabel="Add to Local Network"
          onDone={() => setOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
