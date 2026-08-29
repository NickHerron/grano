'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { featureForPath } from '@/lib/featureMap'
import FeedbackPanel from './FeedbackPanel'

// Shared option set for the onboarding "how's this going?" pulse (spec section 18) —
// defined once so every step that mounts QuickPulse with this question uses identical
// options/categories instead of a slightly-different copy per step.
// Tuple: [button label, category, minimal?] — minimal options submit a one-line row
// directly and skip straight to "thanks"; non-minimal ones open the full panel so the
// "what part?" follow-up actually gets captured.
export const ONBOARDING_PULSE_OPTIONS = [
  ['Easy', 'positive', true],
  ['Confusing', 'confusing_ux', false],
  ['Too much information', 'confusing_ux', false],
  ['Missing something', 'missing_feature', false],
  ['Other', 'other', false],
]

// A small inline "how's this going?" prompt — not a WizardShell slot (the shell has
// exactly one content-extension point, `explain`, always the same callout shape; this
// is only needed at 1-2 specific points, not every step, so it's simplest for the step
// component itself to render it). A trivial option (e.g. "Easy") submits a minimal
// feedback row directly and just says thanks; a substantive one (e.g. "Confusing")
// opens the full FeedbackPanel pre-seeded with category + context so the "what part?"
// follow-up actually gets captured.
export default function QuickPulse({ question, options, context }) {
  const supabase = createClient()
  const pathname = usePathname()
  const { feature, onboardingStep } = featureForPath(pathname)
  const [state, setState] = useState('asking') // asking | thanked | expanded
  const [expandCategory, setExpandCategory] = useState(null)

  async function pick(label, category, minimal) {
    if (minimal) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('feedback_submissions').insert({
          user_id: user.id, category, message: label,
          account_type: context?.accountType || null,
          business_kind: context?.businessKind || null,
          business_id: context?.businessId || null,
          business_type: context?.businessType || null,
          page_path: pathname,
          feature,
          onboarding_step: onboardingStep,
        })
      }
      setState('thanked')
      return
    }
    setExpandCategory(category)
    setState('expanded')
  }

  if (state === 'thanked') {
    return <p className="text-[12px] text-sage font-medium">Thanks — noted.</p>
  }

  if (state === 'expanded') {
    return (
      <div className="bg-white border border-[#ECEAE4] rounded-xl">
        <FeedbackPanel context={context} presetCategory={expandCategory} onClose={() => setState('thanked')} />
      </div>
    )
  }

  return (
    <div className="bg-linen rounded-xl px-4 py-3.5">
      <div className="text-[13px] font-semibold text-soil mb-2">{question}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([label, category, minimal]) => (
          <button key={label} type="button" onClick={() => pick(label, category, minimal)}
            className="text-[12px] font-medium px-3 py-1.5 rounded-full border-[1.5px] border-transparent bg-white text-soil hover:border-wheat transition-colors">
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
