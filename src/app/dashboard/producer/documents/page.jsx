import { redirect } from 'next/navigation'

export default function ProducerDocumentsRedirect() {
  redirect('/dashboard/profile?section=producer&tab=documents')
}
