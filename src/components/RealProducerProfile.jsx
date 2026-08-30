'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getInitials } from '@/lib/initials'
import { LOCATION_TYPES } from '@/lib/producerOptions'
import { formatDate } from '@/lib/formatDate'
import { formatScheduleLine, formatShortDate, isScheduledToday, DAY_ABBR } from '@/lib/schedule'
import ReviewForm from '@/components/ReviewForm'
import OurLocalNetworkSection from '@/components/OurLocalNetworkSection'
import RoleChips from '@/components/RoleChips'
import { displayLocation, overlayProducerCopy } from '@/lib/producerCopy'

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2 className="font-serif text-[22px] sm:text-[26px] font-semibold text-soil whitespace-nowrap">{children}</h2>
      <div className="flex-1 h-px bg-[#ECEAE4]" />
    </div>
  )
}

function pickupDetailLine(farm) {
  const locations = farm.locations || []
  const loc = locations.find(l => l.location_type === 'pickup')
    || locations.find(l => l.location_type === 'farm_stand')
    || locations[0]
  const place = farm.neighborhood || loc?.name || null
  if (!loc && !place) return null
  let when = null
  if (loc) {
    if (loc.schedule_days?.length) {
      const days = [...loc.schedule_days].sort((a, b) => a - b).map(d => DAY_ABBR[d]).join(' & ')
      when = loc.hours ? `${days} ${loc.hours}` : days
    } else if (loc.hours) {
      when = loc.hours
    } else {
      when = formatScheduleLine(loc)
    }
  }
  return [place, when].filter(Boolean).join(' · ') || null
}

const STORY_PREVIEW_LENGTH = 480

