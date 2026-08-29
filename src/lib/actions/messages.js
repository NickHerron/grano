'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function sendMessage(prevState, formData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in as a restaurant to message producers.' }

  const farmId = formData.get('farmId') || null
  const text = formData.get('text')?.toString().trim()
  if (!text) return { error: 'Write a message first.' }

  const { error } = await supabase.from('messages').insert({
    sender_id: user.id,
    farm_id: farmId,
    text,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/producer/messages')
  return { success: true }
}
