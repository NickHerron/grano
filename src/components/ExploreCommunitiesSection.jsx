import Link from 'next/link'

// "Explore Communities" — entirely data-driven, zero hardcoded cities. `areas` is
// getActiveAreas() computed once in src/app/page.jsx's existing Promise.all.
// Deliberately only features areas with at least one real business — a
// market_areas-tracked area an admin added (e.g. "Los Angeles, CA") isn't shown here
// until it has real activity, same rule as any other real Census place with zero
// activity (which never appeared here to begin with, only reachable by direct link).
// One rule for every zero-activity area, not two. Renders nothing if fewer than two
// areas clear that bar (nothing to "explore" yet beyond the page you're already on).
export default function ExploreCommunitiesSection({ areas }) {
  const activeAreas = areas.filter(a => a.count > 0)
  if (activeAreas.length < 2) return null

  return (
    <section className="bg-white border-y border-[#ECEAE4]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-14 sm:py-16">
        <div className="font-mono text-[10px] tracking-[.2em] uppercase text-rust mb-3">Nationally Open</div>
        <h2 className="font-serif text-[28px] sm:text-[34px] font-semibold tracking-tight text-soil mb-4">
          Explore <em className="italic text-rust">Communities</em>
        </h2>
        <p className="text-[15px] text-stone leading-relaxed max-w-[560px] mb-8">
          The network is open everywhere — the marketplace activates area by area as local supply and pickup infrastructure develop.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {activeAreas.slice(0, 6).map(a => (
            <Link key={`${a.state}-${a.citySlug}`} href={`/locations/${a.state.toLowerCase()}/${a.citySlug}`}
              className="bg-linen rounded-xl p-4 hover:bg-[#E4E0D5] transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold text-soil">{a.city}, {a.state}</span>
                {a.marketArea?.marketplace_enabled && (
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-white bg-sage px-2 py-0.5 rounded-full flex-shrink-0">Shop Local</span>
                )}
              </div>
              <div className="text-[12px] text-stone">{a.count} local business{a.count === 1 ? '' : 'es'}</div>
            </Link>
          ))}
        </div>
        <Link href="/locations" className="text-[13px] font-semibold text-rust hover:underline">See all communities →</Link>
      </div>
    </section>
  )
}