export default function RealProducerProfile({ farm: farmProp, products, reviews, stats, canReview, reviewOrderId, isFollowing, isRestaurantViewer, liveMarketplaceEnabled = false, localNetwork = [], roles = [], workOptions = [], wholesaleProducts = [], sourcingRequests = [], user = null, viewerBusinesses = [] }) {
  const farm = overlayProducerCopy(farmProp)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [storyExpanded, setStoryExpanded] = useState(false)
  const storyIsLong = Boolean(farm.story && farm.story.length > STORY_PREVIEW_LENGTH)
  const storyPreview = storyIsLong ? farm.story.slice(0, STORY_PREVIEW_LENGTH).replace(/\s+\S*$/, '') + '…' : farm.story

  const [todayLocationIds, setTodayLocationIds] = useState(() => new Set())
  useEffect(() => {
    const ids = (farm.locations || []).filter(loc => isScheduledToday(loc)).map(loc => loc.id)
    setTodayLocationIds(new Set(ids))
  }, [farm.locations])

  const listedProducts = products.filter(p => !p.for_sale || p.is_available !== false)
  const locationLine = displayLocation(farm)
  const hasPickup = Boolean(farm.practices?.pickup_available || (farm.locations || []).some(l => l.location_type === 'pickup' || l.location_type === 'farm_stand'))
  const pickupLine = pickupDetailLine(farm)
  const hasLocations = (farm.locations || []).length > 0
  const socialLinks = [
    farm.website && { label: 'Website', href: farm.website },
    farm.instagram && { label: 'Instagram', href: `https://instagram.com/${farm.instagram.replace('@', '')}` },
    farm.facebook && { label: 'Facebook', href: farm.facebook },
    farm.tiktok && { label: 'TikTok', href: `https://tiktok.com/@${farm.tiktok.replace('@', '')}` },
    farm.x && { label: 'X', href: `https://x.com/${farm.x.replace('@', '')}` },
    farm.business_email && { label: 'Email', href: `mailto:${farm.business_email}` },
  ].filter(Boolean)

  const typeLocation = [farm.producer_type, locationLine].filter(Boolean).join(' · ')

  return (
    <div className="bg-linen min-h-screen pb-16">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-8 pt-5 sm:pt-8">
        <Link href="/producers" className="inline-flex items-center gap-1 text-[13px] font-semibold text-rust hover:underline mb-5">
          ← All Chicago producers
        </Link>

        <div
          className="h-[200px] sm:h-[320px] bg-soil relative overflow-hidden rounded-2xl"
          style={farm.cover_photo_url ? { backgroundImage: `url(${farm.cover_photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {!farm.cover_photo_url && (
            <div className="absolute inset-0 flex items-center justify-center text-[120px] opacity-[0.08] font-serif text-white select-none">
              {getInitials(farm.name)}
            </div>
          )}
        </div>

        <div className="pt-6 sm:pt-8 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-serif text-[28px] sm:text-[40px] font-semibold text-soil tracking-tight leading-tight">{farm.name}</h1>
            {farm.verification_status === 'verified' && (
              <span title="Verified Producer" className="w-5 h-5 rounded-full bg-sage text-white flex items-center justify-center text-[11px] flex-shrink-0">✓</span>
            )}
          </div>
          {typeLocation && (
            <div className="flex items-center gap-2 flex-wrap mt-1.5">
              <div className="text-[14px] text-stone">{typeLocation}</div>
              {hasPickup && (
                <span className="text-[11px] font-semibold bg-[#EBF3EC] text-sage px-2.5 py-0.5 rounded-full">Pickup</span>
              )}
            </div>
          )}
          <RoleChips roles={roles} />
          {farm.bio && (
            <p className="font-serif text-[18px] sm:text-[20px] leading-snug text-soil mt-4 max-w-[720px]">{farm.bio}</p>
          )}

          {hasLocations && (
            <div className="mt-6">
              <a href="#find-us"
                className="inline-block bg-rust text-white text-[14px] font-semibold px-6 py-3 rounded-xl hover:bg-[#A8521F] transition-colors">
                Find us this week
              </a>
              {pickupLine && (
                <div className="text-[13px] text-stone mt-2">{pickupLine}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col gap-14">

        {listedProducts.length > 0 && (
          <section>
            <SectionHeading>What they make</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listedProducts.map(p => (
                <div key={p.id} className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
                  <Link href={`/products/${p.slug}`} className="block h-36 flex items-center justify-center overflow-hidden" style={{ background: p.img_bg }}>
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-serif text-3xl font-semibold text-soil/25">{getInitials(p.name)}</span>
                    )}
                  </Link>
                  <div className="p-4">
                    <Link href={`/products/${p.slug}`} className="font-serif text-[17px] font-semibold text-soil mb-1 block hover:text-rust transition-colors">{p.name}</Link>
                    <div className="text-[13px] font-medium text-rust">Ask at pickup</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(farm.bio || farm.story) && farm.story && (
          <section>
            <SectionHeading>Their story</SectionHeading>
            <div className="max-w-[720px]">
              <div className="text-[15px] leading-[1.8] text-stone whitespace-pre-line">
                {storyExpanded || !storyIsLong ? farm.story : storyPreview}
              </div>
              {storyIsLong && (
                <button type="button" onClick={() => setStoryExpanded(v => !v)}
                  className="mt-3 text-[13px] font-semibold text-rust hover:underline flex items-center gap-1">
                  {storyExpanded ? 'Show less' : 'Read the full story'}
                  <span className={`inline-block transition-transform ${storyExpanded ? 'rotate-180' : ''}`}>▾</span>
                </button>
              )}
            </div>
          </section>
        )}

        {farm.posts?.length > 0 && (
          <section>
            <SectionHeading>From the producer</SectionHeading>
            <div className="flex flex-col gap-5 max-w-[640px]">
              {farm.posts.map(post => (
                <div key={post.id} className="border-b border-[#F0EDE7] pb-5 last:border-b-0">
                  <div className="text-[11px] text-stone mb-2">{formatDate(post.created_at)}</div>
                  {post.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.photo_url} alt="" className="w-full rounded-xl mb-3 object-cover max-h-[360px]" />
                  )}
                  <p className="text-[15px] leading-relaxed text-soil whitespace-pre-line">{post.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {farm.photos?.length > 0 && (
          <section>
            <SectionHeading>Gallery</SectionHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {farm.photos.map(photo => (
                <figure key={photo.id} className="rounded-xl overflow-hidden bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.caption || ''} className="w-full h-40 sm:h-48 object-cover" />
                  {photo.caption && <figcaption className="text-[11px] text-stone px-1 py-1.5">{photo.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        {hasLocations && (
          <section id="find-us" className="scroll-mt-20">
            <SectionHeading>Find us this week</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {farm.locations.map(loc => (
                <div key={loc.id} className="bg-white border border-[#ECEAE4] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="font-serif text-[16px] font-semibold text-soil">{loc.name}</div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {todayLocationIds.has(loc.id) && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-white bg-sage px-2 py-0.5 rounded">Today</span>
                      )}
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-rust bg-[#FDF0E8] px-2 py-0.5 rounded">
                        {LOCATION_TYPES.find(([k]) => k === loc.location_type)?.[1] || loc.location_type}
                      </span>
                    </div>
                  </div>
                  {loc.address && <div className="text-[12px] text-stone mb-0.5">{loc.address}</div>}
                  {formatScheduleLine(loc) && <div className="text-[12px] text-stone mb-0.5">{formatScheduleLine(loc)}{loc.hours ? ` · ${loc.hours}` : ''}</div>}
                  {(loc.starts_on || loc.ends_on) ? (
                    <div className="text-[12px] text-sage font-medium mb-0.5">
                      {[loc.starts_on && formatShortDate(loc.starts_on), loc.ends_on && formatShortDate(loc.ends_on)].filter(Boolean).join(' – ')}
                    </div>
                  ) : (loc.seasonal_start || loc.seasonal_end) && (
                    <div className="text-[12px] text-sage font-medium mb-0.5">{[loc.seasonal_start, loc.seasonal_end].filter(Boolean).join(' – ')}</div>
                  )}
                  {loc.link && (
                    <a href={loc.link} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-rust hover:underline">Learn more →</a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <OurLocalNetworkSection network={localNetwork} businessName={farm.name} />

        {reviews.length > 0 && (
          <section>
            <SectionHeading>Reviews</SectionHeading>
            <div className="flex flex-col gap-4 max-w-[640px]">
              {canReview && !reviewsOpen && (
                <button onClick={() => setReviewsOpen(true)} className="self-start text-[13px] font-semibold text-rust hover:underline">
                  + Leave a review
                </button>
              )}
              {canReview && reviewsOpen && <ReviewForm farmId={farm.id} slug={farm.slug} orderId={reviewOrderId} />}
              {reviews.map(r => (
                <div key={r.id} className="bg-white border border-[#ECEAE4] rounded-xl p-5">
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="text-[14px] font-semibold text-soil">{r.buyer?.restaurant_name || r.buyer?.full_name || 'A customer'}</div>
                      {(r.order_id || r.invite_id) && (
                        <span title={r.order_id ? 'Verified purchase' : 'Verified customer'} className="text-[10px] font-semibold text-sage bg-[#EBF3EC] px-1.5 py-0.5 rounded">✓ Verified</span>
                      )}
                    </div>
                    <div>
                      <div className="text-wheat text-[12px]">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                      <div className="text-[11px] text-stone text-right">{formatDate(r.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                  </div>
                  {r.text && <p className="text-[13px] text-stone leading-relaxed">&ldquo;{r.text}&rdquo;</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {socialLinks.length > 0 && (
          <section>
            <SectionHeading>Follow {farm.name}</SectionHeading>
            <div className="flex gap-2 flex-wrap">
              {socialLinks.map(link => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                  className="text-[13px] font-semibold text-soil bg-white border border-[#ECEAE4] px-4 py-2 rounded-lg hover:border-rust hover:text-rust transition-colors">
                  {link.label} →
                </a>
              ))}
            </div>
          </section>
        )}

        <div>
          <Link href="/producers" className="inline-flex items-center gap-1 text-[14px] font-semibold text-rust hover:underline">
            ← All Chicago producers
          </Link>
        </div>
      </div>
    </div>
  )
}
