import Link from 'next/link'
import { getInitials } from '@/lib/initials'
import { ORG_TYPE_LABELS } from '@/lib/businessNetwork'
import { formatScheduleLine, formatShortDate } from '@/lib/schedule'
import ShareButton from '@/components/ShareButton'
import OurLocalNetworkSection from '@/components/OurLocalNetworkSection'
import RoleChips from '@/components/RoleChips'
import { hostsVendors } from '@/lib/businessRoles'

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2 className="font-serif text-[13px] font-semibold tracking-[.15em] uppercase text-stone whitespace-nowrap">{children}</h2>
      <div className="flex-1 h-px bg-[#ECEAE4]" />
    </div>
  )
}

// The public profile for an organization (farmers market, pickup location, food hub,
// community organization) — deliberately a smaller page than RealProducerProfile.
// No FollowButton (follows uses a different, per-farm-column polymorphism that isn't
// part of this plan), no WorkWithUsPanel/WholesaleSection (business_work_options and
// sourcing_requests stay farm/restaurant-only — see schema_organizations_relationships.sql),
// no reviews (reviews is farm-specific). Vendors is deliberately always passed in
// (empty until Phase 8 wires up farm_locations.organization_id) rather than computed
// here, so the section structure doesn't need to change when real vendors arrive.
export default function RealOrganizationProfile({ organization: org, localNetwork = [], vendors = [], roles = [] }) {
  const locationLine = [org.neighborhood, org.location].filter(Boolean).join(' · ') || org.location
  const scheduleLine = formatScheduleLine(org)
  // The first real role-driven section: Vendors only makes sense for a market/hub.
  // hostsVendors() falls back to the legacy org_type when this organization hasn't
  // been tagged yet (e.g. created before the roles system existed) so nothing
  // regresses for an untagged org.
  const showsVendors = hostsVendors(roles, org.org_type)

  return (
    <>
      {/* COVER + IDENTITY */}
      <div className="relative">
        <div
          className="h-[220px] sm:h-[320px] bg-soil relative overflow-hidden"
          style={org.cover_photo_url ? { backgroundImage: `url(${org.cover_photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {!org.cover_photo_url && (
            <div className="absolute inset-0 flex items-center justify-center text-[160px] opacity-[0.06] font-serif text-white select-none">
              {getInitials(org.name)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <div className="max-w-[1000px] mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-6 relative z-10 pb-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden -mt-12 sm:-mt-16">
              {org.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-4xl font-semibold text-soil/40">{getInitials(org.name)}</span>
              )}
            </div>

            <div className="flex-1 min-w-0 mt-1 sm:mt-6">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif text-[26px] sm:text-[34px] font-semibold text-soil tracking-tight leading-none">{org.name}</h1>
                {org.verification_status === 'verified' && (
                  <span title="Grano Verified" className="w-5 h-5 rounded-full bg-sage text-white flex items-center justify-center text-[11px] flex-shrink-0">✓</span>
                )}
              </div>
              <div className="text-[13px] text-stone mt-1">
                {[ORG_TYPE_LABELS[org.org_type], locationLine].filter(Boolean).join(' · ')}
              </div>
              <RoleChips roles={roles} />
            </div>

            <div className="flex gap-2 flex-shrink-0 sm:mt-6">
              <ShareButton
                title={org.name}
                text={`Check out ${org.name} on Grano`}
                className="px-4 py-2.5 rounded-lg text-[14px] font-semibold border-[1.5px] border-[#ECEAE4] text-soil hover:border-rust hover:text-rust transition-all"
              />
              {org.website && (
                <a href={org.website} target="_blank" rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-lg text-[14px] font-semibold bg-rust text-white hover:bg-[#A8521F] transition-all whitespace-nowrap">
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STATS STRIP */}
      {vendors.length > 0 && (
        <div className="bg-white border-y border-[#ECEAE4]">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-4 flex gap-8">
            <div className="text-center flex-shrink-0">
              <span className="font-serif text-[20px] font-semibold text-soil block">{vendors.length}</span>
              <span className="text-[11px] text-stone">{vendors.length === 1 ? 'Vendor' : 'Vendors'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-10 sm:py-14 flex flex-col gap-16">

        {/* ABOUT */}
        {org.description && (
          <section>
            <SectionHeading>About</SectionHeading>
            <p className="text-[15px] leading-[1.8] text-stone whitespace-pre-line max-w-[720px]">{org.description}</p>
          </section>
        )}

        {/* WHEN & WHERE */}
        {(scheduleLine || org.address || org.hours) && (
          <section>
            <SectionHeading>When &amp; Where</SectionHeading>
            <div className="bg-white border border-[#ECEAE4] rounded-xl p-5 max-w-[480px]">
              {org.address && <div className="text-[13px] text-stone mb-1">{org.address}</div>}
              {scheduleLine && <div className="text-[13px] text-stone mb-1">{scheduleLine}{org.hours ? ` · ${org.hours}` : ''}</div>}
              {(org.starts_on || org.ends_on) && (
                <div className="text-[13px] text-sage font-medium">
                  {[org.starts_on && formatShortDate(org.starts_on), org.ends_on && formatShortDate(org.ends_on)].filter(Boolean).join(' – ')}
                </div>
              )}
            </div>
          </section>
        )}

        {/* VENDORS — only for a market/hub-tagged organization (see showsVendors above);
            populated starting Phase 8 (farm_locations.organization_id) */}
        {showsVendors && (
        <section id="vendors" className="scroll-mt-20">
          <SectionHeading>Vendors</SectionHeading>
          {vendors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map(v => (
                <Link key={v.id} href={`/producers/${v.slug}`} className="bg-white border border-[#ECEAE4] rounded-xl p-4 flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-lg bg-linen flex items-center justify-center overflow-hidden flex-shrink-0">
                    {v.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.logo_url} alt={v.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-serif text-base font-semibold text-soil/30">{getInitials(v.name)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-soil truncate group-hover:text-rust transition-colors">{v.name}</div>
                    <div className="text-[11px] text-stone truncate">{v.producer_type}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-linen rounded-xl p-8 text-center">
              <p className="text-[14px] text-stone">Vendors at {org.name} will show up here as producers link their profile to this market.</p>
            </div>
          )}
        </section>
        )}

        {/* OUR LOCAL NETWORK */}
        <OurLocalNetworkSection network={localNetwork} businessName={org.name} />

      </div>
    </>
  )
}
