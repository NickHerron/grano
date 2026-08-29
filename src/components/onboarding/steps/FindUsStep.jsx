'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LocationsManager from '@/app/dashboard/producer/locations/LocationsManager'
import WizardShell from '@/components/onboarding/WizardShell'
import { advancePayload, nextDestination, previousDestination } from '@/lib/onboardingProgress'

// Regular, recurring places to find this business — everything except one-off events,
// which get their own step (EventsStep) even though both are just farm_locations rows.
export default function FindUsStep({ farm, initialLocations }) {
  const router = useRouter()
  const supabase = createClient()
  const [continuing, setContinuing] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setContinuing(true)
    setError('')
    const dest = nextDestination('find-us')
    const { error: dbError } = await supabase.from('farms').update(advancePayload(farm, 'find-us', dest.nextKey)).eq('id', farm.id)
    setContinuing(false)
    if (dbError) { setError(dbError.message); return }
    router.push(dest.href)
  }

  const dest = nextDestination('find-us')

  return (
    <WizardShell
      stepKey="find-us"
      title="Where can people find you?"
      subtitle="Farmers markets, your farm stand, retail stores that carry your goods, pickup spots."
      explain="This is what powers the 'Where to Find Us' section on your public profile — with real dates and hours, not just 'every Sunday.' Buyers use it to plan an actual visit."
      onBack={() => router.push(previousDestination('find-us'))}
      onSkip={save}
      skipLabel="Skip for now"
      onContinue={save}
      continuing={continuing}
      continueLabel={dest.implemented ? 'Continue' : 'Continue to dashboard'}
      error={error}
    >
      <LocationsManager
        farmId={farm.id}
        initialLocations={initialLocations}
        typeFilter={t => t !== 'event'}
        defaultLocationType="farmers_market"
        emptyMessage="No locations yet — add a farmers market, retail store, farm stand, or pickup spot."
      />
    </WizardShell>
  )
}
