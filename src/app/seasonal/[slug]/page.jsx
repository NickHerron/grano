import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getInitials } from '@/lib/initials'
import { slugify } from '@/lib/slugify'
import { seasonalWindows } from '@/data'
import { FREQUENCY_OPTIONS } from '@/lib/sourcingOptions'
import { getLiveMarketplaceEnabled } from '@/lib/marketplace'

function monthRangeLabel(w) {
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${names[w.start.month - 1]} ${w.start.day} – ${names[w.end.month - 1]} ${w.end.day}`
}

export async function generateMetadata({ params }) {
  const window = seasonalWindows.find(w => slugify(w.name) === params.slug)
  if (!window) return { title: 'Not found | Grano' }
  return {
    title: `${window.name} — In Season | Grano`,
    description: `Who's growing and looking for ${window.name} around Chicago right now.`,
  }
}

export default async function SeasonalItemPage({ params }) {
  const window = seasonalWindows.find(w => slugify(w.name) === params.slug)

  if (!window) {
    return (
      <div className="max-w-[600px] mx-auto px-8 py-24 text-center">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-2">Not found</h1>
        <Link href="/seasonal" className="inline-block bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">
          ← Back to Seasonal Calendar
        </Link>
      </div>
    )
  }

  const supabase = createClient()
  const searchTerm = `%${window.name}%`

  const [{ data: products }, { data: requests }, liveMarketplaceEnabled] = await Promise.all([
    supabase.from('products').select('*, farm:farms(name, slug, logo_url, location, sell_on_grano)').or(`name.ilike.${searchTerm},category.ilike.${searchTerm}`),
    supabase.from('sourcing_requests').select('*, restaurant:restaurants(name, slug, logo_url, location)').ilike('product_name', searchTerm).eq('status', 'open'),
    getLiveMarketplaceEnabled(),
  ])

  const now = new Date()
  const currentFraction = (now.getMonth() + now.getDate() / 31) / 12
  const startFraction = (window.start.month - 1 + window.start.day / 31) / 12
  const endFraction = (window.end.month - 1 + window.end.day / 31) / 12
  const inSeasonNow = currentFraction >= startFraction && currentFraction <= endFraction

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-8 pb-20">
      <Link href="/seasonal" className="text-[13px] font-semibold text-rust hover:underline mb-4 inline-block">← Seasonal Calendar</Link>
      <div className="mb-10">
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <h1 className="font-serif text-[32px] sm:text-[40px] font-semibold tracking-tight text-soil">{window.name}</h1>
          {inSeasonNow && (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-white bg-sage px-2.5 py-1 rounded">In Season Now</span>
          )}
        </div>
        <p className="text-[15px] text-stone">Typically {monthRangeLabel(window)} around Chicago.</p>
      </div>

      <section className="mb-14">
        <h2 className="font-serif text-[13px] font-semibold tracking-[.15em] uppercase text-stone mb-5">Who's Growing It</h2>
        {products?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map(p => (
              <Link key={p.id} href={`/products/${p.slug}`}
                className="bg-white border border-[#ECEAE4] rounded-xl p-4 flex items-center gap-4 hover:border-rust transition-colors">
                <div className="w-12 h-12 rounded-lg bg-linen flex items-center justify-center overflow-hidden flex-shrink-0">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-serif text-base font-semibold text-soil/30">{getInitials(p.name)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-soil truncate">{p.name}</div>
                  <div className="text-[11px] text-stone truncate">{p.farm?.name}{p.farm?.location ? ` · ${p.farm.location}` : ''}</div>
                </div>
                {liveMarketplaceEnabled && p.for_sale && p.farm?.sell_on_grano && p.is_available !== false ? (
                  <span className="text-[11px] font-semibold text-sage flex-shrink-0">On Grano</span>
                ) : (
                  <span className="text-[11px] font-semibold text-stone flex-shrink-0">Profile only</span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#ECEAE4] rounded-xl py-12 text-center">
            <p className="text-[14px] text-stone">No producers have listed {window.name.toLowerCase()} yet — check back as the season gets closer.</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-[13px] font-semibold tracking-[.15em] uppercase text-stone mb-5">Restaurants Looking For It</h2>
        {requests?.length ? (
          <div className="flex flex-col gap-3">
            {requests.map(r => (
              <div key={r.id} className="bg-white border border-[#ECEAE4] rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-linen flex items-center justify-center overflow-hidden flex-shrink-0">
                  {r.restaurant?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.restaurant.logo_url} alt={r.restaurant.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-serif text-base font-semibold text-soil/30">{getInitials(r.restaurant?.name || '?')}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/restaurants/${r.restaurant?.slug}`} className="text-[14px] font-semibold text-soil hover:text-rust transition-colors">{r.restaurant?.name}</Link>
                  <div className="text-[11px] text-stone">
                    {[r.quantity, FREQUENCY_OPTIONS.find(([k]) => k === r.frequency)?.[1]].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#ECEAE4] rounded-xl py-12 text-center">
            <p className="text-[14px] text-stone">No open restaurant requests for {window.name.toLowerCase()} right now.</p>
          </div>
        )}
      </section>
    </div>
  )
}
