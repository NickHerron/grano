'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

// Dismissible, not a forced redirect — per the confirmed decision, existing producers
// are never funneled into the wizard. Dismissal is per-browser (localStorage, keyed
// by farm id) rather than a DB column: there's nothing worth persisting server-side
// about "this one person clicked ✕ once," and it keeps this component from needing
// its own write path. Only ever shown for a farm that hasn't been published yet
// (farmProfileForm / onboarding_status — see schema_producer_onboarding.sql);
// starting as null (not yet checked) avoids a flash of the card before localStorage
// is read on mount.
export default function OnboardingCard({ farmId }) {
  const [dismissed, setDismissed] = useState(null)

  useEffect(() => {
    setDismissed(localStorage.getItem(`onboarding-card-dismissed-${farmId}`) === '1')
  }, [farmId])

  if (dismissed !== false) return null

  return (
    <div className="bg-[#FDF0E8] border-[1.5px] border-rust rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <div className="text-[14px] font-semibold text-soil mb-0.5">Finish setting up your profile</div>
        <p className="text-[12px] text-stone">A short guided setup — tell your story, add products, set up how people can work with you.</p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <Link href="/onboarding" className="text-[13px] font-semibold text-white bg-rust px-4 py-2 rounded-lg hover:bg-[#A8521F] transition-colors whitespace-nowrap">
          Guided setup →
        </Link>
        <button
          onClick={() => { localStorage.setItem(`onboarding-card-dismissed-${farmId}`, '1'); setDismissed(true) }}
          className="text-[13px] text-stone hover:text-soil transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
