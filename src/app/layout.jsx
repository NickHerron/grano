import './globals.css'
import Nav from '@/components/Nav'
import SiteFooter from '@/components/SiteFooter'
import FeedbackButton from '@/components/feedback/FeedbackButton'
import { createClient } from '@/lib/supabase/server'
import { computeRoles } from '@/lib/accountRoles'
import { resolveArea } from '@/lib/locationQueries'

export const metadata = {
  title: "Grano — Chicago's Local Food Network",
  description: "Meet the people who make your food. Farms, bakeries, and producers you can find this week.",
}

export default async function RootLayout({ children }) {
  const supabase = createClient()
  const [{ data: { user } }, area] = await Promise.all([
    supabase.auth.getUser(),
    resolveArea(),
  ])
  let profile = null
  let feedbackContext = null
  if (user) {
    const [{ data }, { data: roleRows }, { data: farm }, { data: restaurant }] = await Promise.all([
      supabase.from('profiles').select('role, full_name').eq('id', user.id).single(),
      supabase.from('account_roles').select('role').eq('user_id', user.id),
      supabase.from('farms').select('id, producer_type').eq('owner_id', user.id).maybeSingle(),
      supabase.from('restaurants').select('id, restaurant_type').eq('owner_id', user.id).maybeSingle(),
    ])
    profile = data

    const roles = computeRoles(roleRows, profile?.role)
    feedbackContext = {
      accountType: [...roles].join(', ') || null,
      businessKind: farm ? 'farm' : restaurant ? 'restaurant' : null,
      businessId: farm?.id || restaurant?.id || null,
      businessType: farm?.producer_type || restaurant?.restaurant_type || null,
    }
  }

  return (
    <html lang="en">
      <body>
        <Nav user={user ? { email: user.email, ...profile } : null} area={area} />
        <main>{children}</main>
        <SiteFooter />
        {user && <FeedbackButton context={feedbackContext} />}
      </body>
    </html>
  )
}
