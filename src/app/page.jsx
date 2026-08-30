import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HomeHero from '@/components/HomeHero'
import NewOnGrano from '@/components/NewOnGrano'
import ForRestaurants from '@/components/ForRestaurants'
import ProducerCard from '@/components/ProducerCard'
import { overlayProducerCopy } from '@/lib/producerCopy'
import { hydrateSourcingRequestOwners } from '@/lib/sourcingOptions'
import SourcingRequestCard from '@/components/SourcingRequestCard'
import { DAY_ABBR, formatShortDate, localDateStr, nextOccurrence } from '@/lib/schedule'

function mapProducer(f, { pickupFarmIds }) {
  const overlaid = overlayProducerCopy(f)
  return {
    id: overlaid.id,
    slug: overlaid.slug,
    name: overlaid.name,
    location: overlaid.location,
    city: overlaid.city,
    state: overlaid.state,
    neighborhood: overlaid.neighborhood,
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

function thisWeekLine(loc) {
  const next = nextOccurrence(loc, { horizonDays: 8 })
  if (!next) {
    if (loc.hours) return loc.hours
    return null
  }
  const day = DAY_ABBR[next.getDay()]
  const date = formatShortDate(localDateStr(next))
  return [day, date, loc.hours].filter(Boolean).join(' · ')
}

export default async function HomePage() {
  const supabase = createClient()
  const [{ data: realFarms }, { data: farmLocationRows }, { data: rawSourcing }] = await Promise.all([
    supabase.from('farms').select('*').order('created_at', { ascending: false }),
    supabase.from('farm_locations').select('*'),
    supabase.from('sourcing_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }),
  ])
  const sourcingRequests = await hydrateSourcingRequestOwners(supabase, rawSourcing || [])

  const pickupFarmIds = new Set(
    (farmLocationRows || [])
      .filter(l => l.location_type === 'pickup' || l.location_type === 'farm_stand')
      .map(l => l.farm_id)
  )

  const producers = (realFarms || []).map(f => mapProducer(f, { pickupFarmIds }))
  const byId = Object.fromEntries((realFarms || []).map(f => [f.id, overlayProducerCopy(f)]))

  const thisWeek = (farmLocationRows || []).map(loc => {
    const farm = byId[loc.farm_id]
    if (!farm) return null
    const when = thisWeekLine(loc)
    if (!when && !loc.hours) return null
    const next = nextOccurrence(loc, { horizonDays: 8 })
    if (!next && loc.schedule_type && loc.schedule_type !== 'custom') return null
    return {
      id: loc.id,
      slug: farm.slug,
      name: farm.name,
      place: loc.name,
      when: when || loc.hours,
      sort: next ? next.getTime() : Number.MAX_SAFE_INTEGER,
    }
  }).filter(Boolean).sort((a, b) => a.sort - b.sort).slice(0, 6)

  const heroCover = producers.find(p => (p.slug || '').startsWith('24-karat-bakery'))?.coverPhotoUrl

  return (
    <>
      <HomeHero coverUrl={heroCover} />

      <NewOnGrano producers={producers.slice(0, 6)} />

      {thisWeek.length > 0 && (
        <section className="bg-paper border-b border-hair">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10">
            <h2 className="font-serif text-[24px] sm:text-[28px] font-medium text-ink mb-5">This week</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {thisWeek.map(item => (
                <Link key={item.id} href={`/producers/${item.slug}`}
                  className="flex items-start justify-between gap-4 bg-card border border-hair rounded-panel px-5 py-4 hover:border-wheat transition-colors">
                  <div>
                    <div className="font-serif text-[17px] font-medium text-ink">{item.name}</div>
                    <div className="text-[13px] text-stone mt-0.5">{item.place}</div>
                  </div>
                  <div className="text-[12px] text-stone whitespace-nowrap">{item.when}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {sourcingRequests.length > 0 && (
        <section className="bg-paper border-b border-hair">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10">
            <h2 className="font-serif text-[24px] sm:text-[28px] font-medium text-ink mb-2">Looking for</h2>
            <p className="text-[15px] text-stone mb-5 max-w-[640px]">
              Open requests from Chicago kitchens. If you can supply it, reach out and compare price.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sourcingRequests.map(r => <SourcingRequestCard key={r.id} r={r} />)}
            </div>
          </div>
        </section>
      )}

      <section id="producers" className="bg-paper scroll-mt-20">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-12 sm:py-16">
          <h2 className="font-serif text-[28px] sm:text-[34px] font-medium text-ink mb-8">Chicago producers</h2>
          {producers.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {producers.map(f => <ProducerCard key={f.slug} farm={f} />)}
            </div>
          ) : (
            <div className="bg-card border border-hair rounded-panel py-16 text-center">
              <p className="text-[14px] text-stone mb-3">No producers listed yet.</p>
              <Link href="/signup?as=producer" className="text-[13px] font-semibold text-brick hover:underline">Be the first →</Link>
            </div>
          )}
        </div>
      </section>

      <ForRestaurants hasSourcing={sourcingRequests.length > 0} />
    </>
  )
}
