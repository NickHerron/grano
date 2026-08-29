import { redirect } from 'next/navigation'

// Restaurant profile now lives at Profile → Restaurant Profile.
export default function RestaurantProfileRedirect() {
  redirect('/dashboard/profile?section=restaurant')
}
