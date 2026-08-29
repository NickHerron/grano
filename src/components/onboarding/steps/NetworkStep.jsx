'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BusinessNetworkManager from '@/app/dashboard/following/BusinessNetworkManager'
import WizardShell from '@/components/onboarding/WizardShell'
import { advancePayload, nextDestination, previousDestination } from '@/lib/onboardingProgress'

// BusinessNetworkManager is already the full self-contained "Our Business Network"
// manager from the dashboard's My Network tab (search, invite, pending/accepted
// groups) — embedded as-is, not rebuilt. Nothing here ever auto-creates a
// relationship; every connection still goes through the same explicit invite-and-
// accept flow.
export default function NetworkStep({ farm, initialEntries }) {
  const router = useRouter()
  const supabase = createClient()
  const [continuing, setContinuing] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setContinuing(true)
    setError('')
    const dest = nextDestination('network')
    const { error: dbError } = await supabase.from('farms').update(advancePayload(farm, 'network', dest.nextKey)).eq('id', farm.id)
    setContinuing(false)
    if (dbError) { setError(dbError.message); return }
    router.push(dest.href)
  }

  const dest = nextDestination('network')
  const business = { type: 'farm', id: farm.id, slug: farm.slug, name: farm.name }

  return (
    <WizardShell
      stepKey="network"
      title="Your local network"
      subtitle="Optional — connect with other producers, restaurants, and businesses you actually work with."
      explain="A network connection is a real relationship, not a follow — who you source ingredients from, who you supply, who you collaborate with. It shows on both profiles once the other business accepts."
      onBack={() => router.push(previousDestination('network'))}
      onSkip={save}
      skipLabel="Skip for now"
      onContinue={save}
      continuing={continuing}
      continueLabel={dest.implemented ? 'Continue' : 'Continue to dashboard'}
      error={error}
    >
      <BusinessNetworkManager business={business} entries={initialEntries} />
    </WizardShell>
  )
}
