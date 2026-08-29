import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HomeHero from '@/components/HomeHero'
import ProducerCard from '@/components/ProducerCard'
import HomepageNewsletter from '@/components/HomepageNewsletter'
import { overlayProducerCopy } from '@/lib/producerCopy'
import { seasonalWindows } from '@/data'

const SEASON_EMOJI = {
  'Heirloom Tomatoes': '🍅',
  'Sweet Corn': '🌽',
  'Peppers': '🌶️',
  'Zucchini': '🥒',
  'Peaches': '🍑',
  'Apples': '🍎',
  'Grapes': '🍇',
  'Winter Squash': '🎃',
  'Brussels Sprouts': '🥬',
  'Sweet Potatoes': '🍠',
  'Asparagus': '🌱',
  'Strawberries': '🍓',
  'Radishes': '🥕',
  'Snap Peas': '🫛',
  'Ramps': '🌿',
  'Morel Mushrooms': '🍄',
  'Maple Syrup': '🍁',
  'Root Vegetables': '🥕',
  'Storage Onions': '🧅',
  'Honey & Preserves': '🍯',
}

function inSeasonNow(windows, now = new Date()) {
  const m = now.getMonth() + 1
  const d = now.getDate()
  return windows.filter(w => {
    const afterStart = m > w.start.month || (m === w.start.month && d >= w.start.day)
    const beforeEnd = m < w.end.month || (m === w.end.month && d <= w.end.day)
    if (w.start.month <= w.end.month) return afterStart && beforeEnd
    return afterStart || beforeEnd
  })
}

function mapProducer(f, { pickupFarmIds }) {
  const overlaid = overlayProducerCopy(f)
  return {
    id: overlaid.id,
    slug: overlaid.slug,
    name: overlaid.name,
    location: overlaid.location,
    city: overlaid.city,
    state: overlaid.state,
    bio: overlaid.bio,
    story: overlaid.story,
    avatarBg: overlaid.avatar_bg,
    logoUrl: overlaid.logo_url,
    coverPhotoUrl: overlaid.cover_photo_url,
    producerType: overlaid.producer_type,
    verificationStatus: overlaid.verification_status,
    practices: overlaid.practices,
    hasPickup: Boolean(overlaid.practices?.pickup_available || pickupFarmIds.has(overlaid.id)),
  }
}

export default async function HomePage() {
  const supabase = createClient()
  const [{ data: realFarms }, { data: farmLocationRows }] = await Promise.all([
    supabase.from('farms').select('*').order('created_at', { ascending: false }),
    supabase.from('farm_locations').select('farm_id, location_type'),
  ])

  const pickupFarmIds = new Set(
    (farmLocationRows || [])
      .filter(l => l.location_type === 'pickup' || l.location_type === 'farm_stand')
      .map(l => l.farm_id)
  )

  const producers = (realFarms || []).map(f => mapProducer(f, { pickupFarmIds }))
  const inSeason = inSeasonNow(seasonalWindows)
  const featured = producers.find(f => f.story && f.coverPhotoUrl) || producers.find(f => f.story) || producers.find(f => f.coverPhotoUrl) || null

  return (
    <>
      <HomeHero />

      {inSeason.length > 0 && (
        <section className="bg-linen border-b border-[#ECEAE4]">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10">
            <h2 className="font-serif text-[24px] sm:text-[28px] font-semibold text-soil mb-5">In season this week</h2>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {inSeason.map(item => (
                <Link
                  key={item.name}
                  href="/seasonal"
                  className="flex-shrink-0 flex items-center gap-2 bg-white border border-[#ECEAE4] text-[13px] font-medium text-soil px-3.5 py-2 rounded-full hover:border-wheat transition-colors"
                >
                  <span>{SEASON_EMOJI[item.name] || '🌿'}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="producers" className="bg-linen scroll-mt-20">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-12 sm:py-16">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-serif text-[28px] sm:text-[34px] font-semibold text-soil">Chicago producers</h2>
            {producers.length > 0 && (
              <Link href="/producers" className="text-[13px] font-medium text-rust hover:underline">Browse all →</Link>
            )}
          </div>
          {producers.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {producers.map(f => <ProducerCard key={f.slug} farm={f} />)}
            </div>
          ) : (
            <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
              <p className="text-[14px] text-stone mb-3">No producers listed yet.</p>
              <Link href="/signup?as=producer" className="text-[13px] font-semibold text-rust hover:underline">Be the first →</Link>
            </div>
          )}
        </div>
      </section>

      {featured && (
        <section className="bg-white">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-12 sm:py-16">
            <Link href={`/producers/${featured.slug}`} className="group grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden rounded-2xl border border-[#ECEAE4]">
              <div className="h-56 md:h-auto min-h-[240px] bg-soil overflow-hidden">
                {featured.coverPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featured.coverPhotoUrl} alt={featured.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-soil" />
                )}
              </div>
              <div className="bg-linen p-8 sm:p-10 flex flex-col justify-center">
                <div className="font-mono text-[10px] tracking-[.2em] uppercase text-wheat mb-3">Featured story</div>
                <h3 className="font-serif text-[26px] sm:text-[30px] font-semibold text-soil leading-tight mb-3">
                  {featured.name}
                </h3>
                {featured.bio && <p className="text-[15px] text-stone leading-relaxed mb-4 line-clamp-3">{featured.bio}</p>}
                <span className="text-[14px] font-semibold text-rust group-hover:underline">Read their story →</span>
              </div>
            </Link>
          </div>
        </section>
      )}

      <section className="bg-linen border-t border-[#ECEAE4]">
        <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-14 sm:py-16 text-center">
          <h2 className="font-serif text-[28px] sm:text-[32px] font-semibold text-soil mb-3">
            Are you a Chicago producer?
          </h2>
          <p className="text-[15px] text-stone mb-6">
            Create a profile so people can find you this week.
          </p>
          <Link href="/signup?as=producer" className="inline-block bg-rust text-white text-[14px] font-semibold px-6 py-3 rounded-xl hover:bg-[#A8521F] transition-colors">
            Create your profile
          </Link>
        </div>
      </section>

      <section className="bg-linen pb-16 sm:pb-20">
        <div className="max-w-[720px] mx-auto px-4 sm:px-8 text-center">
          <h2 className="font-serif text-[28px] sm:text-[32px] font-semibold text-soil mb-2">The Grano Weekly</h2>
          <p className="text-[15px] text-stone mb-6">
            Stories and seasonal picks from Chicago&apos;s local food community.
          </p>
          <HomepageNewsletter />
        </div>
      </section>
    </>
  )
}
