import Link from 'next/link'

// Only ever rendered for a signed-out visitor (see src/app/page.jsx) — a signed-in
// account skips straight to the marketplace, so there's no logged-in variant to
// branch on here anymore.
//
// `area` comes from resolveArea() — a Chicago visitor sees the exact same headline
// this component always had (that string is not a coincidence, it's DEFAULT_AREA in
// resolveLocation.js), a visitor resolved to a different real area sees their own
// city, and a visitor Grano has no data for sees generic framing with a link to
// /locations rather than a fabricated local network.
export default function HomeHero({ area = null }) {
  return (
    <div className="bg-soil px-4 sm:px-8 pt-14 pb-10 sm:pt-20 sm:pb-14">
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-[720px]">
          <div className="font-serif text-[40px] sm:text-[56px] font-semibold text-white tracking-tight leading-[1.05] mb-2">
            Grano
          </div>
          <h1 className="font-serif text-[22px] sm:text-[28px] text-wheat font-medium tracking-tight mb-5">
            {area ? `${area.city}'s Local Food Network` : 'Explore Your Local Food Network'}
          </h1>
          <p className="text-[16px] sm:text-[18px] text-white/60 leading-relaxed mb-8 max-w-[560px]">
            Discover local producers. Source local ingredients. Buy local food.
            {!area && (
              <> <Link href="/locations" className="text-wheat underline hover:text-white transition-colors">Choose your location →</Link></>
            )}
          </p>
          <div className="flex flex-wrap gap-3 mb-12">
            <Link href="#whats-available" className="bg-rust text-white text-[14px] font-semibold px-5 py-3 rounded-xl hover:bg-[#A8521F] transition-colors">
              Explore Local Food →
            </Link>
            <Link href="/signup?as=restaurant" className="bg-white/10 text-white text-[14px] font-semibold px-5 py-3 rounded-xl border-[1.5px] border-white/20 hover:bg-white/15 transition-colors">
              I'm a Restaurant
            </Link>
            <Link href="/signup?as=producer" className="bg-white/10 text-white text-[14px] font-semibold px-5 py-3 rounded-xl border-[1.5px] border-white/20 hover:bg-white/15 transition-colors">
              I'm a Producer
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/producers" className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl p-5 transition-colors">
            <div className="font-serif text-[16px] font-semibold text-white mb-1">Producers</div>
            <div className="text-[13px] text-white/50 leading-relaxed">Build your profile, find buyers, and sell.</div>
          </Link>
          <Link href="/wholesale" className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl p-5 transition-colors">
            <div className="font-serif text-[16px] font-semibold text-white mb-1">Restaurants</div>
            <div className="text-[13px] text-white/50 leading-relaxed">Find local vendors and source ingredients.</div>
          </Link>
          <Link href="/seasonal" className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl p-5 transition-colors">
            <div className="font-serif text-[16px] font-semibold text-white mb-1">Consumers</div>
            <div className="text-[13px] text-white/50 leading-relaxed">Discover local producers and shop what's in season.</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
