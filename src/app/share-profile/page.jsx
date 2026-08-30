import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShareProfileClient from './ShareProfileClient'
import { overlayProducerCopy, displayLocation } from '@/lib/producerCopy'

export const metadata = { title: 'Share your Grano profile' }

export default async function ShareProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/share-profile')
  const { data: farm } = await supabase.from('farms').select('*').eq('owner_id', user.id).maybeSingle()
  if (!farm) redirect('/signup?as=producer')
  const f = overlayProducerCopy(farm)
  return <ShareProfileClient name={f.name} slug={f.slug} neighborhood={f.neighborhood || displayLocation(f)} />
}
