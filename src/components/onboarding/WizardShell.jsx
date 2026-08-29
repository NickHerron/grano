'use client'
// The chrome every wizard step renders inside: progress bar, title/subtitle, an
// optional "why this matters" callout, the step's own fields as children, then a
// Back / Skip / Continue footer. Steps own their form state and save logic — this
// component only knows how to lay them out and fire the three navigation callbacks.
import WizardProgress from './WizardProgress'
import EducationalCallout from './EducationalCallout'

export default function WizardShell({
  stepKey, title, subtitle, explain, children,
  onBack, backLabel = 'Back',
  onSkip, skipLabel = 'Skip for now',
  onContinue, continueLabel = 'Continue', continuing = false,
  error,
}) {
  return (
    <div className="flex flex-col gap-8">
      <WizardProgress currentKey={stepKey} />

      <div>
        <h1 className="font-serif text-[26px] font-semibold text-soil mb-1">{title}</h1>
        {subtitle && <p className="text-[14px] text-stone">{subtitle}</p>}
      </div>

      {explain && <EducationalCallout>{explain}</EducationalCallout>}

      {children}

      {error && <p className="text-[13px] text-rust">{error}</p>}

      <div className="flex items-center justify-between pt-4 border-t border-[#ECEAE4]">
        <div>
          {onBack && (
            <button type="button" onClick={onBack} disabled={continuing}
              className="text-[13px] font-semibold text-stone hover:text-soil transition-colors disabled:opacity-50">
              ← {backLabel}
            </button>
          )}
        </div>
        <div className="flex items-center gap-5">
          {onSkip && (
            <button type="button" onClick={onSkip} disabled={continuing}
              className="text-[13px] font-semibold text-stone hover:text-soil transition-colors disabled:opacity-50">
              {skipLabel}
            </button>
          )}
          {onContinue && (
            <button type="button" onClick={onContinue} disabled={continuing}
              className="bg-rust text-white text-[15px] font-bold px-6 py-3 rounded-xl hover:bg-[#A8521F] transition-colors disabled:opacity-60">
              {continuing ? 'Saving…' : continueLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
