'use client'
import { useState } from 'react'
import RelationshipTermsForm from '@/components/RelationshipTermsForm'
import BusinessSearchField from '@/components/BusinessSearchField'
import InviteBusinessPanel from './InviteBusinessPanel'

// Search Grano's farms + restaurants by name, pick one, then hand off to
// RelationshipTermsForm to say how you're connected, optionally attach specific
// products, optionally leave a note — then send it as a pending invitation. Nothing
// becomes visible on either public profile until the other business accepts (see
// business_relationships RLS + trigger). Search itself lives in BusinessSearchField.jsx
// so SourcedFromEditor.jsx can reuse the identical search for product tagging.
export default function AddBusinessPanel({ myBusiness, onDone }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [inviting, setInviting] = useState(false)

  if (inviting) {
    return <InviteBusinessPanel initialName={query} myBusinessName={myBusiness.name} onDone={onDone} />
  }

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl p-5">
      {!selected ? (
        <BusinessSearchField
          excludeType={myBusiness.type}
          excludeId={myBusiness.id}
          onSelect={setSelected}
          onInviteClick={() => setInviting(true)}
          onQueryChange={setQuery}
        />
      ) : (
        <RelationshipTermsForm
          myBusiness={myBusiness}
          otherBusiness={selected}
          submitLabel="Send Invitation"
          onDone={onDone}
          onChangeBusiness={() => setSelected(null)}
          // Organizations are the initiator here most often for a market inviting a
          // vendor — 'collaboration' is the only relationship type that reads the
          // same on both sides (source_from/supplies_to invert per side and would
          // read backwards for one of the two businesses).
          initialRelationshipType={myBusiness.type === 'organization' ? 'collaboration' : 'source_from'}
        />
      )}
    </div>
  )
}
