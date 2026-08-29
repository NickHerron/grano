// Single source of truth for the onboarding wizard's step order. The wizard shell's
// progress indicator, the Review step's [Edit] links, the resume resolver, and the
// profile-optimization checklist all read from this one array — nothing else
// hardcodes the sequence, so they can't drift out of sync with each other.
//
// `key` matches the /onboarding/[step] route segment. `done(farm, ctx)` is the single
// definition of "has this step actually been completed" — the same predicate used
// both to decide where to resume and what the optimization checklist should still
// recommend. `ctx` carries the counts a step needs beyond the farm row itself
// (productCount, locationCount, eventCount, networkCount, workOptionCount,
// documentCount, sourcedFromCount) — supplied by whichever page assembles it.
export const ONBOARDING_STEPS = [
  { key: 'welcome', label: 'Welcome', skippable: false },
  { key: 'basics', label: 'Business Basics', skippable: false,
    done: farm => Boolean(farm.name && farm.producer_type && farm.location) },
  { key: 'intro', label: 'Short Introduction', skippable: true,
    done: farm => Boolean(farm.bio) },
  { key: 'story', label: 'Your Story', skippable: true,
    done: farm => Boolean(farm.story) },
  { key: 'offerings', label: 'What You Offer', skippable: true,
    done: farm => Boolean(farm.offerings?.length) },
  { key: 'wholesale', label: 'Wholesale', skippable: true,
    done: farm => Boolean(farm.sells_wholesale || farm.buys_wholesale) },
  { key: 'products', label: 'Products', skippable: true,
    done: (farm, ctx) => Boolean(ctx?.productCount > 0) },
  { key: 'find-us', label: 'Where to Find You', skippable: true,
    done: (farm, ctx) => Boolean(ctx?.locationCount > 0) },
  { key: 'events', label: 'Events', skippable: true,
    done: (farm, ctx) => Boolean(ctx?.eventCount > 0) },
  { key: 'network', label: 'Your Local Network', skippable: true,
    done: (farm, ctx) => Boolean(ctx?.networkCount > 0) },
  { key: 'work-with-us', label: 'Work With Us', skippable: true,
    done: (farm, ctx) => Boolean(ctx?.workOptionCount > 0) },
  { key: 'verification', label: 'Verification', skippable: true,
    done: (farm, ctx) => Boolean(ctx?.documentCount > 0) },
  { key: 'review', label: 'Review & Publish', skippable: false },
]

export function stepIndex(key) {
  return ONBOARDING_STEPS.findIndex(s => s.key === key)
}

export function nextStepKey(key) {
  const i = stepIndex(key)
  return i >= 0 && i < ONBOARDING_STEPS.length - 1 ? ONBOARDING_STEPS[i + 1].key : null
}

export function previousStepKey(key) {
  const i = stepIndex(key)
  return i > 0 ? ONBOARDING_STEPS[i - 1].key : null
}

// The step to land a producer on when their onboarding_step is null — the first step
// that isn't done yet. A step counts as done if its data-driven `done` predicate
// passes (name/location already filled in, a product already added, etc.) OR its key
// is in onboarding_completed_steps. The second clause matters for structural steps
// like welcome/review that have no `done` predicate at all: without it they'd read as
// "done" from the moment ONBOARDING_STEPS is evaluated, and a brand-new signup would
// skip straight past Welcome on their very first visit instead of ever seeing it.
export function firstIncompleteStep(farm, ctx) {
  const completed = new Set(farm.onboarding_completed_steps || [])
  const step = ONBOARDING_STEPS.find(s => {
    if (completed.has(s.key)) return false
    return s.done ? !s.done(farm, ctx) : true
  })
  return step?.key || 'review'
}

// Which steps actually have a wizard page built yet, in shipping order. Grows by one
// entry each phase (Phase 4 adds offerings/products/find-us/events, Phase 5 adds
// network/work-with-us/verification, Phase 6 adds review) — every consumer reads this
// array rather than hardcoding "what's live," so nothing needs to change at those
// step's own call sites when a later phase lands. Once 'review' is added here, the
// whole array always matches ONBOARDING_STEPS and this list (and the fallback
// destination in onboardingProgress.js that reads it) can be deleted.
export const IMPLEMENTED_ONBOARDING_STEPS = ['welcome', 'basics', 'intro', 'story', 'offerings', 'wholesale', 'products', 'find-us', 'events', 'network', 'work-with-us', 'verification', 'review']
