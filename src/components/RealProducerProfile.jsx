'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { LOCATION_TYPES } from '@/lib/producerOptions'
import { formatScheduleLine, formatShortDate, isScheduledToday, DAY_ABBR, nextOccurrence } from '@/lib/schedule'
import FollowButton from '@/components/FollowButton'
import ProfileShareMenu from '@/components/ProfileShareMenu'
import WholesaleInquirySheet from '@/components/WholesaleInquirySheet'
import WorkWithUsPanel from '@/components/WorkWithUsPanel'
import SourcingRequestCard from '@/components/SourcingRequestCard'
import { overlayProducerCopy, isElMolcajete, EL_MOLCAJETE_FIND_US } from '@/lib/producerCopy'
import ProducerField, { producerPlaceLine } from '@/components/ProducerField'

function SectionHeading({ children }) {
  return (
    <h2 className="font-serif text-[22px] sm:text-[26px] font-medium text-ink mb-5">{children}</h2>
  )
}

function pickupDetailLine(farm, locations) {
  const loc = locations.find(l => l.location_type === 'pickup')
    || locations.find(l => l.location_type === 'farmers_market')
    || locations.find(l => l.location_type === 'farm_stand')
    || locations[0]
  if (!loc) {
    if (farm.website) return farm.website.replace(/^https?:\/\//, '')
    if (farm.instagram) return `Instagram · ask this week`
    return 'Ask this week'
  }
  const next = nextOccurrence(loc)
  const when = loc.hours || (next ? `${DAY_ABBR[next.getDay()]} ${formatShortDate(next.toISOString().slice(0, 10))}` : formatScheduleLine(loc))
  return [loc.name, when].filter(Boolean).join(' · ')
}

export default function RealProducerProfile({
  farm: farmProp, products, isFollowing, workOptions = [], user = null, viewerBusinesses = [],
  sourcingRequests = [],
}) {
  const farm = overlayProducerCopy(farmProp)
  const dbLocations = farm.locations || []
  const locations = dbLocations.length ? dbLocations : (isElMolcajete(farm) ? EL_MOLCAJETE_FIND_US : [])
  const listedProducts = (products || []).filter(p => !p.for_sale || p.is_available !== false)

  const [todayLocationIds, setTodayLocationIds] = useState(() => new Set())
  useEffect(() => {
    const ids = (farm.locations || []).filter(loc => loc.id && isScheduledToday(loc)).map(loc => loc.id)
    setTodayLocationIds(new Set(ids))
  }, [farm.locations])

  const typeLocation = producerPlaceLine(farm)
  const hasPickup = Boolean(farm.practices?.pickup_available || locations.some(l => l.location_type === 'pickup' || l.location_type === 'farm_stand'))
  const pickupLine = pickupDetailLine(farm, locations)
  const hasFindUs = locations.length > 0 || farm.website || farm.instagram
  const sellsWholesale = Boolean(farm.sells_wholesale && workOptions.some(o => o.key === 'wholesale' && o.enabled))
  const availableFor = [
    (listedProducts.length > 0 || hasPickup) && 'Direct sales',
    sellsWholesale && 'Wholesale',
    locations.some(l => l.location_type === 'event' || l.location_type === 'farmers_market') && 'Events',
    hasPickup && 'Pickup',
  ].filter(Boolean)

  const upcoming = locations.filter(loc => {
    if (loc.location_type !== 'event' && loc.location_type !== 'farmers_market') return false
    const next = nextOccurrence(loc, { horizonDays: 120 })
    return Boolean(next || loc.hours || formatScheduleLine(loc))
  })

  return (
    <div className="bg-paper min-h-screen pb-16">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-8 pt-5 sm:pt-8">
        <Link href="/producers" className="inline-flex items-center gap-1 text-[15px] font-semibold text-brick hover:underline mb-5">
          ← All Chicago producers
        </Link>

        <div className="h-[200px] sm:h-[320px] relative overflow-hidden rounded-panel bg-[#E8DFD0]">
          {farm.cover_photo_url ? (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${farm.cover_photo_url})` }} />
          ) : (
            <ProducerField farm={farm} className="rounded-panel" showLabel />
          )}
        </div>

        <div className="pt-6 sm:pt-8 pb-4">
          <h1 className="font-serif text-[28px] sm:text-[40px] font-medium text-ink tracking-tight leading-tight">{farm.name}</h1>
          {typeLocation && <div className="text-[13px] text-stone mt-1">{typeLocation}</div>}
          {farm.bio && (
            <p className="text-[15px] leading-relaxed text-stone mt-3 max-w-[720px]">{farm.bio}</p>
          )}

          {hasFindUs && (
            <div className="mt-6">
              <a href="#find-us"
                className="inline-block bg-forest text-paper text-[15px] font-semibold px-6 py-3 rounded-btn hover:bg-forest-hover transition-colors">
                {isElMolcajete(farm) ? 'Find us' : 'Find us this week'}
              </a>
              {!isElMolcajete(farm) && pickupLine && <div className="text-[13px] text-stone mt-2">{pickupLine}</div>}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col gap-12">

        {listedProducts.length > 0 && (
          <section>
            <SectionHeading>Products</SectionHeading>
            <ul className="divide-y divide-[rgba(44,33,24,0.12)] border-t border-b border-hair">
              {listedProducts.map(p => (
                <li key={p.id} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="text-[15px] text-soil">{p.name}</span>
                  <span className="text-[13px] text-brick whitespace-nowrap">Ask at pickup</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {availableFor.length > 0 && (
          <section>
            <SectionHeading>Available for</SectionHeading>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableFor.map(item => (
                <li key={item} className="flex items-center gap-2 text-[15px] text-soil">
                  <span className="w-5 h-5 rounded-full bg-sage-wash text-forest text-[12px] flex items-center justify-center">✓</span> {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {locations.length === 0 && (farm.website || farm.instagram) && (
          <section id="find-us" className="scroll-mt-20">
            <SectionHeading>{isElMolcajete(farm) ? 'Find us' : 'Where to find us'}</SectionHeading>
            <p className="text-[15px] text-stone">
              {[farm.website && farm.website.replace(/^https?:\/\//, ''), farm.instagram && 'Instagram', 'ask this week'].filter(Boolean).join(' · ')}
            </p>
          </section>
        )}

        {locations.length > 0 && (
          <section id="find-us" className="scroll-mt-20">
            <SectionHeading>{isElMolcajete(farm) ? 'Find us' : 'Where to find us'}</SectionHeading>
            <ul className="divide-y divide-[rgba(44,33,24,0.12)] border-t border-b border-hair">
              {locations.map(loc => (
                <li key={loc.id || loc.name} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-serif text-[17px] font-semibold text-soil">{loc.name}</div>
                    {todayLocationIds.has(loc.id) && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-forest bg-sage-wash px-2 py-0.5 rounded">Today</span>
                    )}
                  </div>
                  {loc.address && <div className="text-[13px] text-stone mt-0.5">{loc.address}</div>}
                  {formatScheduleLine(loc) && (
                    <div className="text-[13px] text-stone mt-0.5">
                      {formatScheduleLine(loc)}{loc.hours ? ` · ${loc.hours}` : ''}
                    </div>
                  )}
                  {!formatScheduleLine(loc) && loc.hours && <div className="text-[13px] text-stone mt-0.5">{loc.hours}</div>}
                  {(loc.starts_on || loc.ends_on) ? (
                    <div className="text-[12px] text-stone mt-0.5">
                      {[loc.starts_on && formatShortDate(loc.starts_on), loc.ends_on && formatShortDate(loc.ends_on)].filter(Boolean).join(' – ')}
                    </div>
                  ) : (loc.seasonal_start || loc.seasonal_end) && (
                    <div className="text-[12px] text-stone mt-0.5">{[loc.seasonal_start, loc.seasonal_end].filter(Boolean).join(' – ')}</div>
                  )}
                  {loc.link && (
                    <a href={loc.link} target="_blank" rel="noopener noreferrer" className="text-[15px] font-semibold text-brick hover:underline">
                      {loc.link.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {sellsWholesale && (
          <WholesaleInquirySheet farm={farm} user={user} viewerBusinesses={viewerBusinesses} />
        )}

        {sourcingRequests.length > 0 && (
          <section>
            <SectionHeading>Looking to buy</SectionHeading>
            <p className="text-[15px] text-stone mb-5 max-w-[720px]">
              If you can supply this, reach out and compare price. Not an order.
            </p>
            <div className="flex flex-col gap-3">
              {sourcingRequests.map(r => (
                <SourcingRequestCard
                  key={r.id}
                  showOwner={false}
                  r={{ ...r, owner: { type: 'farm', slug: farm.slug, name: farm.name } }}
                />
              ))}
            </div>
          </section>
        )}

        {sourcingRequests.length > 0 && (
          <Suspense fallback={null}>
            <WorkWithUsPanel
              businessType="farm"
              businessId={farm.id}
              businessSlug={farm.slug}
              businessName={farm.name}
              options={[{ key: 'sourcing', enabled: true, headline: 'I can supply this. Let’s compare price.', instructions: null }]}
              heading="Compare price"
              user={user}
              viewerBusinesses={viewerBusinesses}
            />
          </Suspense>
        )}

        {upcoming.length > 0 && (
          <section>
            <SectionHeading>Upcoming events</SectionHeading>
            <div className="flex flex-col gap-3">
              {upcoming.map(loc => (
                <div key={loc.id || loc.name} className="bg-card border border-hair rounded-panel p-4">
                  <span className="text-[10px] font-semibold tracking-wide uppercase text-stone bg-paper px-2 py-0.5 rounded-btn">
                    {LOCATION_TYPES.find(([k]) => k === loc.location_type)?.[1] || loc.location_type}
                  </span>
                  <div className="font-serif text-[17px] font-semibold text-soil mt-2">{loc.name}</div>
                  <div className="text-[13px] text-stone mt-0.5">
                    {[formatScheduleLine(loc), loc.hours].filter(Boolean).join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-stone pt-2">
          <FollowButton
            farmId={farm.id}
            initialFollowing={isFollowing}
            className="text-[13px] text-stone hover:text-brick"
            followingClassName="text-[13px] text-sage"
          />
          <ProfileShareMenu name={farm.name} slug={farm.slug} />
          {farm.instagram && (
            <a href={`https://instagram.com/${farm.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-brick">
              Instagram
            </a>
          )}
          {farm.website && (
            <a href={farm.website} target="_blank" rel="noopener noreferrer" className="hover:text-brick">
              Website
            </a>
          )}
        </div>

        {(farm.story) && (
          <section>
            <SectionHeading>Their story</SectionHeading>
            <div className="text-[15px] leading-[1.8] text-stone whitespace-pre-line max-w-[720px]">{farm.story}</div>
          </section>
        )}
      </div>
    </div>
  )
}
