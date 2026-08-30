'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LOCATION_TYPES } from '@/lib/producerOptions'
import { formatScheduleLine, formatShortDate, isScheduledToday, DAY_ABBR, nextOccurrence } from '@/lib/schedule'
import FollowButton from '@/components/FollowButton'
import ProfileShareMenu from '@/components/ProfileShareMenu'
import WholesaleInquirySheet from '@/components/WholesaleInquirySheet'
import { displayLocation, overlayProducerCopy, isElMolcajete, EL_MOLCAJETE_FIND_US } from '@/lib/producerCopy'

function SectionHeading({ children }) {
  return (
    <h2 className="font-serif text-[22px] sm:text-[26px] font-semibold text-soil mb-5">{children}</h2>
  )
}

function ShopField({ name }) {
  return (
    <div className="w-full h-full bg-[#E8DFD0] flex items-center justify-center rounded-2xl">
      <svg width="48" height="48" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <path d="M8 16 V28 H28 V16" stroke="#6B6355" strokeWidth="1.4"/>
        <path d="M6 16 L18 8 L30 16" stroke="#6B6355" strokeWidth="1.4" strokeLinejoin="round"/>
        <rect x="15" y="20" width="6" height="8" stroke="#6B6355" strokeWidth="1.4"/>
      </svg>
      <span className="sr-only">{name}</span>
    </div>
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

  const locationLine = farm.neighborhood || displayLocation(farm)
  const typeLocation = [locationLine, farm.producer_type].filter(Boolean).join(' · ')
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
    <div className="bg-linen min-h-screen pb-16">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-8 pt-5 sm:pt-8">
        <Link href="/producers" className="inline-flex items-center gap-1 text-[13px] font-semibold text-rust hover:underline mb-5">
          ← All Chicago producers
        </Link>

        <div className="h-[200px] sm:h-[320px] relative overflow-hidden rounded-2xl bg-[#E8DFD0]">
          {farm.cover_photo_url ? (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${farm.cover_photo_url})` }} />
          ) : (
            <ShopField name={farm.name} />
          )}
        </div>

        <div className="pt-6 sm:pt-8 pb-4">
          {typeLocation && <div className="text-[13px] text-stone mb-1">{typeLocation}</div>}
          <h1 className="font-serif text-[28px] sm:text-[40px] font-semibold text-soil tracking-tight leading-tight">{farm.name}</h1>
          {farm.bio && (
            <p className="text-[15px] leading-relaxed text-stone mt-3 max-w-[720px]">{farm.bio}</p>
          )}

          {hasFindUs && (
            <div className="mt-6">
              <a href="#find-us"
                className="inline-block bg-rust text-white text-[14px] font-semibold px-6 py-3 rounded-full hover:bg-[#A8521F] transition-colors">
                Find us this week
              </a>
              {pickupLine && <div className="text-[13px] text-stone mt-2">{pickupLine}</div>}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col gap-12">

        {listedProducts.length > 0 && (
          <section>
            <SectionHeading>Products</SectionHeading>
            <ul className="divide-y divide-[#ECEAE4] border-t border-b border-[#ECEAE4]">
              {listedProducts.map(p => (
                <li key={p.id} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="text-[15px] text-soil">{p.name}</span>
                  <span className="text-[13px] text-rust whitespace-nowrap">Ask at pickup</span>
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
                  <span className="text-sage">✓</span> {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {locations.length === 0 && (farm.website || farm.instagram) && (
          <section id="find-us" className="scroll-mt-20">
            <SectionHeading>Where to find us</SectionHeading>
            <p className="text-[15px] text-stone">
              {[farm.website && farm.website.replace(/^https?:\/\//, ''), farm.instagram && 'Instagram', 'ask this week'].filter(Boolean).join(' · ')}
            </p>
          </section>
        )}

        {locations.length > 0 && (
          <section id="find-us" className="scroll-mt-20">
            <SectionHeading>Where to find us</SectionHeading>
            <ul className="divide-y divide-[#ECEAE4] border-t border-b border-[#ECEAE4]">
              {locations.map(loc => (
                <li key={loc.id || loc.name} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-serif text-[17px] font-semibold text-soil">{loc.name}</div>
                    {todayLocationIds.has(loc.id) && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-white bg-sage px-2 py-0.5 rounded">Today</span>
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
                    <a href={loc.link} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-rust hover:underline">
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

        {upcoming.length > 0 && (
          <section>
            <SectionHeading>Upcoming events</SectionHeading>
            <div className="flex flex-col gap-3">
              {upcoming.map(loc => (
                <div key={loc.id || loc.name} className="bg-white border border-[#ECEAE4] rounded-xl p-4">
                  <span className="text-[10px] font-semibold tracking-wide uppercase text-stone bg-linen px-2 py-0.5 rounded-full">
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
            className="text-[13px] text-stone hover:text-soil"
            followingClassName="text-[13px] text-sage"
          />
          <ProfileShareMenu name={farm.name} slug={farm.slug} />
          {farm.instagram && (
            <a href={`https://instagram.com/${farm.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-soil">
              Instagram
            </a>
          )}
          {farm.website && (
            <a href={farm.website} target="_blank" rel="noopener noreferrer" className="hover:text-soil">
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
