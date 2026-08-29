'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ROLE_DEFS, legacyValueForRole } from '@/lib/businessRoles'
import { addRole } from '../roleActions'
import { findSimilarOrganizations, insertOrganizationWithSlug } from '@/lib/organizationNames'

// The "What are you creating?" wizard's Organization branch. Routes to a table by the
// chosen primary role's category — Produce -> farms, Sell/Serve -> restaurants,
// Organize/Places -> organizations — because that's a capability decision, not a
// presentation one (only farms rows can own products; work options/sourcing/follows
// are farm/restaurant-only). Reuses the existing addRole() for farm/restaurant
// creation rather than reimplementing it, so a farm or restaurant created this way
// also gets the matching account role (producer/restaurant) exactly the way it
// already does via Settings' "Add a role" flow — the one explicit, one-directional
// place a PROFILE ROLE touches an ACCOUNT ROLE.
export async function createProfileFromRoles({ primaryRoleKey, additionalRoleKeys = [], name, location, confirmedDuplicate = false }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const primaryDef = ROLE_DEFS[primaryRoleKey]
  if (!primaryDef) return { error: 'Choose a valid primary role.' }
  const trimmedName = name?.trim()
  if (!trimmedName) return { error: 'Name is required.' }

  const table = primaryDef.table
  let businessId = null
  let redirectHref = null

  if (table === 'farm') {
    const { data: existing } = await supabase.from('farms').select('id').eq('owner_id', user.id).maybeSingle()
    if (existing) return { error: 'You already have a producer profile.', existingHref: '/dashboard/profile?section=producer' }
    const formData = new FormData()
    formData.set('role', 'producer')
    formData.set('farmName', trimmedName)
    formData.set('farmLocation', location?.trim() || '')
    const result = await addRole(formData)
    if (result.error) return { error: result.error }
    const { data: farm } = await supabase.from('farms').select('id').eq('owner_id', user.id).single()
    businessId = farm.id
    redirectHref = '/dashboard/profile?section=producer'
  } else if (table === 'restaurant') {
    const { data: existing } = await supabase.from('restaurants').select('id').eq('owner_id', user.id).maybeSingle()
    if (existing) return { error: 'You already have a restaurant profile.', existingHref: '/dashboard/profile?section=restaurant' }
    const formData = new FormData()
    formData.set('role', 'restaurant')
    formData.set('restaurantName', trimmedName)
    const result = await addRole(formData)
    if (result.error) return { error: result.error }
    const { data: restaurant } = await supabase.from('restaurants').select('id').eq('owner_id', user.id).single()
    businessId = restaurant.id
    redirectHref = '/dashboard/profile?section=restaurant'
  } else {
    // organization — multiple allowed per owner (Phase 5). Slug-retry insert and the
    // advisory duplicate check both live in organizationNames.js, shared with
    // dashboard/organization/actions.js's createOrganization().
    if (!confirmedDuplicate) {
      const duplicates = await findSimilarOrganizations(supabase, trimmedName)
      if (duplicates.length) return { duplicates }
    }
    const { data: org, error } = await insertOrganizationWithSlug(supabase, {
      ownerId: user.id, name: trimmedName, orgType: legacyValueForRole(primaryRoleKey), location: location?.trim(),
    })
    if (error) return { error: error.message || 'Could not create organization.' }
    businessId = org.id
    redirectHref = `/dashboard/organization?org=${businessId}`
  }

  const { error: primaryRoleError } = await supabase.from('business_roles')
    .insert({ business_type: table, business_id: businessId, role_key: primaryRoleKey, is_primary: true })
  if (primaryRoleError) return { error: primaryRoleError.message }

  const additionalRows = [...new Set(additionalRoleKeys)]
    .filter(k => k !== primaryRoleKey && ROLE_DEFS[k])
    .map(roleKey => ({ business_type: table, business_id: businessId, role_key: roleKey, is_primary: false }))
  if (additionalRows.length) await supabase.from('business_roles').insert(additionalRows)

  // Mirror produce-category additional roles into farms.secondary_types, same as
  // roleTagActions.addRoleTag() does for an existing farm gaining a role later.
  if (table === 'farm') {
    const produceLegacyValues = additionalRows
      .filter(r => ROLE_DEFS[r.role_key]?.category === 'produce')
      .map(r => ROLE_DEFS[r.role_key].legacyValue)
    if (produceLegacyValues.length) {
      await supabase.from('farms').update({ secondary_types: produceLegacyValues }).eq('id', businessId)
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profiles')
  return { success: true, redirectHref }
}
