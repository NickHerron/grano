import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { firstIncompleteStep, IMPLEMENTED_ONBOARDING_STEPS } from '@/lib/onboardingSteps'
import { getBusinessNetwork } from '@/lib/networkQueries'

// Resolves "where should this producer resume" and redirects there. If they have an
// onboarding_step saved and it's been built, trust it. Otherwise defer to the shared
// firstIncompleteStep() resolver (same predicate the optimization checklist will use)
// — and if that lands on a step that doesn't have a page yet, fall back to the last
// implemented step rather than a dead end.
export default async function OnboardingIndexPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: farm } = await supabase.from('farms').select('*').eq('owner_id', user.id).single()

  if (farm.onboarding_step && IMPLEMENTED_ONBOARDING_STEPS.includes(farm.onboarding_step)) {
    redirect(`/onboarding/${farm.onboarding_step}`)
  }

  // ctx feeds every count-based `done` predicate — without it, a producer who already
  // added products, locations, network connections, work options, or documents
  // through the regular dashboard (rather than the wizard) would read as "not done"
  // on those steps despite having real data.
  const [{ count: productCount }, { data: locations }, networkEntries, { count: workOptionCount }, { count: documentCount }] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('farm_id', farm.id),
    supabase.from('farm_locations').select('location_type').eq('farm_id', farm.id),
    getBusinessNetwork(supabase, { type: 'farm', id: farm.id }),
    supabase.from('business_work_options').select('id', { count: 'exact', head: true }).eq('business_type', 'farm').eq('business_id', farm.id).eq('enabled', true),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('farm_id', farm.id),
  ])
  const ctx = {
    productCount: productCount || 0,
    locationCount: (locations || []).filter(l => l.location_type !== 'event').length,
    eventCount: (locations || []).filter(l => l.location_type === 'event').length,
    networkCount: (networkEntries || []).filter(e => e.status === 'accepted').length,
    workOptionCount: workOptionCount || 0,
    documentCount: documentCount || 0,
  }

  const step = firstIncompleteStep(farm, ctx)
  redirect(`/onboarding/${IMPLEMENTED_ONBOARDING_STEPS.includes(step) ? step : IMPLEMENTED_ONBOARDING_STEPS[IMPLEMENTED_ONBOARDING_STEPS.length - 1]}`)
}
