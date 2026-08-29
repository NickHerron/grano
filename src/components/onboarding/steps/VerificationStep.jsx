'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DocumentsManager from '@/components/DocumentsManager'
import WizardShell from '@/components/onboarding/WizardShell'
import { advancePayload, nextDestination, previousDestination } from '@/lib/onboardingProgress'

export default function VerificationStep({ farm, documentRows }) {
  const router = useRouter()
  const supabase = createClient()
  const [continuing, setContinuing] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setContinuing(true)
    setError('')
    const dest = nextDestination('verification')
    const { error: dbError } = await supabase.from('farms').update(advancePayload(farm, 'verification', dest.nextKey)).eq('id', farm.id)
    setContinuing(false)
    if (dbError) { setError(dbError.message); return }
    router.push(dest.href)
  }

  const dest = nextDestination('verification')

  return (
    <WizardShell
      stepKey="verification"
      title="Business verification"
      subtitle="Optional — private documents only Grano's team can see, never shown publicly."
      explain="Verified businesses get a badge on their public profile — a signal to buyers and other producers that Grano has confirmed who you are. Nothing uploaded here is ever visible to anyone but you and Grano's team."
      onBack={() => router.push(previousDestination('verification'))}
      onSkip={save}
      skipLabel="Skip for now"
      onContinue={save}
      continuing={continuing}
      continueLabel={dest.implemented ? 'Continue' : 'Continue to dashboard'}
      error={error}
    >
      <DocumentsManager ownerType="farm" ownerId={farm.id} rows={documentRows} />
    </WizardShell>
  )
}
