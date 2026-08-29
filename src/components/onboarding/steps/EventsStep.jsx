'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LocationsManager from '@/app/dashboard/producer/locations/LocationsManager'
import WizardShell from '@/components/onboarding/WizardShell'
import { advancePayload, nextDestination, previousDestination } from '@/lib/onboardingProgress'

// One-off or occasional events — the same farm_locations table as Find Us, filtered
// to location_type='event' and framed differently. No separate event system.
export default function EventsStep({ farm, initialLocations }) {
  const router = useRouter()
  const supabase = createClient()
  const [continuing, setContinuing] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setContinuing(true)
    setError('')
    const dest = nextDestination('events')
    const { error: dbError } = await supabase.from('farms').update(advancePayload(farm, 'events', dest.nextKey)).eq('id', farm.id)
    setContinuing(false)
    if (dbError) { setError(dbError.message); return }
    router.push(dest.href)
  }

  const dest = nextDestination('events')

  return (
    <WizardShell
      stepKey="events"
      title="Any upcoming events?"
      subtitle="Optional — a pop-up, a farm dinner, a holiday market, a one-time tasting."
      explain="Events show up alongside your regular locations on your public profile and can be booked through Work With Us — a good way to bring in people who don't already know you."
      onBack={() => router.push(previousDestination('events'))}
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
        typeFilter={t => t === 'event'}
        defaultLocationType="event"
        emptyMessage="No events yet — add a pop-up, tasting, or one-time market."
      />
    </WizardShell>
  )
}
