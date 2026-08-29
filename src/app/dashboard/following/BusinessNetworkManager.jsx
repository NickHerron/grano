'use client'
import { useState } from 'react'
import LocalNetworkCard from '@/components/LocalNetworkCard'
import { businessTypeLabel } from '@/lib/businessNetwork'
import AddBusinessPanel from './AddBusinessPanel'
import NetworkRelationshipActions from './NetworkRelationshipActions'
import ListAtMarketPrompt from './ListAtMarketPrompt'

// `viewerFarmId`/`linkedOrganizationIds` are only ever set for a farm-owned network
// manager — ListAtMarketPrompt checks its own conditions (vendor-hosting org, not
// already linked) and renders nothing itself when they don't hold, so passing them
// through unconditionally to every Group is safe.
function Group({ title, entries, role, emptyHint, viewerFarmId, linkedOrganizationIds }) {
  if (entries.length === 0 && !emptyHint) return null
  return (
    <div>
      <div className="text-[12px] font-semibold uppercase tracking-widest text-rust mb-3">{title}</div>
      {entries.length === 0 ? (
        <p className="text-[13px] text-stone">{emptyHint}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {entries.map(entry => {
            const farmId = entry.initiator_type === 'farm' ? entry.initiator_id : (entry.target_type === 'farm' ? entry.target_id : null)
            return (
              <LocalNetworkCard key={entry.id} entry={entry}
                actions={
                  <>
                    <NetworkRelationshipActions relationship={entry} role={role(entry)} farmId={farmId} />
                    {viewerFarmId && entry.otherBusiness?.type === 'organization' && (
                      <ListAtMarketPrompt farmId={viewerFarmId} organizationId={entry.otherBusiness.id}
                        alreadyLinked={linkedOrganizationIds?.has(entry.otherBusiness.id)} />
                    )}
                  </>
                } />
            )
          })}
        </div>
      )}
    </div>
  )
}

// One instance per business the account owns (a dual-role account managing both a
// farm and a restaurant sees two of these, clearly labeled — same pattern already
// used for the Wholesale and Messages hubs, rather than a stateful "viewing as"
// switcher).
export default function BusinessNetworkManager({ business, entries, hostsVendors = false, linkedOrganizationIds }) {
  const viewerFarmId = business.type === 'farm' ? business.id : null
  const [addingBusiness, setAddingBusiness] = useState(false)

  const isInitiator = e => e.initiator_type === business.type && e.initiator_id === business.id
  const roleOf = e => (isInitiator(e) ? 'initiator' : 'target')

  const accepted = entries.filter(e => e.status === 'accepted')
  const pendingReceived = entries.filter(e => e.status === 'pending' && !isInitiator(e))
  const pendingSent = entries.filter(e => e.status === 'pending' && isInitiator(e))

  const sourceFrom = accepted.filter(e => e.perspective === 'source_from')
  const suppliesTo = accepted.filter(e => e.perspective === 'supplies_to')
  const collaborations = accepted.filter(e => e.perspective === 'collaboration')

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl p-6 flex flex-col gap-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-serif text-[18px] font-semibold text-soil">{business.name}</div>
          <div className="text-[12px] text-stone">{businessTypeLabel(business.type)} · Our Business Network</div>
        </div>
        <button onClick={() => setAddingBusiness(v => !v)}
          className="bg-rust text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-[#A8521F] transition-colors">
          {addingBusiness ? 'Cancel' : '+ Add Business'}
        </button>
      </div>

      {addingBusiness && (
        <AddBusinessPanel myBusiness={business} onDone={() => setAddingBusiness(false)} />
      )}

      {pendingReceived.length > 0 && (
        <Group title={`Pending (${pendingReceived.length})`} entries={pendingReceived} role={roleOf} />
      )}

      <Group title="We Source From" entries={sourceFrom} role={roleOf} emptyHint="Nothing here yet." viewerFarmId={viewerFarmId} linkedOrganizationIds={linkedOrganizationIds} />
      <Group title="We Supply" entries={suppliesTo} role={roleOf} emptyHint="Nothing here yet." viewerFarmId={viewerFarmId} linkedOrganizationIds={linkedOrganizationIds} />
      {/* "Vendors & Partners", not plain "Vendors" — /markets/[slug]'s public profile
          already has a section literally titled "Vendors", sourced from a different
          table (farm_locations.organization_id, producer-initiated). Using the same
          word here for a different count, on the dashboard, would read as a bug. */}
      {collaborations.length > 0 && (
        <Group title={hostsVendors ? 'Vendors & Partners' : 'We Work With'} entries={collaborations} role={roleOf}
          viewerFarmId={viewerFarmId} linkedOrganizationIds={linkedOrganizationIds} />
      )}
      {pendingSent.length > 0 && <Group title="Sent — Awaiting Response" entries={pendingSent} role={roleOf} />}

      {accepted.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0 && !addingBusiness && (
        <div className="bg-linen rounded-xl p-8 text-center">
          <p className="text-[14px] text-stone mb-4">We're building our local food network.</p>
          <button onClick={() => setAddingBusiness(true)} className="text-[13px] font-semibold text-rust hover:underline">+ Add a Business</button>
        </div>
      )}
    </div>
  )
}
