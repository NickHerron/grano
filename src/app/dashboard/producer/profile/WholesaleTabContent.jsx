'use client'
import { useState } from 'react'
import WholesaleSettingsPanel from '@/components/WholesaleSettingsPanel'
import SourcingRequestsManager from '../../restaurant/sourcing/SourcingRequestsManager'

// Producer-side counterpart to the restaurant dashboard's WholesaleTabContent — same
// composition (settings panel + a conditional sourcing manager). The onboarding
// wizard's WholesaleStep covers this for a producer going through onboarding for the
// first time; this flat-dashboard tab is what an already-onboarded producer uses to
// change it afterward (onboarding is opt-in for existing accounts, so most producers
// on Grano today reach this feature through this tab, not the wizard).
export default function WholesaleTabContent({ farm, initialRequests }) {
  const [buysWholesale, setBuysWholesale] = useState(Boolean(farm.buys_wholesale))

  return (
    <div className="flex flex-col gap-6">
      <WholesaleSettingsPanel
        businessType="farm"
        businessId={farm.id}
        sellsWholesale={farm.sells_wholesale}
        buysWholesale={farm.buys_wholesale}
        onChange={({ buys_wholesale }) => setBuysWholesale(buys_wholesale)}
      />
      {buysWholesale && (
        <div>
          <div className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-2">What are you looking for?</div>
          <SourcingRequestsManager ownerType="farm" ownerId={farm.id} initialRequests={initialRequests} />
        </div>
      )}
    </div>
  )
}
