import { redirect } from 'next/navigation'

export default function ProducerMessagesRedirect() {
  redirect('/dashboard/messages?section=inbox')
}
