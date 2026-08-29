'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getInitials } from '@/lib/initials'
import { PRACTICE_OPTIONS, LOCATION_TYPES, VERIFICATION_LABELS, seasonLabel, isInSeasonNow } from '@/lib/producerOptions'
import { formatDate } from '@/lib/formatDate'
import { formatScheduleLine, formatShortDate, isScheduledToday } from '@/lib/schedule'
import ReviewForm from '@/components/ReviewForm'
import FollowButton from '@/components/FollowButton'
import AddToCartButton from '@/components/AddToCartButton'
import ShareButton from '@/components/ShareButton'
import OurLocalNetworkSection from '@/components/OurLocalNetworkSection'
import WorkWithUsPanel from '@/components/WorkWithUsPanel'
import WholesaleSection from '@/components/WholesaleSection'
import RoleChips from '@/components/RoleChips'

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2 className="font-serif text-[13px] font-semibold tracking-[.15em] uppercase text-stone whitespace-nowrap">{children}</h2>
      <div className="flex-1 h-px bg-[#ECEAE4]" />
    </div>
  )
}

const STORY_PREVIEW_LENGTH = 320

export default function RealProducerProfile({ farm, products, reviews, stats, canReview, reviewOrderId, isFollowing, isRestaurantViewer, liveMarketplaceEnabled = true, localNetwork = [], roles = [], workOptions = [], wholesaleProducts = [], sourcingRequests = [], user = null, viewerBusinesses = [] }) {
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [storyExpanded, setStoryExpanded] = useState(false)
  const storyIsLong = Boolean(farm.story && farm.story.length > STORY_PREVIEW_LENGTH)
  // Cut at the nearest word boundary rather than mid-word, so the preview never ends
  // on a half-chopped word.
  const storyPreview = storyIsLong ? farm.story.slice(0, STORY_PREVIEW_LENGTH).replace(/\s+\S*$/, '') + '…' : farm.story

  // Which "Where to Find Us" locations are happening today, per the visitor's own
  // local time. Computed only after mount (not during SSR) — "today" depends on the
  // visitor's timezone, which the server can't know, so computing it during the
  // initial render would make the server and client disagree and trigger a hydration
  // mismatch. Starting empty and filling in after mount means server and client agree
  // on the first paint; the badge just appears a moment later.
  const [todayLocationIds, setTodayLocationIds] = useState(() => new Set())
  useEffect(() => {
    const ids = (farm.locations || []).filter(loc => isScheduledToday(loc)).map(loc => loc.id)
    setTodayLocationIds(new Set(ids))
  }, [farm.locations])

  const activePractices = PRACTICE_OPTIONS.filter(([key]) => farm.practices?.[key])
  const listedProducts = products.filter(p => !p.for_sale || p.is_available !== false)
  const forSaleProducts = products.filter(p => liveMarketplaceEnabled && p.for_sale && farm.sell_on_grano && p.is_available !== false)
  const inSeasonProducts = products.filter(p => isInSeasonNow(p.season_start_month, p.season_end_month))
  const productsByCategory = listedProducts.reduce((acc, p) => {
    const cat = p.category || 'Other'
    acc[cat] = acc[cat] || []
    acc[cat].push(p)
    return acc
  }, {})

  const locationLine = [farm.neighborhood, farm.location, farm.county].filter(Boolean).join(' · ') || farm.location
  const socialLinks = [
    farm.website && { label: 'Website', href: farm.website },
    farm.instagram && { label: 'Instagram', href: `https://instagram.com/${farm.instagram.replace('@', '')}` },
    farm.facebook && { label: 'Facebook', href: farm.facebook },
    farm.tiktok && { label: 'TikTok', href: `https://tiktok.com/@${farm.tiktok.replace('@', '')}` },
    farm.x && { label: 'X', href: `https://x.com/${farm.x.replace('@', '')}` },
    farm.business_email && { label: 'Email', href: `mailto:${farm.business_email}` },
  ].filter(Boolean)

  return (
    <>
      {/* COVER + IDENTITY */}
      <div className="relative">
        <div
          className="h-[220px] sm:h-[320px] bg-soil relative overflow-hidden"
          style={farm.cover_photo_url ? { backgroundImage: `url(${farm.cover_photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {!farm.cover_photo_url && (
            <div className="absolute inset-0 flex items-center justify-center text-[160px] opacity-[0.06] font-serif text-white select-none">
              {getInitials(farm.name)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <div className="max-w-[1000px] mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-6 relative z-10 pb-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden -mt-12 sm:-mt-16">
              {(farm.profile_photo_url || farm.logo_url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={farm.profile_photo_url || farm.logo_url} alt={farm.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-4xl font-semibold text-soil/40">{getInitials(farm.name)}</span>
              )}
            </div>

            {/* Fixed top spacing (not aligned relative to the avatar) so this always
                clears the cover photo by the same amount regardless of how tall the
                avatar is or how many lines of text there are — aligning it to the
                avatar's shifted position (via items-end/items-center) meant a 3-line
                block (name + type + secondary types) could still land flush against,
                or even under, the cover. */}
            <div className="flex-1 min-w-0 mt-1 sm:mt-6">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif text-[26px] sm:text-[34px] font-semibold text-soil tracking-tight leading-none">{farm.name}</h1>
                {farm.verification_status === 'verified' && (
                  <span title="Verified Producer" className="w-5 h-5 rounded-full bg-sage text-white flex items-center justify-center text-[11px] flex-shrink-0">✓</span>
                )}
              </div>
              <div className="text-[13px] text-stone mt-1">
                {[farm.producer_type, locationLine].filter(Boolean).join(' · ')}
              </div>
              {farm.secondary_types?.length > 0 && (
                <div className="text-[12px] text-stone/80 mt-1">
                  Also: {farm.secondary_types.join(', ')}
                </div>
              )}
              <RoleChips roles={roles} />
            </div>

            <div className="flex gap-2 flex-shrink-0 sm:mt-6">
              <FollowButton
                farmId={farm.id}
                initialFollowing={isFollowing}
                className="px-5 py-2.5 rounded-lg text-[14px] font-semibold border-[1.5px] transition-all border-[#ECEAE4] text-soil hover:border-rust hover:text-rust"
                followingClassName="px-5 py-2.5 rounded-lg text-[14px] font-semibold border-[1.5px] transition-all bg-sage border-sage text-white"
              />
              <ShareButton
                title={farm.name}
                text={`Check out ${farm.name} on Grano`}
                className="px-4 py-2.5 rounded-lg text-[14px] font-semibold border-[1.5px] border-[#ECEAE4] text-soil hover:border-rust hover:text-rust transition-all"
              />
              <Link href="#work-with-us"
                className="px-5 py-2.5 rounded-lg text-[14px] font-semibold bg-rust text-white hover:bg-[#A8521F] transition-all whitespace-nowrap">
                Work With Us
              </Link>
            </div>
          </div>

          {activePractices.length > 0 && (
            <div className="flex gap-2 flex-wrap pb-6">
              {activePractices.map(([key, label]) => (
                <span key={key} className="text-[11px] font-semibold bg-linen text-stone px-2.5 py-1 rounded tracking-wide">{label}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="bg-white border-y border-[#ECEAE4]">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-4 flex gap-8 overflow-x-auto scrollbar-hide">
          {[
            // Only show a stat when there's real data behind it — a "0 Restaurants" or
            // "New" rating badge with nothing there yet reads as an empty platform, not
            // an honest placeholder.
            ...(stats.restaurant_count ? [['Restaurants', stats.restaurant_count]] : []),
            ...(stats.review_count ? [['Rating', `${stats.avg_rating}★`]] : []),
            ['Products', products.length],
            ['Followers', stats.follower_count || 0],
          ].map(([label, v]) => (
            <div key={label} className="text-center flex-shrink-0">
              <span className="font-serif text-[20px] font-semibold text-soil block">{v}</span>
              <span className="text-[11px] text-stone">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-10 sm:py-14 flex flex-col gap-16">

        {/* STORY */}
        {(farm.bio || farm.story) && (
          <section>
            <SectionHeading>Our Story</SectionHeading>
            <div className="max-w-[720px]">
              {farm.bio && <p className="font-serif text-[22px] sm:text-[26px] leading-snug text-soil mb-5">{farm.bio}</p>}
              {farm.story && (
                <>
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
                </>
              )}
            </div>
          </section>
        )}

        {/* WHAT WE MAKE */}
        {listedProducts.length > 0 && (
          <section>
            <SectionHeading>What We Make</SectionHeading>
            <div className="flex flex-col gap-9">
              {Object.entries(productsByCategory).map(([category, items]) => (
                <div key={category}>
                  <div className="text-[12px] font-semibold uppercase tracking-widest text-rust mb-3">{category}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(p => (
                      <div key={p.id} className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
                        <Link href={`/products/${p.slug}`} className="block h-32 flex items-center justify-center overflow-hidden" style={{ background: p.img_bg }}>
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-serif text-3xl font-semibold text-soil/25">{getInitials(p.name)}</span>
                          )}
                        </Link>
                        <div className="p-4">
                          <Link href={`/products/${p.slug}`} className="font-serif text-[17px] font-semibold text-soil mb-1 block hover:text-rust transition-colors">{p.name}</Link>
                          {p.description && <p className="text-[12px] text-stone leading-relaxed mb-2 line-clamp-2">{p.description}</p>}
                          {seasonLabel(p.season_start_month, p.season_end_month) && (
                            <div className="text-[11px] text-sage font-medium mb-2">{seasonLabel(p.season_start_month, p.season_end_month)}</div>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-[#F0EDE7]">
                            {liveMarketplaceEnabled && p.for_sale && farm.sell_on_grano && p.is_available !== false ? (
                              <>
                                <span className="font-serif text-[16px] font-semibold text-soil">${p.price}<span className="text-[11px] font-normal text-stone"> / {p.unit}</span></span>
                                <AddToCartButton
                                  productId={p.id}
                                  className="bg-soil text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg hover:bg-rust transition-colors"
                                  addedClassName="bg-sage text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg"
                                />
                              </>
                            ) : p.is_preorder ? (
                              <span className="text-[11px] font-semibold text-wheat uppercase tracking-wide">Preorder soon</span>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-semibold text-stone uppercase tracking-wide">Not sold on Grano yet</span>
                                {farm.locations?.length > 0 && (
                                  <a href="#find-us" className="text-[11px] font-semibold text-rust hover:underline">Find us here →</a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* IN SEASON */}
        {inSeasonProducts.length > 0 && (
          <section>
            <SectionHeading>In Season Right Now</SectionHeading>
            <div className="flex flex-wrap gap-2">
              {inSeasonProducts.map(p => (
                <Link key={p.id} href={`/products/${p.slug}`}
                  className="flex items-center gap-2 bg-[#EBF3EC] text-sage text-[13px] font-medium px-3.5 py-2 rounded-full hover:bg-sage hover:text-white transition-colors">
                  {p.name}
                  <span className="text-[11px] opacity-70">{seasonLabel(p.season_start_month, p.season_end_month)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* POSTS */}
        {farm.posts?.length > 0 && (
          <section>
            <SectionHeading>From the Producer</SectionHeading>
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

        {/* GALLERY */}
        {farm.photos?.length > 0 && (
          <section>
            <SectionHeading>Our {farm.producer_type === 'Farm' ? 'Farm' : 'Kitchen'}</SectionHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {farm.photos.map(photo => (
                <figure key={photo.id} className="rounded-xl overflow-hidden bg-linen">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.caption || ''} className="w-full h-40 sm:h-48 object-cover" />
                  {photo.caption && <figcaption className="text-[11px] text-stone px-1 py-1.5">{photo.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* WHOLESALE — independent of the WorkWithUsPanel's "wholesale"/"supplier_pitch"
            inquiry options below; this section shows what's actually for sale/being
            sourced, the panel below is how to start the conversation. Renders nothing
            if neither sells_wholesale nor buys_wholesale is set. */}
        <WholesaleSection
          sellsWholesale={farm.sells_wholesale}
          buysWholesale={farm.buys_wholesale}
          wholesaleProducts={wholesaleProducts}
          sourcingRequests={sourcingRequests}
        />

        {/* WORK WITH US — wholesale is now one of the options inside this panel
            (see the "wholesale" key in defaultWorkOptionKeys/workOptions.js),
            not a separate standalone form. */}
        <WorkWithUsPanel
          businessType="farm" businessId={farm.id} businessSlug={farm.slug} businessName={farm.name}
          options={workOptions} heading="Work With Us"
          products={products.map(p => ({ id: p.id, name: p.name }))}
          user={user} viewerBusinesses={viewerBusinesses}
        />

        {/* WHERE TO FIND US */}
        {farm.locations?.length > 0 && (
          <section id="find-us" className="scroll-mt-20">
            <SectionHeading>Where to Find Us</SectionHeading>
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

        {/* OUR LOCAL NETWORK */}
        <OurLocalNetworkSection network={localNetwork} businessName={farm.name} />

        {/* REVIEWS */}
        <section>
          <SectionHeading>Reviews ({reviews.length})</SectionHeading>
          <div className="flex flex-col gap-4 max-w-[640px]">
            {canReview && !reviewsOpen && (
              <button onClick={() => setReviewsOpen(true)} className="self-start text-[13px] font-semibold text-rust hover:underline">
                + Leave a review
              </button>
            )}
            {canReview && reviewsOpen && <ReviewForm farmId={farm.id} slug={farm.slug} orderId={reviewOrderId} />}
            {!canReview && (
              <div className="bg-linen rounded-xl p-4 text-[13px] text-stone">
                <Link href="/login" className="text-rust font-semibold hover:underline">Sign in</Link> and order from {farm.name} to leave a review — or ask them to send you a review link.
              </div>
            )}
            {reviews.length ? reviews.map(r => (
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
                {r.text && <p className="text-[13px] text-stone leading-relaxed">"{r.text}"</p>}
              </div>
            )) : (
              <p className="text-[13px] text-stone">No reviews yet — be the first to order and review.</p>
            )}
          </div>
        </section>

        {/* FOLLOW / SOCIAL */}
        {socialLinks.length > 0 && (
          <section>
            <SectionHeading>Follow {farm.name}</SectionHeading>
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

        {/* COMMERCE */}
        <section className="bg-soil rounded-2xl p-8 sm:p-10 text-center">
          {farm.sell_on_grano && forSaleProducts.length > 0 ? (
            <>
              <div className="font-mono text-[10px] tracking-[.2em] uppercase text-wheat mb-3">Available on Grano</div>
              <h3 className="font-serif text-[24px] sm:text-[28px] font-semibold text-white mb-5">Shop {farm.name}'s products</h3>
              <a href="#" onClick={e => { e.preventDefault(); document.getElementById('what-we-make')?.scrollIntoView({ behavior: 'smooth' }) }}
                className="inline-block bg-rust text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#A8521F] transition-colors">
                Shop Products →
              </a>
            </>
          ) : (
            <>
              <div className="font-mono text-[10px] tracking-[.2em] uppercase text-wheat mb-3">Not Yet on Grano Marketplace</div>
              <h3 className="font-serif text-[22px] sm:text-[26px] font-semibold text-white mb-2">Not currently selling through Grano</h3>
              <p className="text-[14px] text-white/50 max-w-[440px] mx-auto">
                Follow {farm.name} to hear when their products become available — or check "Where to Find Us" above for other ways to buy.
              </p>
            </>
          )}
        </section>

      </div>
    </>
  )
}
