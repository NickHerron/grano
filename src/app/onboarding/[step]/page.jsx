import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IMPLEMENTED_ONBOARDING_STEPS } from '@/lib/onboardingSteps'
import { requiredTypeIds, buildDocumentRows } from '@/lib/documentRequirements'
import { allowedWorkOptionKeys, defaultWorkOptionKeys, resolveWorkOptions } from '@/lib/workOptions'
import { getBusinessNetwork } from '@/lib/networkQueries'
import { buildProfileRecommendations } from '@/lib/profileCompletion'
import WelcomeStep from '@/components/onboarding/steps/WelcomeStep'
import BasicsStep from '@/components/onboarding/steps/BasicsStep'
import IntroStep from '@/components/onboarding/steps/IntroStep'
import StoryStep from '@/components/onboarding/steps/StoryStep'
import OfferingsStep from '@/components/onboarding/steps/OfferingsStep'
import WholesaleStep from '@/components/onboarding/steps/WholesaleStep'
import ProductsStep from '@/components/onboarding/steps/ProductsStep'
import FindUsStep from '@/components/onboarding/steps/FindUsStep'
import EventsStep from '@/components/onboarding/steps/EventsStep'
import NetworkStep from '@/components/onboarding/steps/NetworkStep'
import WorkWithUsStep from '@/components/onboarding/steps/WorkWithUsStep'
import VerificationStep from '@/components/onboarding/steps/VerificationStep'
import ReviewStep from '@/components/onboarding/steps/ReviewStep'

const STEP_COMPONENTS = {
  welcome: WelcomeStep,
  basics: BasicsStep,
  intro: IntroStep,
  story: StoryStep,
  offerings: OfferingsStep,
  wholesale: WholesaleStep,
  products: ProductsStep,
  'find-us': FindUsStep,
  events: EventsStep,
  network: NetworkStep,
  'work-with-us': WorkWithUsStep,
  verification: VerificationStep,
  review: ReviewStep,
}

// Steps that need more than just the farm row — each fetches only what its own step
// actually uses, same shape as the flat profile hub's per-tab data-fetch.
async function extraProps(step, supabase, farm) {
  if (step === 'products') {
    const { data } = await supabase.from('products').select('*').eq('farm_id', farm.id).order('created_at', { ascending: false })
    return { initialProducts: data || [] }
  }
  if (step === 'wholesale') {
    const { data } = await supabase.from('sourcing_requests').select('*').eq('owner_type', 'farm').eq('owner_id', farm.id).order('created_at', { ascending: false })
    return { initialRequests: data || [] }
  }
  if (step === 'find-us' || step === 'events') {
    const { data } = await supabase.from('farm_locations').select('*').eq('farm_id', farm.id).order('sort_order', { ascending: true })
    return { initialLocations: data || [] }
  }
  if (step === 'network') {
    const entries = await getBusinessNetwork(supabase, { type: 'farm', id: farm.id, slug: farm.slug, name: farm.name })
    return { initialEntries: entries }
  }
  if (step === 'work-with-us') {
    const [{ data: workOptionRows }, { count: productCount }, { count: openSourcingCount }] = await Promise.all([
      supabase.from('business_work_options').select('*').eq('business_type', 'farm').eq('business_id', farm.id),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('farm_id', farm.id),
      supabase.from('sourcing_requests').select('id', { count: 'exact', head: true }).eq('owner_type', 'farm').eq('owner_id', farm.id).eq('status', 'open'),
    ])
    const ctx = { hasOpenSourcingRequests: Boolean(openSourcingCount), hasProducts: Boolean(productCount) }
    return {
      initialOptions: resolveWorkOptions(allowedWorkOptionKeys(farm, 'farm', ctx), defaultWorkOptionKeys(farm, 'farm', ctx), workOptionRows || []),
    }
  }
  if (step === 'verification') {
    const [{ data: documentTypes }, { data: requirements }, { data: documents }] = await Promise.all([
      supabase.from('document_types').select('*').order('category'),
      supabase.from('document_requirements').select('*'),
      supabase.from('documents').select('*').eq('farm_id', farm.id).order('uploaded_at', { ascending: false }),
    ])
    const wholesaleOnly = Boolean(farm.sells_wholesale)
    const requiredIds = requiredTypeIds(requirements || [], 'producer', farm.producer_type, wholesaleOnly)
    return { documentRows: buildDocumentRows(documentTypes || [], documents || [], requiredIds) }
  }
  if (step === 'review') {
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
      networkCount: (networkEntries || []).filter(e => e.status === 'accepted').length,
      workOptionCount: workOptionCount || 0,
      documentCount: documentCount || 0,
    }
    return { recommendations: buildProfileRecommendations(farm, ctx) }
  }
  return {}
}

export default async function OnboardingStepPage({ params }) {
  const { step } = params
  if (!IMPLEMENTED_ONBOARDING_STEPS.includes(step)) redirect('/onboarding')

  const StepComponent = STEP_COMPONENTS[step]

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: farm } = await supabase.from('farms').select('*').eq('owner_id', user.id).maybeSingle()
  if (!farm) redirect('/dashboard')

  const extra = await extraProps(step, supabase, farm)

  return <StepComponent farm={farm} {...extra} />
}
