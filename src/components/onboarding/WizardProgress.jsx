import { ONBOARDING_STEPS, stepIndex } from '@/lib/onboardingSteps'

// A slim progress bar plus "Step X of N · Label" instead of a bare percentage — the
// producer always knows both where they are and how much is left, and the label
// doubles as a preview of what's still ahead (Products, Find Us, Network, etc.).
export default function WizardProgress({ currentKey }) {
  const idx = stepIndex(currentKey)
  const total = ONBOARDING_STEPS.length
  const current = ONBOARDING_STEPS[idx]
  const percent = idx >= 0 ? Math.round(((idx + 1) / total) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone">
          Step {idx + 1} of {total} · {current?.label}
        </span>
        <span className="text-[11px] text-stone">{percent}%</span>
      </div>
      <div className="h-1.5 bg-[#ECEAE4] rounded-full overflow-hidden">
        <div className="h-full bg-rust rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
