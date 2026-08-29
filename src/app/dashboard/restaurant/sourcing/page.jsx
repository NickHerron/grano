import { redirect } from 'next/navigation'

// Sourcing now lives in the Wholesale hub.
export default function SourcingRedirect() {
  redirect('/dashboard/wholesale?section=sourcing')
}
