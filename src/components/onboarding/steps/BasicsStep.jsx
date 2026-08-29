'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { initialFarmForm, farmUpdatePayload } from '@/lib/farmProfileForm'
import { IdentityFields, LocationFields, ContactFields, SocialFields } from '@/components/profile/ProfileFieldGroups'
import WizardShell from '@/components/onboarding/WizardShell'
import QuickPulse, { ONBOARDING_PULSE_OPTIONS } from '@/components/feedback/QuickPulse'
import { advancePayload, nextDestination, previousDestination } from '@/lib/onboardingProgress'

export default function BasicsStep({ farm }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState(initialFarmForm(farm))
  const [continuing, setContinuing] = useState(false)
  const [error, setError] = useState('')

  function update(key, value) { setForm(f => ({ ...f, [key]: value })) }
  function toggleSecondaryType(type) {
    setForm(f => ({
      ...f,
      secondary_types: f.secondary_types.includes(type)
        ? f.secondary_types.filter(t => t !== type)
        : [...f.secondary_types, type],
    }))
  }

  async function handleContinue() {
    if (!form.name.trim()) { setError('Give your business a name to continue.'); return }
    setContinuing(true)
    setError('')
    const dest = nextDestination('basics')
    const { error: dbError } = await supabase.from('farms').update({
      ...farmUpdatePayload(form),
      ...advancePayload(farm, 'basics', dest.nextKey),
    }).eq('id', farm.id)
    setContinuing(false)
    if (dbError) { setError(dbError.message); return }
    router.push(dest.href)
  }

  const dest = nextDestination('basics')

  return (
    <WizardShell
      stepKey="basics"
      title="The basics"
      subtitle="This is what shows first on your public profile — your name, what you make, and where you're based."
      explain="Your business type and location are how Grano matches you to nearby restaurants, buyers, and shoppers, and how you show up in searches and filters across the site."
      onBack={() => router.push(previousDestination('basics'))}
      onContinue={handleContinue}
      continuing={continuing}
      continueLabel={dest.implemented ? 'Continue' : 'Continue to dashboard'}
      error={error}
    >
      <div className="flex flex-col gap-6">
        <IdentityFields form={form} update={update} toggleSecondaryType={toggleSecondaryType} />
        <LocationFields form={form} update={update} />
        <ContactFields form={form} update={update} />
        <SocialFields form={form} update={update} />

        <QuickPulse question="How is this setup process going?" options={ONBOARDING_PULSE_OPTIONS}
          context={{ accountType: 'producer', businessKind: 'farm', businessId: farm.id, businessType: farm.producer_type }} />
      </div>
    </WizardShell>
  )
}
