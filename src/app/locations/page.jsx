import Link from 'next/link'
import { getActiveAreas } from '@/lib/locationQueries'
import { stateLabel } from '@/lib/geography'
import LocationPicker from './LocationPicker'

export const metadata = {
  title: 'Explore Communities | Grano',
  description: "Every place Grano's local food network reaches — browse by state and city.",
}

// Entirely data-driven — zero hardcoded cities. A place appears here the moment one
// real farm/restaurant/organization has a city set; it disappears if it doesn't. This
// applies uniformly to every area, including one an admin has added to market_areas —
// a tracked-but-empty area (e.g. "Los Angeles, CA" with zero real businesses) doesn't
// get featured here just because it's tracked, same rule as any other real place with
// no activity yet. It's still directly reachable by its own URL either way.
export default async function LocationsPage() {
  const areas = (await getActiveAreas()).filter(a => a.count > 0)

  const byState = new Map()
  for (const area of areas) {
    if (!byState.has(area.state)) byState.set(area.state, [])
    byState.get(area.state).push(area)
  }
  const states = [...byState.keys()].sort((a, b) => stateLabel(a).localeCompare(stateLabel(b)))

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-[28px] sm:text-[34px] font-semibold tracking-tight text-soil mb-2">
          Explore <em className="italic text-rust">Communities</em>
        </h1>
        <p className="text-[15px] text-stone max-w-[640px]">
          The network is open everywhere — browse every place Grano's local food community reaches. The marketplace activates area by area as local supply and pickup infrastructure develop.
        </p>
      </div>

      <div className="mb-10">
        <LocationPicker areas={areas} />
      </div>

      {states.length ? (
        <div className="flex flex-col gap-8">
          {states.map(state => (
            <div key={state}>
              <h2 className="font-serif text-[18px] font-semibold text-soil mb-3">{stateLabel(state)}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {byState.get(state).map(area => (
                  <Link key={`${area.state}-${area.citySlug}`} href={`/locations/${area.state.toLowerCase()}/${area.citySlug}`}
                    className="bg-white border border-[#ECEAE4] rounded-xl p-4 hover:border-rust transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold text-soil">{area.city}</span>
                      {area.marketArea?.marketplace_enabled && (
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-white bg-sage px-2 py-0.5 rounded-full flex-shrink-0">Shop Local</span>
                      )}
                    </div>
                    <div className="text-[12px] text-stone">{area.count} local business{area.count === 1 ? '' : 'es'}</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
          <p className="text-[14px] text-stone">No communities yet — be the first to create a profile and help build Grano in your area.</p>
        </div>
      )}
    </div>
  )
}
