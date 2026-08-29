'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Ownership is enforced by business_area_memberships' RLS (owns_business()/
// is_admin(), same as business_roles) — these actions don't re-check it, they just
// surface whatever error RLS returns.
export async function addAreaMembership(businessType, businessId, state, city) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }
  if (!state || !city) return { error: 'Choose a community.' }

  const { data, error } = await supabase.from('business_area_memberships')
    .insert({ business_type: businessType, business_id: businessId, state: state.toUpperCase(), city })
    .select('id, state, city').single()
  if (error) return error.code === '23505' ? { error: 'Already part of that community.' } : { error: error.message }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/organization')
  revalidatePath('/locations')
  return { success: true, membership: data }
}

export async function removeAreaMembership(id) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const { error } = await supabase.from('business_area_memberships').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/organization')
  revalidatePath('/locations')
  return { success: true }
}
