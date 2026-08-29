import { redirect } from 'next/navigation'

// Producer profile now lives at Profile → Producer Profile.
export default function ProducerProfileRedirect() {
  redirect('/dashboard/profile?section=producer')
}
