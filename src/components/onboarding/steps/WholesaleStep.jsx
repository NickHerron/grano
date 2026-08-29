'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import WholesaleSettingsPanel from '@/components/WholesaleSettingsPanel'
import SourcingRequestsManager from '@/app/dashboard/restaurant/sourcing/SourcingRequestsManager'
import WizardShell from '@/components/onboarding/WizardShell'
import { advancePayload, nextDestination, previousDestination } from '@/lib/onboardingProgress'

// WholesaleSettingsPanel saves the two capability flags itself (immediate, per
// toggle) — this step only tracks "did they just turn buying on" so it can offer
// SourcingRequestsManager as a sibling, and otherwise just advances wizard progress,
// same division of responsibility as WorkWithUsStep/WorkOptionsManager.
export default function WholesaleStep({ farm, initialRequests }) {
  const router = useRouter()
  const supabase = createClient()
  const [buysWholesale, setBuysWholesale] = useState(Boolean(farm.buys_wholesale))
  const [continuing, setContinuing] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setContinuing(true)
    setError('')
    const dest = nextDestination('wholesale')
    const { error: dbError } = await supabase.from('farms').update(advancePayload(farm, 'wholesale', dest.nextKey)).eq('id', farm.id)
    setContinuing(false)
    if (dbError) { setError(dbError.message); return }
    router.push(dest.href)
  }

  const dest = nextDestination('wholesale')

  return (
    <WizardShell
      stepKey="wholesale"
      title="How do you work wholesale?"
      subtitle="Optional — wholesale isn't just for restaurants buying from farms."
      explain="Grano connects businesses across the local food supply chain. You might sell your products wholesale while also purchasing ingredients or supplies from another business — neither direction is assumed from what kind of business you are."
      onBack={() => router.push(previousDestination('wholesale'))}
      onSkip={save}
      skipLabel="Skip for now"
      onContinue={save}
      continuing={continuing}
      continueLabel={dest.implemented ? 'Continue' : 'Continue to dashboard'}
      error={error}
    >
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
    </WizardShell>
  )
}
