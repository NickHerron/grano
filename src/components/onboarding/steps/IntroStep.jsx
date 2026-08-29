'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { initialFarmForm, farmUpdatePayload } from '@/lib/farmProfileForm'
import { ShortIntroField } from '@/components/profile/ProfileFieldGroups'
import WizardShell from '@/components/onboarding/WizardShell'
import { advancePayload, nextDestination, previousDestination } from '@/lib/onboardingProgress'
import { onboardingExamples } from '@/lib/onboardingEmphasis'

export default function IntroStep({ farm }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState(initialFarmForm(farm))
  const [continuing, setContinuing] = useState(false)
  const [error, setError] = useState('')

  function update(key, value) { setForm(f => ({ ...f, [key]: value })) }

  async function save() {
    setContinuing(true)
    setError('')
    const dest = nextDestination('intro')
    const { error: dbError } = await supabase.from('farms').update({
      ...farmUpdatePayload(form),
      ...advancePayload(farm, 'intro', dest.nextKey),
    }).eq('id', farm.id)
    setContinuing(false)
    if (dbError) { setError(dbError.message); return }
    router.push(dest.href)
  }

  const dest = nextDestination('intro')
  const examples = onboardingExamples(farm)

  return (
    <WizardShell
      stepKey="intro"
      title="Your short intro"
      subtitle="Optional — but it's the first thing people read."
      explain="Think of this as your elevator pitch: one or two sentences a busy chef or shopper can read in passing and immediately understand who you are and what you make."
      onBack={() => router.push(previousDestination('intro'))}
      onSkip={save}
      skipLabel="Skip for now"
      onContinue={save}
      continuing={continuing}
      continueLabel={dest.implemented ? 'Continue' : 'Continue to dashboard'}
      error={error}
    >
      <ShortIntroField form={form} update={update} placeholder={`e.g. "${examples.intro}"`} />
    </WizardShell>
  )
}
