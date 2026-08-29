import Link from 'next/link'

// "Meet Your Local Food Network" — the network-as-foundation section the homepage
// redesign adds. Only rendered when the visitor resolves to a real area (see
// src/app/page.jsx) — there's nothing honest to show otherwise. Stats are the same
// live counts /locations/[state]/[city] computes, just for whichever area this
// visitor is in.
export default function LocalNetworkStats({ area, stats }) {
  return (
    <section className="bg-linen">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-14 sm:py-16">
        <div className="font-mono text-[10px] tracking-[.2em] uppercase text-rust mb-3">The Foundation</div>
        <h2 className="font-serif text-[28px] sm:text-[34px] font-semibold tracking-tight text-soil mb-4">
          Meet Your Local Food <em className="italic text-rust">Network</em>
        </h2>
        <p className="text-[15px] text-stone leading-relaxed max-w-[560px] mb-8">
          The producers, restaurants, markets, and organizations that make up {area.city}'s local food system — the network the marketplace is built on top of.
        </p>
        <div className="flex flex-wrap gap-8 mb-8">
          <Stat n={stats.farms.length} label="Producers" />
          <Stat n={stats.restaurants.length} label="Restaurants" />
          <Stat n={stats.organizations.length} label="Organizations" />
          <Stat n={stats.productCount} label="Products" />
        </div>
        <Link href={`/locations/${area.state.toLowerCase()}/${area.citySlug}`}
          className="inline-block bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#A8521F] transition-colors">
          Explore {area.city}'s Network →
        </Link>
      </div>
    </section>
  )
}

function Stat({ n, label }) {
  return (
    <div>
      <div className="font-serif text-[26px] font-semibold text-soil">{n}</div>
      <div className="text-[11px] text-stone uppercase tracking-wide">{label}</div>
    </div>
  )
}
