'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ROLE_DEFS, legacyValueForRole } from '@/lib/businessRoles'

const LEGACY_COLUMN = { farm: 'producer_type', restaurant: 'restaurant_type', organization: 'org_type' }

// Ownership itself is enforced by business_roles' RLS (owns_business()/is_admin(),
// same as business_work_options) — these actions don't re-check it, they just
// surface whatever error RLS returns in a way the UI can show.

// Changing the primary role is the one place a produce/organize-category role can
// never be assigned across tables — the primary role IS what determines which real
// table this entity's row lives in, so it must match the table the row already lives
// in. Additional (non-primary) roles have no such restriction — that's the whole
// point of the multi-role system (a farm can carry a 'caterer' tag).
export async function setPrimaryRole(businessType, businessId, roleKey) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const def = ROLE_DEFS[roleKey]
  if (!def) return { error: 'Not a valid role.' }
  if (def.table !== businessType) return { error: `${def.label} isn't a role for this kind of profile.` }

  // Clear the old primary first (if any) so the partial unique index never has two
  // is_primary rows for this entity at once, even for a moment.
  const { error: clearError } = await supabase.from('business_roles')
    .update({ is_primary: false })
    .eq('business_type', businessType).eq('business_id', businessId).eq('is_primary', true)
  if (clearError) return { error: clearError.message }

  const { error: upsertError } = await supabase.from('business_roles')
    .upsert(
      { business_type: businessType, business_id: businessId, role_key: roleKey, is_primary: true },
      { onConflict: 'business_type,business_id,role_key' },
    )
  if (upsertError) return { error: upsertError.message }

  // Write-through: the legacy type column stays authoritative for every existing
  // badge/filter/document requirement, so it's mirrored here rather than replaced.
  const legacyColumn = LEGACY_COLUMN[businessType]
  const legacyValue = legacyValueForRole(roleKey)
  if (legacyColumn && legacyValue) {
    const table = businessType === 'farm' ? 'farms' : businessType === 'restaurant' ? 'restaurants' : 'organizations'
    const { error: legacyError } = await supabase.from(table).update({ [legacyColumn]: legacyValue }).eq('id', businessId)
    if (legacyError) return { error: legacyError.message }
  }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/organization')
  return { success: true }
}

export async function addRoleTag(businessType, businessId, roleKey) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const def = ROLE_DEFS[roleKey]
  if (!def) return { error: 'Not a valid role.' }

  const { error } = await supabase.from('business_roles')
    .insert({ business_type: businessType, business_id: businessId, role_key: roleKey, is_primary: false })
  if (error) return error.code === '23505' ? { error: 'Already added.' } : { error: error.message }

  // Mirror produce-category additional roles into farms.secondary_types — the
  // existing directory/capability code (ProducersDirectory.jsx, workOptions.js)
  // already reads that array, so this gives the new role real filtering/capability
  // behavior immediately, with no new code needed there.
  if (businessType === 'farm' && def.category === 'produce') {
    const { data: farm } = await supabase.from('farms').select('secondary_types').eq('id', businessId).single()
    const current = farm?.secondary_types || []
    if (!current.includes(def.legacyValue)) {
      await supabase.from('farms').update({ secondary_types: [...current, def.legacyValue] }).eq('id', businessId)
    }
  }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/organization')
  return { success: true }
}

// Warn-not-delete removal. First call (force omitted/false): if the role has real
// dependent data, returns { warning } instead of deleting — the UI shows that warning
// and re-calls with force:true to actually remove it. Never silently deletes.
export async function removeRoleTag(businessType, businessId, roleKey, { force = false } = {}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const { data: row } = await supabase.from('business_roles').select('is_primary')
    .eq('business_type', businessType).eq('business_id', businessId).eq('role_key', roleKey).maybeSingle()
  if (!row) return { success: true } // already gone
  if (row.is_primary) return { error: 'Change your primary role first — every profile needs exactly one primary role.' }

  if (!force) {
    if (roleKey === 'pickup_location' && businessType === 'organization') {
      const { count } = await supabase.from('farm_locations').select('id', { count: 'exact', head: true }).eq('organization_id', businessId)
      if (count > 0) return { warning: `${count} producer${count === 1 ? '' : 's'} link${count === 1 ? 's' : ''} a Find Us location to this organization as a pickup point. Removing this role won't unlink them, but it will stop this profile showing as a pickup location elsewhere. Remove anyway?` }
    }
    if (roleKey === 'event_venue') {
      const { data: eventOption } = await supabase.from('business_work_options').select('id')
        .eq('business_type', businessType).eq('business_id', businessId).eq('option_key', 'event').eq('enabled', true).maybeSingle()
      if (eventOption) return { warning: 'Event/Booking is currently enabled under Work With Us. Removing this role won’t turn that off, but it will stop this profile showing as an event venue elsewhere. Remove anyway?' }
    }
  }

  const def = ROLE_DEFS[roleKey]
  if (businessType === 'farm' && def?.category === 'produce') {
    const { data: farm } = await supabase.from('farms').select('secondary_types').eq('id', businessId).single()
    const current = farm?.secondary_types || []
    if (current.includes(def.legacyValue)) {
      await supabase.from('farms').update({ secondary_types: current.filter(t => t !== def.legacyValue) }).eq('id', businessId)
    }
  }

  const { error } = await supabase.from('business_roles').delete()
    .eq('business_type', businessType).eq('business_id', businessId).eq('role_key', roleKey)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/organization')
  return { success: true }
}
