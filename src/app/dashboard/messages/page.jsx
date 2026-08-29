import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import SectionTabs from '@/components/SectionTabs'
import MessagesContent from '../producer/messages/MessagesContent'
import ProducerRepliesContent from './ProducerRepliesContent'
import WorkInquiriesContent from './WorkInquiriesContent'
import { hydrateInquiryBusinesses } from '@/lib/inquiryQueries'

// All communication in one place. Wholesale inquiries used to be their own separate
// table/inbox (received on the producer side, sent on the restaurant side) — as of
// the Work With Us cutover, every inquiry type including wholesale flows through
// work_inquiries, so "Inquiries Received"/"Inquiries Sent" here now covers all of it.
// Inbox/Replies stay for genuinely freeform messages that aren't tied to a structured
// inquiry (filtered by inquiry_id is null, so a conversation never shows up twice).
export default async function MessagesHubPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: farm }, { data: restaurant }] = await Promise.all([
    supabase.from('farms').select('id, name').eq('owner_id', user.id).maybeSingle(),
    supabase.from('restaurants').select('id').eq('owner_id', user.id).maybeSingle(),
  ])
  // No redirect here anymore — any signed-in user (not just a producer/restaurant
  // owner) can have sent a Work With Us inquiry and needs somewhere to see it.

  const tabs = []

  // Work With Us inquiries — received on either owned business, sent as either
  // business or as yourself. This now includes wholesale.
  const receivedFilters = []
  if (farm) receivedFilters.push(`and(to_type.eq.farm,to_id.eq.${farm.id})`)
  if (restaurant) receivedFilters.push(`and(to_type.eq.restaurant,to_id.eq.${restaurant.id})`)
  const [{ data: workReceivedRaw }, { data: workSentRaw }] = await Promise.all([
    receivedFilters.length
      ? supabase.from('work_inquiries').select('*').or(receivedFilters.join(',')).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from('work_inquiries').select('*').eq('sender_id', user.id).order('created_at', { ascending: false }),
  ])
  const [workReceived, workSent] = await Promise.all([
    hydrateInquiryBusinesses(supabase, workReceivedRaw || []),
    hydrateInquiryBusinesses(supabase, workSentRaw || []),
  ])
  const workReceivedNew = workReceived.filter(i => i.status === 'new').length

  // "Received" only means anything for an account that owns a business — a plain
  // consumer can only ever send, never receive, so skip showing them an always-empty tab.
  if (farm || restaurant) {
    tabs.push({ key: 'work-received', label: 'Inquiries Received', badge: workReceivedNew || null, content: <WorkInquiriesContent inquiries={workReceived} perspective="received" /> })
  }
  tabs.push({ key: 'work-sent', label: 'Inquiries Sent', content: <WorkInquiriesContent inquiries={workSent} perspective="sent" /> })

  if (farm) {
    // inquiry_id is null here on purpose — anything tied to a structured inquiry has
    // its own thread on that inquiry's detail page (see the tabs above); without this
    // filter the same conversation would render twice.
    const { data: messages } = await supabase.from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(restaurant_name, full_name)')
      .or(`farm_id.eq.${farm.id},farm_id.is.null`).is('inquiry_id', null).order('created_at', { ascending: false })
    // Best-effort mark-as-read, scoped to this farm's direct messages only — open
    // broadcasts (farm_id null) are shared across every producer, so read_at there
    // can't mean "read by me" without affecting what every other producer sees.
    supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('farm_id', farm.id).is('read_at', null).then(() => {})

    const unread = (messages || []).filter(m => !m.read_at && m.farm_id !== null && m.sender_id !== user.id).length

    tabs.push({ key: 'inbox', label: 'Inbox', badge: unread || null, content: (
      <MessagesContent farmId={farm.id} farmName={farm.name} currentUserId={user.id} messages={messages || []} />
    ) })
  }

  if (restaurant) {
    const { data: replies } = await supabase.from('messages')
      .select('*, farm:farms(name, slug)').eq('recipient_id', user.id).is('inquiry_id', null).order('created_at', { ascending: false })
    tabs.push({ key: 'replies', label: 'From Producers', badge: replies?.length || null, content: <ProducerRepliesContent replies={replies || []} /> })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">Messages</h1>
        <p className="text-[14px] text-stone">Direct messages and Work With Us inquiries, in one inbox.</p>
      </div>
      <Suspense fallback={null}>
        <SectionTabs tabs={tabs} paramName="section" />
      </Suspense>
    </div>
  )
}
