'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { allowedWorkOptionKeys, defaultWorkOptionKeys, resolveWorkOptions, WORK_OPTION_DEFS } from '@/lib/workOptions'

// Sends a structured Work With Us inquiry. to_type/to_id (which public profile this
// was sent from) come from the form — safe to trust since it's just "which business,"
// and the DB itself refuses a self-inquiry (work_inquiries_insert: not
// owns_business(to_type, to_id)). from_type/from_id ("acting as") are re-verified
// here even though RLS also enforces ownership at insert time, so a mistaken/stale
// client value fails with a clear message instead of a raw DB error.
export async function sendWorkInquiry(prevState, formData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to send an inquiry.' }

  const toType = formData.get('toType')?.toString()
  const toId = formData.get('toId')?.toString()
  const toSlug = formData.get('toSlug')?.toString() || null
  const fromType = formData.get('fromType')?.toString() || null
  const fromId = formData.get('fromId')?.toString() || null
  const inquiryType = formData.get('inquiryType')?.toString()

  if (!toType || !toId || !inquiryType) return { error: 'Missing required fields.' }

  if (fromType && fromId) {
    const table = fromType === 'farm' ? 'farms' : 'restaurants'
    const { data: owned } = await supabase.from(table).select('id').eq('id', fromId).eq('owner_id', user.id).maybeSingle()
    if (!owned) return { error: 'You can only send an inquiry as a business you own.' }
  }

  // Hard-block an inquiry_type the recipient doesn't currently accept — the picker
  // already only offers enabled options, so this only fires on a stale/tampered
  // request, not a normal user flow. Capability-driven (allowedWorkOptionKeys/
  // defaultWorkOptionKeys), not business-type-driven — the real enforcement boundary
  // for "does this business actually accept this inquiry type," since RLS itself only
  // checks that the recipient isn't the sender, not the inquiry_type's validity.
  const { data: recipient } = await supabase.from(toType === 'farm' ? 'farms' : 'restaurants').select('*').eq('id', toId).maybeSingle()
  if (!recipient) return { error: 'This business could not be found.' }
  const [{ data: workOptionRows }, { count: openSourcingCount }, { count: productCount }] = await Promise.all([
    supabase.from('business_work_options').select('*').eq('business_type', toType).eq('business_id', toId),
    // Mirrors src/app/producers/[slug]/page.jsx and src/app/restaurants/[slug]/page.jsx
    // — an open sourcing request also turns on the "sourcing" default there, so this
    // check has to match or a perfectly valid sourcing-response inquiry gets rejected
    // as "not accepted."
    supabase.from('sourcing_requests').select('id', { count: 'exact', head: true }).eq('owner_type', toType).eq('owner_id', toId).eq('status', 'open'),
    toType === 'farm'
      ? supabase.from('products').select('id', { count: 'exact', head: true }).eq('farm_id', toId)
      : Promise.resolve({ count: 0 }),
  ])
  const workOptionCtx = { hasOpenSourcingRequests: Boolean(openSourcingCount), hasProducts: Boolean(productCount) }
  const resolved = resolveWorkOptions(
    allowedWorkOptionKeys(recipient, toType, workOptionCtx),
    defaultWorkOptionKeys(recipient, toType, workOptionCtx),
    workOptionRows || [],
  )
  if (!resolved.find(o => o.key === inquiryType && o.enabled)) {
    return { error: 'This business does not currently accept that kind of inquiry.' }
  }

  const message = formData.get('message')?.toString().trim() || null
  const subject = formData.get('subject')?.toString().trim() || null
  const quantity = formData.get('quantity')?.toString().trim() || null
  const frequency = formData.get('frequency')?.toString() || null
  const desiredDate = formData.get('desiredDate')?.toString() || null
  const eventType = formData.get('eventType')?.toString().trim() || null
  const eventStartTime = formData.get('eventStartTime')?.toString() || null
  const eventEndTime = formData.get('eventEndTime')?.toString() || null
  const eventLocation = formData.get('eventLocation')?.toString().trim() || null
  const guestCount = formData.get('guestCount') ? Number(formData.get('guestCount')) : null
  const budget = formData.get('budget')?.toString().trim() || null
  const sourcingRequestId = formData.get('sourcingRequestId')?.toString() || null
  const productIds = formData.getAll('productIds').map(v => v.toString()).filter(Boolean)

  const { data: inquiry, error } = await supabase.from('work_inquiries').insert({
    to_type: toType,
    to_id: toId,
    sender_id: user.id,
    from_type: fromType || null,
    from_id: fromId || null,
    inquiry_type: inquiryType,
    subject,
    message,
    quantity,
    frequency,
    desired_date: desiredDate || null,
    event_type: eventType,
    event_start_time: eventStartTime || null,
    event_end_time: eventEndTime || null,
    event_location: eventLocation,
    guest_count: guestCount,
    budget,
    sourcing_request_id: sourcingRequestId || null,
  }).select().single()

  if (error) return { error: error.message }

  if (productIds.length) {
    // Best-effort — RLS (wip_insert) is the real guard here; a partially-linked
    // product shouldn't fail the inquiry that already succeeded.
    await supabase.from('work_inquiry_products').insert(productIds.map(product_id => ({ inquiry_id: inquiry.id, product_id })))
  }

  // messages.text is not-null, so a structured inquiry with no free-text note still
  // gets a starting thread entry — a short synthesized line rather than blank.
  const threadText = message || subject || `New ${WORK_OPTION_DEFS[inquiryType]?.label || 'Work With Us'} inquiry`
  await supabase.from('messages').insert({
    sender_id: user.id,
    inquiry_id: inquiry.id,
    farm_id: toType === 'farm' ? toId : null,
    recipient_id: recipient.owner_id,
    text: threadText,
  })

  if (toSlug) revalidatePath(toType === 'farm' ? `/producers/${toSlug}` : `/restaurants/${toSlug}`)
  return { success: true, inquiryId: inquiry.id }
}
