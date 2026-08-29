import { redirect } from 'next/navigation'

export default function RestaurantDocumentsRedirect() {
  redirect('/dashboard/profile?section=restaurant&tab=documents')
}
