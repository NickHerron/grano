import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRolesFor } from '@/lib/businessRoleQueries'
import { getAreaMemberships, getActiveAreas } from '@/lib/locationQueries'
import OrganizationProfileForm from './OrganizationProfileForm'
import CreateOrganizationForm from './CreateOrganizationForm'

// Phase 5 of the Network Layer plan — create/manage an `organizations` row (farmers
// market, pickup location, food hub, community organization). Deliberately not
// gated by a new account_roles value: any signed-in user can create one, same as any
// signed-in user can add the producer/restaurant role, just without a role at all.
//
// Phase 5 of the Person/Organization Multi-Role plan: an owner can now have more than
// one organization. ?org=<id> picks which one this page shows/edits, defaulting to
// the first — so every existing bookmark/link without the param keeps working exactly
// as it did when one-per-owner was still the rule.
export default async function OrganizationPage({ searchParams }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: organizations } = await supabase.from('organizations').select('*').eq('owner_id', user.id).order('created_at', { ascending: true })

  const requestedId = searchParams?.org
  const organization = organizations?.length ? (organizations.find(o => o.id === requestedId) || organizations[0]) : null
  const [roles, memberships, activeAreas] = organization
    ? await Promise.all([
        getRolesFor(supabase, 'organization', organization.id),
        getAreaMemberships(supabase, 'organization', organization.id),
        getActiveAreas(),
      ])
    : [[], [], []]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">Organization</h1>
        <p className="text-[14px] text-stone max-w-[720px]">Farmers markets, pickup locations, food hubs, and other community organizations — a public profile local producers and restaurants can link to as part of their local network.</p>
      </div>

      {organizations?.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {organizations.map(o => (
            <Link key={o.id} href={`/dashboard/organization?org=${o.id}`}
              className={`text-[13px] font-semibold px-3.5 py-2 rounded-lg border transition-colors ${
                o.id === organization.id ? 'bg-rust border-rust text-white' : 'bg-white border-[#ECEAE4] text-soil hover:border-rust'
              }`}>
              {o.name}
            </Link>
          ))}
        </div>
      )}

      {organization ? <OrganizationProfileForm organization={organization} roles={roles} memberships={memberships} availableAreas={activeAreas} /> : <CreateOrganizationForm />}
    </div>
  )
}
