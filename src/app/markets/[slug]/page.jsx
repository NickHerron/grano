import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RealOrganizationProfile from '@/components/RealOrganizationProfile'
import { getPublicNetwork } from '@/lib/networkQueries'
import { ORG_TYPE_LABELS } from '@/lib/businessNetwork'
import { getRolesFor } from '@/lib/businessRoleQueries'

async function getOrganization(slug) {
  const supabase = createClient()
  const { data } = await supabase.from('organizations').select('*').eq('slug', slug).maybeSingle()
  return data
}

export async function generateMetadata({ params }) {
  const org = await getOrganization(params.slug)
  if (!org) return { title: 'Organization not found | Grano' }

  const place = org.neighborhood || org.location
  const title = [org.name, [place, ORG_TYPE_LABELS[org.org_type]].filter(Boolean).join(' '), 'Grano'].filter(Boolean).join(' — ')
  const description = org.description || `${org.name} on Grano — Chicago's local food network.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: org.cover_photo_url ? [org.cover_photo_url] : (org.logo_url ? [org.logo_url] : []),
    },
  }
}

export default async function MarketPage({ params }) {
  const supabase = createClient()
  const organization = await getOrganization(params.slug)

  if (!organization) {
    return (
      <div className="max-w-[600px] mx-auto px-8 py-24 text-center">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-2">Organization not found</h1>
        <p className="text-[14px] text-stone mb-6">This organization doesn't exist or hasn't joined yet.</p>
        <Link href="/" className="inline-block bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">
          Back to Grano →
        </Link>
      </div>
    )
  }

  const [localNetwork, { data: vendorLocations }, roles] = await Promise.all([
    getPublicNetwork(supabase, { type: 'organization', id: organization.id }),
    supabase.from('farm_locations')
      .select('farm_id, farm:farms(id, name, slug, producer_type, logo_url, verification_status)')
      .eq('organization_id', organization.id),
    getRolesFor(supabase, 'organization', organization.id),
  ])

  // best-effort view counter, not critical if it fails — same pattern as producers/[slug]
  supabase.from('organizations').update({ profile_view_count: (organization.profile_view_count || 0) + 1 }).eq('id', organization.id).then(() => {})

  // A farm could in principle link more than one of its own locations to the same
  // market — dedupe by farm so it only ever shows up once in the vendor grid. Drop
  // any row whose farm lookup came back null (the farm was deleted; the location
  // link just quietly stops resolving, same "drop rather than show a broken card"
  // rule networkQueries.js already follows).
  const seenFarmIds = new Set()
  const vendors = (vendorLocations || [])
    .map(l => l.farm)
    .filter(f => f && !seenFarmIds.has(f.id) && seenFarmIds.add(f.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  return <RealOrganizationProfile organization={organization} localNetwork={localNetwork} vendors={vendors} roles={roles} />
}
