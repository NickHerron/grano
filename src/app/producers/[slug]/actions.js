'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function submitReview(prevState, formData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to leave a review.' }

  const farmId = formData.get('farmId')
  const slug = formData.get('slug')
  const orderId = formData.get('orderId')?.toString() || null
  const rating = Number(formData.get('rating'))
  const text = formData.get('text')?.toString().trim()

  if (!rating || rating < 1 || rating > 5) return { error: 'Please choose a star rating.' }

  const { error } = await supabase.from('reviews').insert({
    farm_id: farmId,
    buyer_id: user.id,
    order_id: orderId,
    rating,
    text: text || null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/producers/${slug}`)
  return { success: true }
}

// Invite-based review: no purchase required, validated server-side against a
// producer-issued token via the submit_invited_review() function, which also marks
// the invite as used so it can't be reused.
export async function submitInvitedReview(prevState, formData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to leave a review.' }

  const token = formData.get('token')?.toString()
  const slug = formData.get('slug')?.toString()
  const rating = Number(formData.get('rating'))
  const text = formData.get('text')?.toString().trim()

  if (!token) return { error: 'Missing review link.' }
  if (!rating || rating < 1 || rating > 5) return { error: 'Please choose a star rating.' }

  const { error } = await supabase.rpc('submit_invited_review', {
    p_token: token,
    p_rating: rating,
    p_text: text || null,
  })

  if (error) return { error: error.message }

  if (slug) revalidatePath(`/producers/${slug}`)
  return { success: true }
}

// sendWholesaleInquiry() was removed as part of the Work With Us cutover — wholesale
// now goes through sendWorkInquiry() in src/lib/actions/inquiries.js, same as every
// other inquiry type. The old wholesale_inquiries table is kept as a read-only
// archive; nothing writes to it anymore.
