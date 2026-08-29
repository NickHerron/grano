'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import WorkOptionsManager from '@/app/dashboard/profile/WorkOptionsManager'
import WizardShell from '@/components/onboarding/WizardShell'
import { advancePayload, nextDestination, previousDestination } from '@/lib/onboardingProgress'

export default function WorkWithUsStep({ farm, initialOptions }) {
  const router = useRouter()
  const supabase = createClient()
  const [continuing, setContinuing] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setContinuing(true)
    setError('')
    const dest = nextDestination('work-with-us')
    const { error: dbError } = await supabase.from('farms').update(advancePayload(farm, 'work-with-us', dest.nextKey)).eq('id', farm.id)
    setContinuing(false)
    if (dbError) { setError(dbError.message); return }
    router.push(dest.href)
  }

  const dest = nextDestination('work-with-us')

  return (
    <WizardShell
      stepKey="work-with-us"
      title="How can people work with you?"
      subtitle="Optional — anything you leave off still uses a sensible default based on your business type."
      explain="This powers the Work With Us button on your public profile — the difference between a generic contact form and someone sending you exactly the kind of request you actually want, whether that's wholesale, an event booking, or a custom order."
      onBack={() => router.push(previousDestination('work-with-us'))}
      onSkip={save}
      skipLabel="Skip for now"
      onContinue={save}
      continuing={continuing}
      continueLabel={dest.implemented ? 'Continue' : 'Continue to dashboard'}
      error={error}
    >
      <WorkOptionsManager businessType="farm" businessId={farm.id} options={initialOptions} />
    </WizardShell>
  )
}
