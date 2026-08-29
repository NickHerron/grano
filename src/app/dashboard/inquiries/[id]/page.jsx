import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InquiryDetail from './InquiryDetail'

export default async function InquiryDetailPage({ params }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/dashboard/inquiries/${params.id}`)

  // RLS (work_inquiries_select) already restricts this to participants only — a
  // non-participant's request simply returns no row, which reads as "not found"
  // rather than leaking that the inquiry exists.
  const { data: inquiry } = await supabase.from('work_inquiries').select('*').eq('id', params.id).maybeSingle()
  if (!inquiry) notFound()

  const isRecipientSide = inquiry.to_type === 'farm'
    ? Boolean((await supabase.from('farms').select('id').eq('id', inquiry.to_id).eq('owner_id', user.id).maybeSingle()).data)
    : Boolean((await supabase.from('restaurants').select('id').eq('id', inquiry.to_id).eq('owner_id', user.id).maybeSingle()).data)

  // Best-effort "mark opened" the first time the recipient views it — never blocks
  // rendering if it fails.
  if (isRecipientSide && !inquiry.opened_at) {
    supabase.from('work_inquiries').update({ opened_at: new Date().toISOString() }).eq('id', inquiry.id).then(() => {})
  }

  const [{ data: toBiz }, { data: fromBiz }, { data: productRows }, { data: messages }] = await Promise.all([
    supabase.from(inquiry.to_type === 'farm' ? 'farms' : 'restaurants').select('id, name, slug, logo_url, owner_id').eq('id', inquiry.to_id).maybeSingle(),
    inquiry.from_type
      ? supabase.from(inquiry.from_type === 'farm' ? 'farms' : 'restaurants').select('id, name, slug, logo_url').eq('id', inquiry.from_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('work_inquiry_products').select('product:products(id, name, slug)').eq('inquiry_id', inquiry.id),
    supabase.from('messages').select('*, sender:profiles!messages_sender_id_fkey(restaurant_name, full_name)').eq('inquiry_id', inquiry.id).order('created_at', { ascending: true }),
  ])

  const products = (productRows || []).map(r => r.product).filter(Boolean)

  return (
    <InquiryDetail
      inquiry={inquiry}
      toBusiness={toBiz ? { ...toBiz, type: inquiry.to_type } : null}
      fromBusiness={fromBiz ? { ...fromBiz, type: inquiry.from_type } : null}
      products={products}
      messages={messages || []}
      currentUserId={user.id}
      isRecipientSide={isRecipientSide}
    />
  )
}
