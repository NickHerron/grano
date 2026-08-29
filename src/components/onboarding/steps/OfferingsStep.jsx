'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OFFERING_OPTIONS, SERVES_OPTIONS } from '@/lib/offeringsOptions'
import WizardShell from '@/components/onboarding/WizardShell'
import { advancePayload, nextDestination, previousDestination } from '@/lib/onboardingProgress'

function CheckboxGrid({ options, selected, onToggle }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map(([key, label]) => (
        <label key={key} className="flex items-center gap-2 text-[13px] text-soil cursor-pointer bg-linen rounded-lg px-3 py-2.5">
          <input type="checkbox" checked={selected.includes(key)} onChange={() => onToggle(key)} className="w-4 h-4 accent-rust" />
          {label}
        </label>
      ))}
    </div>
  )
}

export default function OfferingsStep({ farm }) {
  const router = useRouter()
  const supabase = createClient()
  const [offerings, setOfferings] = useState(farm.offerings || [])
  const [serves, setServes] = useState(farm.serves || [])
  const [continuing, setContinuing] = useState(false)
  const [error, setError] = useState('')

  function toggleOffering(key) {
    setOfferings(o => o.includes(key) ? o.filter(k => k !== key) : [...o, key])
  }
  function toggleServes(key) {
    setServes(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key])
  }

  async function save() {
    setContinuing(true)
    setError('')
    const dest = nextDestination('offerings')

    // Where an offering already has a matching practices badge (Wholesale/Pickup/CSA/
    // sells-to-restaurants), turn that badge on too instead of asking the same
    // question twice — see offeringsOptions.js. One-way only: unchecking an offering
    // here never turns a practice back off, since that badge might have been set
    // deliberately from the profile form and this step shouldn't silently undo it.
    const practiceUpdates = {}
    OFFERING_OPTIONS.forEach(([key, , practiceKey]) => { if (practiceKey && offerings.includes(key)) practiceUpdates[practiceKey] = true })
    SERVES_OPTIONS.forEach(([key, , practiceKey]) => { if (practiceKey && serves.includes(key)) practiceUpdates[practiceKey] = true })

    const { error: dbError } = await supabase.from('farms').update({
      offerings,
      serves,
      practices: { ...(farm.practices || {}), ...practiceUpdates },
      ...advancePayload(farm, 'offerings', dest.nextKey),
    }).eq('id', farm.id)
    setContinuing(false)
    if (dbError) { setError(dbError.message); return }
    router.push(dest.href)
  }

  const dest = nextDestination('offerings')

  return (
    <WizardShell
      stepKey="offerings"
      title="What do you offer?"
      subtitle="Optional — helps Grano show the right options on your profile and in Work With Us."
      explain="Checking a few of these tailors what shows up on your public profile and pre-fills the ways other businesses can work with you — you can always change these later."
      onBack={() => router.push(previousDestination('offerings'))}
      onSkip={save}
      skipLabel="Skip for now"
      onContinue={save}
      continuing={continuing}
      continueLabel={dest.implemented ? 'Continue' : 'Continue to dashboard'}
      error={error}
    >
      <div className="flex flex-col gap-6">
        <div>
          <div className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-2">How you sell</div>
          <CheckboxGrid options={OFFERING_OPTIONS} selected={offerings} onToggle={toggleOffering} />
        </div>
        <div>
          <div className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-2">Who you work with</div>
          <CheckboxGrid options={SERVES_OPTIONS} selected={serves} onToggle={toggleServes} />
        </div>
      </div>
    </WizardShell>
  )
}
