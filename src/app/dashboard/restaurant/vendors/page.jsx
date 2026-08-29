import { redirect } from 'next/navigation'

// "My Vendors" was just the farms half of "Following" rendered on a second page —
// same follows table, same data, no restaurant-specific fields it didn't already
// have. Consolidated into Following (which now also shows the wholesale badge) to
// stop showing the same list under two different tabs.
export default function MyVendorsRedirect() {
  redirect('/dashboard/following')
}
