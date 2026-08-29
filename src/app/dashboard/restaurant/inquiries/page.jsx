import { redirect } from 'next/navigation'

// Sent inquiries now live in the Messages hub (the tab key changed from "sent" to
// "work-sent" when wholesale was absorbed into work_inquiries).
export default function RestaurantInquiriesRedirect() {
  redirect('/dashboard/messages?section=work-sent')
}
