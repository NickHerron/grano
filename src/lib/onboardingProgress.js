// Shared by every onboarding wizard step client component — one definition of "what
// does completing a step actually write" and "where does Continue go next," so
// individual steps stay thin (build a form payload, call these, navigate).
import { nextStepKey, previousStepKey, IMPLEMENTED_ONBOARDING_STEPS } from './onboardingSteps'

// The onboarding_* column updates for finishing (or skipping) `stepKey`. `resumeKey`
// is the true next step in the registry, independent of whether it has a wizard page
// yet — so onboarding_step always points at the producer's actual next step, and a
// later phase shipping that step's page just works without a backfill.
export function advancePayload(farm, stepKey, resumeKey) {
  const completed = new Set(farm.onboarding_completed_steps || [])
  completed.add(stepKey)
  return {
    onboarding_status: farm.onboarding_status === 'published' ? 'published' : 'in_progress',
    onboarding_step: resumeKey,
    onboarding_completed_steps: [...completed],
    onboarding_started_at: farm.onboarding_started_at || new Date().toISOString(),
  }
}

// Where "Continue" should take the producer after `stepKey`, and what the true next
// step is (for advancePayload's resumeKey — see above). If the next step's wizard
// page doesn't exist yet, Continue lands on the flat dashboard profile instead, where
// every field is still editable today — never a dead link.
export function nextDestination(stepKey) {
  const nextKey = nextStepKey(stepKey)
  const implemented = Boolean(nextKey && IMPLEMENTED_ONBOARDING_STEPS.includes(nextKey))
  return {
    nextKey,
    implemented,
    href: implemented ? `/onboarding/${nextKey}` : '/dashboard/profile?section=producer',
  }
}

// Where "Back" should take the producer — null on the first step (no back link).
// Every step before the current one is implemented by construction (you can only
// reach a step whose predecessors were already built), so no fallback is needed here.
export function previousDestination(stepKey) {
  const prevKey = previousStepKey(stepKey)
  return prevKey ? `/onboarding/${prevKey}` : null
}
