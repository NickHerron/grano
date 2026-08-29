import './globals.css'
import Nav from '@/components/Nav'
import FeedbackButton from '@/components/feedback/FeedbackButton'
import { createClient } from '@/lib/supabase/server'
import { computeRoles } from '@/lib/accountRoles'
import { resolveArea } from '@/lib/locationQueries'

export const metadata = {
  title: "Grano — Chicago's Local Food Network",
  description: "Discover local producers. Source local ingredients. Buy local food. Grano connects Chicago-area farms, food producers, restaurants, and the people who eat what they make.",
}

export default async function RootLayout({ children }) {
  const supabase = createClient()
  const [{ data: { user } }, area] = await Promise.all([
    supabase.auth.getUser(),
    resolveArea(),
  ])
  let profile = null
  let cartCount = 0
  let feedbackContext = null
  if (user) {
    // Same conditional-fetch-when-signed-in block RootLayout already had for Nav —
    // extended with a lightweight roles/business lookup so the feedback button can
    // stamp every submission with automatic context (account type, business type)
    // without the user ever being asked. No client-side auth context exists anywhere
    // in this codebase (confirmed) — this is the one canonical top-level user fetch,
    // so a plain prop into FeedbackButton is simpler than introducing new provider
    // infrastructure for a single consumer.
    const [{ data }, { data: cartRows }, { data: roleRows }, { data: farm }, { data: restaurant }] = await Promise.all([
      supabase.from('profiles').select('role, full_name').eq('id', user.id).single(),
      supabase.from('cart_items').select('quantity').eq('user_id', user.id),
      supabase.from('account_roles').select('role').eq('user_id', user.id),
      supabase.from('farms').select('id, producer_type').eq('owner_id', user.id).maybeSingle(),
      supabase.from('restaurants').select('id, restaurant_type').eq('owner_id', user.id).maybeSingle(),
    ])
    profile = data
    cartCount = (cartRows || []).reduce((s, r) => s + r.quantity, 0)

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
        <Nav user={user ? { email: user.email, ...profile } : null} cartCount={cartCount} area={area} />
        <main>{children}</main>
        {user && <FeedbackButton context={feedbackContext} />}
      </body>
    </html>
  )
}
