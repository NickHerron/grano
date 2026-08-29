'use client'
import { useState } from 'react'
import WholesaleSettingsPanel from '@/components/WholesaleSettingsPanel'
import SourcingRequestsManager from '../sourcing/SourcingRequestsManager'

// Same composition as the producer onboarding wizard's WholesaleStep (panel + a
// conditional sourcing manager when "we buy" is checked), just without wizard chrome
// — this is a flat settings tab, not a step with Back/Skip/Continue. Kept as its own
// small wrapper rather than reusing WholesaleStep directly, since that component's
// WizardShell wrapper is wizard-specific.
export default function WholesaleTabContent({ restaurant, initialRequests }) {
  const [buysWholesale, setBuysWholesale] = useState(Boolean(restaurant.buys_wholesale))

  return (
    <div className="flex flex-col gap-6">
      <WholesaleSettingsPanel
        businessType="restaurant"
        businessId={restaurant.id}
        sellsWholesale={restaurant.sells_wholesale}
        buysWholesale={restaurant.buys_wholesale}
        onChange={({ buys_wholesale }) => setBuysWholesale(buys_wholesale)}
      />
      {buysWholesale && (
        <div>
          <div className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-2">What are you looking for?</div>
          <SourcingRequestsManager ownerType="restaurant" ownerId={restaurant.id} initialRequests={initialRequests} />
        </div>
      )}
    </div>
  )
}
