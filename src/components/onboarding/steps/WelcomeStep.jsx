'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import WizardShell from '@/components/onboarding/WizardShell'
import { advancePayload, nextDestination } from '@/lib/onboardingProgress'

export default function WelcomeStep({ farm }) {
  const router = useRouter()
  const supabase = createClient()
  const [continuing, setContinuing] = useState(false)
  const [error, setError] = useState('')

  async function handleContinue() {
    setContinuing(true)
    setError('')
    const dest = nextDestination('welcome')
    const { error: dbError } = await supabase
      .from('farms')
      .update(advancePayload(farm, 'welcome', dest.nextKey))
      .eq('id', farm.id)
    setContinuing(false)
    if (dbError) { setError(dbError.message); return }
    router.push(dest.href)
  }

  return (
    <WizardShell
      stepKey="welcome"
      title={`Let's build your Grano profile, ${farm.name}`}
      subtitle="A handful of short steps — save and come back anytime. Your profile is already public, so nothing here is a prerequisite to start; it just makes what's already live work harder for you."
      explain="Producers with a fuller profile get followed, messaged, and found more — by shoppers, restaurants, and other local businesses. Nothing is required; each step just explains what it unlocks so you can decide what's worth your time."
      onContinue={handleContinue}
      continuing={continuing}
      continueLabel="Let's get started"
      error={error}
    >
      <ul className="flex flex-col gap-2.5 text-[14px] text-soil">
        <li className="flex gap-2.5"><span className="text-rust font-bold">✓</span> Introduce your business and tell your story</li>
        <li className="flex gap-2.5"><span className="text-rust font-bold">✓</span> Show what you offer, where to find you, and your products</li>
        <li className="flex gap-2.5"><span className="text-rust font-bold">✓</span> Connect with other local businesses and set up how they can work with you</li>
      </ul>
    </WizardShell>
  )
}
