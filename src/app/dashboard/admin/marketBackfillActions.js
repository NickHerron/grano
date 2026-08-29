'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Links every farm_locations row sharing one free-text market name to a real
// organizations row, in one shot — the whole point of Phase 10 is that a producer
// who already typed "Logan Square Farmers Market" shouldn't have to go re-link it
// themselves in Find Us once an admin has matched that spelling to a real org.
export async function linkMarketLocations(locationIds, organizationId) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin only.' }

  if (!organizationId) return { error: 'Choose an organization.' }
  if (!locationIds?.length) return { error: 'No locations to link.' }

  const { error } = await supabase.from('farm_locations').update({ organization_id: organizationId }).in('id', locationIds)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin')
  return { success: true }
}
