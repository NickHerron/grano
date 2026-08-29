'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not authorized')
  return user
}

// Deletes an account entirely — the auth user, which cascades (via existing FKs) to
// their profile, farm/restaurant, products, orders, messages, everything. This needs
// the service-role client; there's no way to delete an auth user from the browser.
export async function deleteAccount(userId) {
  const me = await requireAdmin()
  if (userId === me.id) return { error: "You can't delete your own account." }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin')
  return { success: true }
}
