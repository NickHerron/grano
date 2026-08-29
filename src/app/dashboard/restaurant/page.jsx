import { redirect } from 'next/navigation'

// This was briefly a "Restaurant" hub page; its pieces now live in the Profile,
// Wholesale, and Messages hubs respectively (see dashboard/layout.jsx for the new
// top-level nav). Kept as a redirect in case anything still links here.
export default function RestaurantHubRedirect() {
  redirect('/dashboard/profile?section=restaurant')
}
