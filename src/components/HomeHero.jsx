import Link from 'next/link'

// Discovery hero — shown to every visitor, signed-in or not. Chicago is launch-market
// copy on this slice, not a new hardcoded area in geography code.
export default function HomeHero() {
  return (
    <div className="bg-soil px-4 sm:px-8 pt-14 pb-14 sm:pt-20 sm:pb-20">
      <div className="max-w-[1100px] mx-auto">
        <div className="max-w-[640px]">
          <h1 className="font-serif text-[36px] sm:text-[52px] font-semibold text-white tracking-tight leading-[1.08] mb-3">
            Meet the people who make your food.
          </h1>
          <p className="font-serif text-[22px] sm:text-[28px] text-wheat font-medium tracking-tight mb-4">
            Chicago&apos;s local food directory.
          </p>
          <p className="text-[16px] sm:text-[18px] text-white/70 leading-relaxed mb-8 max-w-[520px]">
            Farms, bakeries, and producers you can find this week.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="#producers" className="bg-rust text-white text-[14px] font-semibold px-6 py-3 rounded-xl hover:bg-[#A8521F] transition-colors text-center">
              Meet the producers
            </Link>
            <Link href="/signup?as=producer" className="bg-transparent text-wheat text-[14px] font-semibold px-6 py-3 rounded-xl border-[1.5px] border-wheat/70 hover:bg-white/5 transition-colors text-center">
              I&apos;m a producer
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
