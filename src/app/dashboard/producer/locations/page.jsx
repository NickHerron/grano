import { redirect } from 'next/navigation'

export default function ProducerLocationsRedirect() {
  redirect('/dashboard/profile?section=producer&tab=find-us')
}
