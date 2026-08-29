import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRolesForMany } from '@/lib/businessRoleQueries'
import { roleLabel } from '@/lib/businessRoles'
import { getInitials } from '@/lib/initials'

// Phase 6 of the Person/Organization Multi-Role plan — "Your Profiles," the one place
// that lists everything a single Grano account manages: the personal profile, the one
// farm, the one restaurant (still one-per-owner — see the plan's explicit scoping),
// and every organization (now many-per-owner as of Phase 5). Purely additive: it
// doesn't change what any existing page shows, it's a new way to get to them.
export default async function ProfilesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: farm }, { data: restaurant }, { data: organizations }] = await Promise.all([
    supabase.from('profiles').select('full_name, profile_photo_url').eq('id', user.id).single(),
    supabase.from('farms').select('id, name, logo_url, slug').eq('owner_id', user.id).maybeSingle(),
    supabase.from('restaurants').select('id, name, logo_url, slug').eq('owner_id', user.id).maybeSingle(),
    supabase.from('organizations').select('id, name, logo_url, slug').eq('owner_id', user.id).order('created_at', { ascending: true }),
  ])

  const businesses = [
    ...(farm ? [{ type: 'farm', typeLabel: 'Producer', ...farm, href: '/dashboard/profile?section=producer' }] : []),
    ...(restaurant ? [{ type: 'restaurant', typeLabel: 'Restaurant', ...restaurant, href: '/dashboard/profile?section=restaurant' }] : []),
    ...(organizations || []).map(o => ({ type: 'organization', typeLabel: 'Organization', ...o, href: `/dashboard/organization?org=${o.id}` })),
  ]

  const [farmRoles, restaurantRoles, orgRoles] = await Promise.all([
    farm ? getRolesForMany(supabase, 'farm', [farm.id]) : {},
    restaurant ? getRolesForMany(supabase, 'restaurant', [restaurant.id]) : {},
    organizations?.length ? getRolesForMany(supabase, 'organization', organizations.map(o => o.id)) : {},
  ])
  const rolesByType = { farm: farmRoles, restaurant: restaurantRoles, organization: orgRoles }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">Your Profiles</h1>
        <p className="text-[14px] text-stone">One Grano account, every profile you manage — switch between them any time.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Link href="/dashboard/profile?section=personal"
          className="bg-white border border-[#ECEAE4] rounded-xl p-4 flex items-center gap-3 hover:border-rust transition-colors group">
          <div className="w-12 h-12 rounded-lg bg-linen flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile?.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profile_photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-serif text-base font-semibold text-soil/30">{getInitials(profile?.full_name || user.email)}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-soil truncate group-hover:text-rust transition-colors">{profile?.full_name || 'Your personal profile'}</div>
            <div className="text-[11px] text-stone">Personal</div>
          </div>
        </Link>

        {businesses.map(b => {
          const roles = rolesByType[b.type][b.id] || []
          const primary = roles.find(r => r.is_primary)
          const additional = roles.filter(r => !r.is_primary)
          return (
            <Link key={`${b.type}-${b.id}`} href={b.href}
              className="bg-white border border-[#ECEAE4] rounded-xl p-4 flex items-start gap-3 hover:border-rust transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-linen flex items-center justify-center overflow-hidden flex-shrink-0">
                {b.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logo_url} alt={b.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-serif text-base font-semibold text-soil/30">{getInitials(b.name)}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-soil truncate group-hover:text-rust transition-colors">{b.name}</div>
                <div className="text-[11px] text-stone">{primary ? roleLabel(primary.role_key) : b.typeLabel}</div>
                {additional.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {additional.map(r => (
                      <span key={r.role_key} className="text-[9px] font-semibold uppercase tracking-wide text-stone bg-linen px-1.5 py-0.5 rounded">
                        {roleLabel(r.role_key)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      <Link href="/dashboard/profiles/new" className="text-[13px] font-semibold text-rust hover:underline">
        + Create another profile
      </Link>
    </div>
  )
}
