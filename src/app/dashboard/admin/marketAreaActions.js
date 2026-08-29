'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slugify'

// RLS on market_areas already restricts insert/update/delete to public.is_admin(),
// so the regular RLS-scoped client is correct here (unlike the geography backfill,
// which needs the service-role client to touch rows across every owner) — the acting
// user genuinely is the admin, and the policy itself enforces that.
export async function createMarketArea(formData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const city = formData.get('city')?.toString().trim()
  const state = formData.get('state')?.toString().trim().toUpperCase()
  if (!city) return { error: 'City is required.' }
  if (!state || state.length !== 2) return { error: 'State must be a 2-letter code, e.g. IL.' }

  const { error } = await supabase.from('market_areas').insert({ city, state, slug: slugify(city), marketplace_enabled: false })
  if (error) return { error: error.code === '23505' ? 'That area already exists.' : error.message }

  revalidatePath('/dashboard/admin')
  return { success: true }
}

export async function toggleMarketArea(id, enabled) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const { error } = await supabase.from('market_areas').update({ marketplace_enabled: enabled }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin')
  return { success: true }
}
