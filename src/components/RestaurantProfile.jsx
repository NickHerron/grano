'use client'
import Link from 'next/link'
import { getInitials } from '@/lib/initials'
import ShareButton from '@/components/ShareButton'
import FollowButton from '@/components/FollowButton'
import OurLocalNetworkSection from '@/components/OurLocalNetworkSection'
import WorkWithUsPanel from '@/components/WorkWithUsPanel'
import WholesaleSection from '@/components/WholesaleSection'
import RoleChips from '@/components/RoleChips'
import { FREQUENCY_OPTIONS, seasonRangeLabel } from '@/lib/sourcingOptions'

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2 className="font-serif text-[13px] font-semibold tracking-[.15em] uppercase text-stone whitespace-nowrap">{children}</h2>
      <div className="flex-1 h-px bg-[#ECEAE4]" />
    </div>
  )
}

export default function RestaurantProfile({ restaurant, isFollowing, followerCount, localNetwork = [], roles = [], workOptions = [], user = null, viewerBusinesses = [], viewerProducts = [] }) {
  const locationLine = [restaurant.neighborhood, restaurant.location].filter(Boolean).join(' · ')
  // A producer viewing this restaurant's "What We're Looking For" list can respond
  // directly to a specific need — only shown if the viewer actually owns a farm.
  const viewerOwnsFarm = viewerBusinesses.some(b => b.type === 'farm')
  const socialLinks = [
    restaurant.website && { label: 'Website', href: restaurant.website },
    restaurant.instagram && { label: 'Instagram', href: `https://instagram.com/${restaurant.instagram.replace('@', '')}` },
    restaurant.x && { label: 'X', href: `https://x.com/${restaurant.x.replace('@', '')}` },
  ].filter(Boolean)

  return (
    <>
      {/* COVER + IDENTITY */}
      <div className="relative">
        <div
          className="h-[220px] sm:h-[320px] bg-soil relative overflow-hidden"
          style={restaurant.cover_photo_url ? { backgroundImage: `url(${restaurant.cover_photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {!restaurant.cover_photo_url && (
            <div className="absolute inset-0 flex items-center justify-center text-[160px] opacity-[0.06] font-serif text-white select-none">
              {getInitials(restaurant.name)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <div className="max-w-[1000px] mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-6 relative z-10 pb-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden -mt-12 sm:-mt-16">
              {restaurant.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={restaurant.logo_url} alt={restaurant.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-4xl font-semibold text-soil/40">{getInitials(restaurant.name)}</span>
              )}
            </div>

            {/* Fixed top spacing (not aligned relative to the avatar) so this always
                clears the cover photo by the same amount regardless of how tall the
                avatar is or how many lines of text there are — same fix as the
                producer profile header, see RealProducerProfile.jsx. */}
            <div className="flex-1 min-w-0 mt-1 sm:mt-6">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif text-[26px] sm:text-[34px] font-semibold text-soil tracking-tight leading-none">{restaurant.name}</h1>
                {restaurant.verification_status === 'verified' && (
                  <span title="Verified Restaurant" className="w-5 h-5 rounded-full bg-sage text-white flex items-center justify-center text-[11px] flex-shrink-0">✓</span>
                )}
              </div>
              <div className="text-[13px] text-stone mt-1">
                {[restaurant.restaurant_type, restaurant.cuisine, locationLine].filter(Boolean).join(' · ')}
              </div>
              <RoleChips roles={roles} />
            </div>

            <div className="flex gap-2 flex-shrink-0 sm:mt-6">
              <FollowButton
                restaurantId={restaurant.id}
                initialFollowing={isFollowing}
                className="px-5 py-2.5 rounded-lg text-[14px] font-semibold border-[1.5px] transition-all border-[#ECEAE4] text-soil hover:border-rust hover:text-rust"
                followingClassName="px-5 py-2.5 rounded-lg text-[14px] font-semibold border-[1.5px] transition-all bg-sage border-sage text-white"
              />
              <ShareButton
                title={restaurant.name}
                text={`Check out ${restaurant.name} on Grano`}
                className="px-4 py-2.5 rounded-lg text-[14px] font-semibold border-[1.5px] border-[#ECEAE4] text-soil hover:border-rust hover:text-rust transition-all"
              />
              <Link href="#work-with-us"
                className="px-5 py-2.5 rounded-lg text-[14px] font-semibold bg-rust text-white hover:bg-[#A8521F] transition-all whitespace-nowrap">
                Work With Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="bg-white border-y border-[#ECEAE4]">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-4 flex gap-8">
          <div className="text-center">
            <span className="font-serif text-[20px] font-semibold text-soil block">{followerCount || 0}</span>
            <span className="text-[11px] text-stone">Followers</span>
          </div>
          {localNetwork.length > 0 && (
            <div className="text-center">
              <span className="font-serif text-[20px] font-semibold text-soil block">{localNetwork.length}</span>
              <span className="text-[11px] text-stone">Local Connections</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-10 sm:py-14 flex flex-col gap-16">

        {(restaurant.about || restaurant.hours || restaurant.address || restaurant.chef_name) && (
          <section>
            <SectionHeading>About</SectionHeading>
            <div className="max-w-[720px] flex flex-col gap-4">
              {restaurant.about && (
                <div className="text-[15px] leading-[1.8] text-stone whitespace-pre-line">{restaurant.about}</div>
              )}
              <div className="flex flex-wrap gap-x-8 gap-y-1.5 text-[13px] text-stone">
                {restaurant.chef_name && <div><span className="font-semibold text-soil">Chef / Owner:</span> {restaurant.chef_name}</div>}
                {restaurant.address && <div><span className="font-semibold text-soil">Address:</span> {restaurant.address}</div>}
                {restaurant.hours && <div><span className="font-semibold text-soil">Hours:</span> {restaurant.hours}</div>}
                {restaurant.years_operating && <div><span className="font-semibold text-soil">Operating for:</span> {restaurant.years_operating} years</div>}
              </div>
            </div>
          </section>
        )}

        {restaurant.sourcingRequests?.length > 0 && (
          <section>
            <SectionHeading>What We're Looking For</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {restaurant.sourcingRequests.map(r => (
                <div key={r.id} className="bg-white border border-[#ECEAE4] rounded-xl p-4">
                  <div className="font-serif text-[16px] font-semibold text-soil mb-1.5">{r.product_name}</div>
                  <div className="text-[12px] text-stone mb-1.5">
                    {[r.quantity, FREQUENCY_OPTIONS.find(([k]) => k === r.frequency)?.[1], seasonRangeLabel(r.season_start_month, r.season_end_month)].filter(Boolean).join(' · ')}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {r.preferred_location && <span className="text-[10px] font-semibold bg-linen text-stone px-2 py-0.5 rounded">{r.preferred_location}</span>}
                    {r.budget_target && <span className="text-[10px] font-semibold bg-linen text-stone px-2 py-0.5 rounded">{r.budget_target}</span>}
                    {r.wholesale_only && <span className="text-[10px] font-semibold bg-[#FDF0E8] text-rust px-2 py-0.5 rounded">Wholesale</span>}
                    {r.organic_preference && <span className="text-[10px] font-semibold bg-[#EBF3EC] text-sage px-2 py-0.5 rounded">Organic preferred</span>}
                  </div>
                  {viewerOwnsFarm && (
                    <Link href={`/restaurants/${restaurant.slug}?inquire=sourcing&request=${r.id}&subject=${encodeURIComponent(r.product_name)}#work-with-us`}
                      className="text-[12px] font-semibold text-rust hover:underline">
                      Respond →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* WHOLESALE — sell-only here on purpose. The "What We're Looking For" section
            above already covers this restaurant's buy side with its own bespoke
            markup (predates this component and works fine as-is), so buysWholesale is
            hardcoded false to avoid rendering that half twice. */}
        <WholesaleSection sellsWholesale={restaurant.sells_wholesale} buysWholesale={false} />

        {/* WORK WITH US */}
        <WorkWithUsPanel
          businessType="restaurant" businessId={restaurant.id} businessSlug={restaurant.slug} businessName={restaurant.name}
          options={workOptions} heading="Ways to Work With Us"
          user={user} viewerBusinesses={viewerBusinesses} products={viewerProducts}
        />

        {socialLinks.length > 0 && (
          <section>
            <SectionHeading>Follow {restaurant.name}</SectionHeading>
            <div className="flex gap-2 flex-wrap">
              {socialLinks.map(link => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                  className="text-[13px] font-semibold text-soil bg-linen px-4 py-2 rounded-lg hover:bg-[#E4E0D5] transition-colors">
                  {link.label} →
                </a>
              ))}
            </div>
          </section>
        )}

        {/* OUR LOCAL NETWORK */}
        <OurLocalNetworkSection network={localNetwork} businessName={restaurant.name} />

      </div>
    </>
  )
}
