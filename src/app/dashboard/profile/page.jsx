import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { computeRoles } from '@/lib/accountRoles'
import { requiredTypeIds, buildDocumentRows } from '@/lib/documentRequirements'
import { allowedWorkOptionKeys, defaultWorkOptionKeys, resolveWorkOptions } from '@/lib/workOptions'
import { getRolesFor } from '@/lib/businessRoleQueries'
import { getAreaMemberships, getActiveAreas } from '@/lib/locationQueries'
import SectionTabs from '@/components/SectionTabs'
import ProfileEditForm from './ProfileEditForm'
import ProducerProfileContent from '../producer/profile/ProducerProfileContent'
import RestaurantProfileContent from '../restaurant/profile/RestaurantProfileContent'

// One Profile hub instead of separate "Your Profile" / "Business Profile" /
// "Restaurant Profile" top-level items — Personal is always there, Producer and/or
// Restaurant tabs show up only for roles the account actually has. Each of those two
// has its own nested tab strip (Basic Info/Photos/.../Reviews), so this is a two-level
// tab structure: outer ?section=, inner ?tab=.
export default async function ProfileHubPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: roleRows }, { data: farm }, { data: restaurant }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('account_roles').select('role').eq('user_id', user.id),
    supabase.from('farms').select('*').eq('owner_id', user.id).maybeSingle(),
    supabase.from('restaurants').select('*').eq('owner_id', user.id).maybeSingle(),
  ])
  const roles = computeRoles(roleRows, profile?.role)
  const isProducer = (roles.has('producer') || roles.has('admin')) && farm
  const isRestaurant = roles.has('restaurant') && restaurant

  let producerTabContent = null
  if (isProducer) {
    const [{ data: photos }, { data: locations }, { data: posts }, { data: documentTypes }, { data: requirements }, { data: documents }, { data: invites }, { data: reviews }, { data: workOptionRows }, { count: productCount }, { data: sourcingRequests }] = await Promise.all([
      supabase.from('farm_photos').select('*').eq('farm_id', farm.id).order('sort_order', { ascending: true }),
      supabase.from('farm_locations').select('*, organization:organizations(id, name, slug)').eq('farm_id', farm.id).order('sort_order', { ascending: true }),
      supabase.from('farm_posts').select('*').eq('farm_id', farm.id).order('created_at', { ascending: false }),
      supabase.from('document_types').select('*').order('category'),
      supabase.from('document_requirements').select('*'),
      supabase.from('documents').select('*').eq('farm_id', farm.id).order('uploaded_at', { ascending: false }),
      supabase.from('review_invites').select('*').eq('farm_id', farm.id).order('created_at', { ascending: false }),
      supabase.from('reviews').select('*, buyer:profiles(restaurant_name, full_name)').eq('farm_id', farm.id).order('created_at', { ascending: false }),
      supabase.from('business_work_options').select('*').eq('business_type', 'farm').eq('business_id', farm.id),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('farm_id', farm.id),
      supabase.from('sourcing_requests').select('*').eq('owner_type', 'farm').eq('owner_id', farm.id).order('created_at', { ascending: false }),
    ])
    const wholesaleOnly = Boolean(farm.sells_wholesale)
    const requiredIds = requiredTypeIds(requirements || [], 'producer', farm.producer_type, wholesaleOnly)
    const documentRows = buildDocumentRows(documentTypes || [], documents || [], requiredIds)
    const workOptionCtx = { hasOpenSourcingRequests: (sourcingRequests || []).some(r => r.status === 'open'), hasProducts: Boolean(productCount) }
    const workOptions = resolveWorkOptions(
      allowedWorkOptionKeys(farm, 'farm', workOptionCtx),
      defaultWorkOptionKeys(farm, 'farm', workOptionCtx),
      workOptionRows || [],
    )
    const [roles, memberships, activeAreas] = await Promise.all([
      getRolesFor(supabase, 'farm', farm.id),
      getAreaMemberships(supabase, 'farm', farm.id),
      getActiveAreas(),
    ])
    producerTabContent = (
      <ProducerProfileContent farm={farm} photos={photos || []} locations={locations || []} posts={posts || []}
        documentRows={documentRows} reviewInvites={invites || []} reviews={reviews || []} workOptions={workOptions}
        sourcingRequests={sourcingRequests || []} roles={roles} memberships={memberships} availableAreas={activeAreas} />
    )
  }

  let restaurantTabContent = null
  if (isRestaurant) {
    const [{ data: documentTypes }, { data: requirements }, { data: documents }, { data: sourcingRequests }, { data: workOptionRows }] = await Promise.all([
      supabase.from('document_types').select('*').order('category'),
      supabase.from('document_requirements').select('*'),
      supabase.from('documents').select('*').eq('restaurant_id', restaurant.id).order('uploaded_at', { ascending: false }),
      supabase.from('sourcing_requests').select('*').eq('owner_type', 'restaurant').eq('owner_id', restaurant.id).order('created_at', { ascending: false }),
      supabase.from('business_work_options').select('*').eq('business_type', 'restaurant').eq('business_id', restaurant.id),
    ])
    const requiredIds = requiredTypeIds(requirements || [], 'restaurant', restaurant.restaurant_type, false)
    const documentRows = buildDocumentRows(documentTypes || [], documents || [], requiredIds)
    const restaurantWorkOptionCtx = { hasOpenSourcingRequests: (sourcingRequests || []).some(r => r.status === 'open') }
    const workOptions = resolveWorkOptions(
      allowedWorkOptionKeys(restaurant, 'restaurant', restaurantWorkOptionCtx),
      defaultWorkOptionKeys(restaurant, 'restaurant', restaurantWorkOptionCtx),
      workOptionRows || [],
    )
    const [roles, memberships, activeAreas] = await Promise.all([
      getRolesFor(supabase, 'restaurant', restaurant.id),
      getAreaMemberships(supabase, 'restaurant', restaurant.id),
      getActiveAreas(),
    ])
    restaurantTabContent = (
      <RestaurantProfileContent restaurant={restaurant} documentRows={documentRows} workOptions={workOptions} sourcingRequests={sourcingRequests || []}
        roles={roles} memberships={memberships} availableAreas={activeAreas} />
    )
  }

  const tabs = [
    { key: 'personal', label: 'Personal', content: <ProfileEditForm profile={profile} /> },
    ...(isProducer ? [{ key: 'producer', label: 'Producer Profile', content: producerTabContent }] : []),
    ...(isRestaurant ? [{ key: 'restaurant', label: 'Restaurant Profile', content: restaurantTabContent }] : []),
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">Profile</h1>
        <p className="text-[14px] text-stone">Your personal profile, plus any business profile you manage — all in one place.</p>
      </div>
      <Suspense fallback={null}>
        <SectionTabs tabs={tabs} paramName="section" />
      </Suspense>
    </div>
  )
}
