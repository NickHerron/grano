'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { initialFarmForm, farmUpdatePayload } from '@/lib/farmProfileForm'
import { StoryField } from '@/components/profile/ProfileFieldGroups'
import WizardShell from '@/components/onboarding/WizardShell'
import { advancePayload, nextDestination, previousDestination } from '@/lib/onboardingProgress'

export default function StoryStep({ farm }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState(initialFarmForm(farm))
  const [continuing, setContinuing] = useState(false)
  const [error, setError] = useState('')

  function update(key, value) { setForm(f => ({ ...f, [key]: value })) }

  async function save() {
    setContinuing(true)
    setError('')
    const dest = nextDestination('story')
    const { error: dbError } = await supabase.from('farms').update({
      ...farmUpdatePayload(form),
      ...advancePayload(farm, 'story', dest.nextKey),
    }).eq('id', farm.id)
    setContinuing(false)
    if (dbError) { setError(dbError.message); return }
    router.push(dest.href)
  }

  const dest = nextDestination('story')

  return (
    <WizardShell
      stepKey="story"
      title="Your full story"
      subtitle="Optional — how you got started, what makes you different, why you make what you make."
      explain="This is where people fall in love with what you do. Shoppers and restaurants alike say a real story is what turns a passing look into a follow, a message, or an order."
      onBack={() => router.push(previousDestination('story'))}
      onSkip={save}
      skipLabel="Skip for now"
      onContinue={save}
      continuing={continuing}
      continueLabel={dest.implemented ? 'Continue' : 'Continue to dashboard'}
      error={error}
    >
      <StoryField form={form} update={update} />
    </WizardShell>
  )
}
