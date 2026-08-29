import { redirect } from 'next/navigation'

// Inquiries received now lives in the Messages hub (the tab key changed from
// "inquiries" to "work-received" when wholesale was absorbed into work_inquiries).
export default function ProducerInquiriesRedirect() {
  redirect('/dashboard/messages?section=work-received')
}
