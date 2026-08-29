import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeRoles } from '@/lib/accountRoles'
import SignOutButton from './SignOutButton'
import NotificationBell from '@/components/NotificationBell'

export default async function DashboardLayout({ children }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: roleRows }, { data: notifications }, { data: organizations }] = await Promise.all([
    supabase.from('profiles').select('role, full_name, profile_photo_url, neighborhood').eq('id', user.id).single(),
    supabase.from('account_roles').select('role').eq('user_id', user.id),
    supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    // .limit(1) rather than .maybeSingle() — an owner can now have more than one
    // organization (Phase 5 of the Person/Organization Multi-Role plan), and
    // maybeSingle() throws when more than one row matches.
    supabase.from('organizations').select('id').eq('owner_id', user.id).limit(1),
  ])

  const roles = computeRoles(roleRows, profile?.role)
  const isProducer = roles.has('producer')
  const isRestaurant = roles.has('restaurant')
  const isAdmin = roles.has('admin')
  // Not a role — an organization is a business row anyone can create (see
  // dashboard/organization/actions.js) — so this tab only appears once one actually
  // exists, discovered via the "Create an Organization" entry point on Settings.
  const hasOrganization = Boolean(organizations?.length)

  // 8 primary sections, not 13+ — Profile absorbs the old "Your Profile" +
  // "Business/Restaurant Profile" + "Reviews"; Wholesale absorbs the marketplace link
  // + "Sourcing"; Messages absorbs "Inquiries" + "My Inquiries". Each of those hub
  // pages still has everything inside it as tabs — nothing was removed, just regrouped
  // so a dual-role account isn't staring at 13 top-level tabs to find one thing.
  const links = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/profile', label: 'Profile' },
    { href: '/dashboard/profiles', label: 'Your Profiles' },
    { href: '/dashboard/following', label: 'My Network' },
    ...(isProducer || isAdmin ? [{ href: '/dashboard/producer', label: 'Products' }] : []),
    ...(isProducer || isRestaurant || isAdmin ? [{ href: '/dashboard/wholesale', label: 'Wholesale' }] : []),
    ...(isProducer || isRestaurant || isAdmin ? [{ href: '/dashboard/share', label: 'Share' }] : []),
    ...(hasOrganization ? [{ href: '/dashboard/organization', label: 'Organization' }] : []),
    { href: '/dashboard/orders', label: 'Orders' },
    // Every signed-in account can send a Work With Us inquiry now (event booking,
    // custom order, general question) even without owning a business — not just
    // producers/restaurants messaging each other — so this is no longer gated to them.
    { href: '/dashboard/messages', label: 'Messages' },
    { href: '/dashboard/settings', label: 'Settings' },
    ...(isAdmin ? [{ href: '/dashboard/admin', label: 'Admin' }] : []),
  ]

  const roleLabels = { producer: 'Producer', restaurant: 'Restaurant', customer: 'Consumer', admin: 'Admin' }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="bg-soil px-4 sm:px-8 py-6">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {profile?.profile_photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profile_photo_url} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
            )}
            <div>
              <div className="font-serif text-[22px] font-semibold text-white">{profile?.full_name || user.email}</div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {[...roles].map(r => (
                  <span key={r} className="text-[10px] font-semibold uppercase tracking-wide text-white/70 bg-white/10 px-2 py-0.5 rounded">
                    {roleLabels[r] || r}
                  </span>
                ))}
                {profile?.neighborhood && (
                  <span className="text-[10px] text-white/50">{profile.neighborhood}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell userId={user.id} initialNotifications={notifications || []} />
            <SignOutButton />
          </div>
        </div>
      </div>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-8">
        <div className="flex gap-1 border-b border-[#ECEAE4] mb-8 overflow-x-auto scrollbar-hide">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className="text-[14px] font-medium px-4 py-2.5 border-b-2 border-transparent text-stone hover:text-soil hover:border-wheat transition-colors whitespace-nowrap flex-shrink-0">
              {l.label}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </div>
  )
}
