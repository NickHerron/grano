import Link from 'next/link'

const FALLBACK_STILL =
  'https://skfcnljyyvfrfynqurli.supabase.co/storage/v1/object/public/product-photos/cover_photo_url/6fdb24d2-ee6c-4256-a06b-e52797803081/1786299172104-24K-16.jpeg'

export default function HomeHero({ coverUrl }) {
  const src = coverUrl || FALLBACK_STILL

  return (
    <section className="grid grid-cols-1 min-[901px]:grid-cols-[minmax(0,1.05fr)_minmax(0,1.1fr)] bg-paper text-ink min-h-0 min-[901px]:min-h-[560px] border-b border-hair">
      <div className="flex flex-col justify-center px-5 py-10 min-[901px]:py-14 min-[901px]:pl-[max(48px,calc((100vw-1100px)/2))] min-[901px]:pr-[8%]">
        <p className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-gold mb-[18px]">
          Chicago · this week
        </p>
        <h1
          className="font-serif font-medium text-[36px] min-[901px]:text-[clamp(36px,4.2vw,58px)] text-ink tracking-[-0.03em] leading-[1.08] max-w-[11em] mb-[18px]"
          style={{ fontOpticalSizing: 'auto', fontVariationSettings: '"opsz" 72' }}
        >
          Who baked it.<br />
          Who bottled it.<br />
          Who ground the mole.
        </h1>
        <p
          className="font-serif italic font-normal text-[18px] min-[901px]:text-[clamp(18px,1.7vw,22px)] text-soil max-w-[28em] mb-7 leading-[1.4]"
          style={{ fontVariationSettings: '"opsz" 28' }}
        >
          Chicago&apos;s local food discovery and business network. Five kitchens you can actually find this week.
        </p>
        <Link
          href="#producers"
          className="inline-block self-start bg-forest text-paper text-[15px] font-semibold px-7 py-3 rounded-btn hover:bg-forest-hover transition-colors"
        >
          Browse producers
        </Link>
      </div>
      <figure className="relative m-0 bg-[#3A2C1E] min-h-[320px] min-[901px]:min-h-[560px]">
        <img
          src={src}
          alt="Bread, focaccia, and pastry from 24 Karat Bakery"
          className="w-full h-full object-cover min-h-[320px] min-[901px]:min-h-[560px]"
          style={{ objectPosition: 'center 42%' }}
        />
        <figcaption
          className="absolute left-5 bottom-[18px] text-paper text-[12px] font-semibold tracking-[0.08em] uppercase"
          style={{ textShadow: '0 1px 8px rgba(44,33,24,0.55)' }}
        >
          24 Karat Bakery · Hyde Park · at the market Sunday
        </figcaption>
      </figure>
    </section>
  )
}
