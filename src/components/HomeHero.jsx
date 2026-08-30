import Link from 'next/link'

export default function HomeHero() {
  return (
    <div className="bg-soil px-4 sm:px-8 pt-16 pb-16 sm:pt-24 sm:pb-24">
      <div className="max-w-[720px] mx-auto text-center">
        <h1 className="font-serif text-[34px] sm:text-[52px] font-semibold text-white tracking-tight leading-[1.08] mb-4">
          What local food businesses are around me?
        </h1>
        <p className="font-serif text-[18px] sm:text-[24px] text-wheat italic font-medium tracking-tight mb-8">
          Chicago&apos;s local food discovery and business network.
        </p>
        <Link href="#producers" className="inline-block bg-[#8B5A2B] text-white text-[14px] font-semibold px-7 py-3 rounded-full hover:bg-[#7A4E24] transition-colors">
          Browse producers
        </Link>
      </div>
    </div>
  )
}
