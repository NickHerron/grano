'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Adds a role to the signed-in user's account without touching any role they already
// have — this is the "one account, multiple roles" switcher. Producer additionally
// needs a farm to exist, so it creates one (mirroring what signup does) if the user
// doesn't already own one.
export async function addRole(formData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const role = formData.get('role')?.toString()
  if (!['producer', 'restaurant', 'customer'].includes(role)) {
    return { error: 'That role can\'t be self-added.' }
  }

  const { error: roleError } = await supabase.from('account_roles').insert({ user_id: user.id, role })
  if (roleError && roleError.code !== '23505') return { error: roleError.message } // 23505 = already has it

  if (role === 'restaurant') {
    const { data: existingRestaurant } = await supabase.from('restaurants').select('id').eq('owner_id', user.id).maybeSingle()
    if (!existingRestaurant) {
      const restaurantName = formData.get('restaurantName')?.toString().trim()
      if (!restaurantName) return { error: 'Restaurant / business name is required.' }
      const slug = restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + user.id.slice(0, 6)
      const { error: restaurantError } = await supabase.from('restaurants').insert({ owner_id: user.id, slug, name: restaurantName })
      if (restaurantError) return { error: restaurantError.message }
      await supabase.from('profiles').update({ restaurant_name: restaurantName }).eq('id', user.id)
    }
  }

  if (role === 'producer') {
    const { data: existingFarm } = await supabase.from('farms').select('id').eq('owner_id', user.id).maybeSingle()
    if (!existingFarm) {
      const farmName = formData.get('farmName')?.toString().trim()
      const farmLocation = formData.get('farmLocation')?.toString().trim()
      if (!farmName) return { error: 'Farm / business name is required.' }
      const slug = farmName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + user.id.slice(0, 6)
      const { error: farmError } = await supabase.from('farms').insert({
        owner_id: user.id, slug, name: farmName, location: farmLocation || null,
      })
      if (farmError) return { error: farmError.message }
    }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
