import Link from 'next/link'
import { getInitials } from '@/lib/initials'

export default function MeetProducersSection({ farms }) {
  if (!farms?.length) return null

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-8 py-14 sm:py-16">
      <div className="mb-8">
        <h2 className="font-serif text-[28px] sm:text-[34px] font-semibold tracking-tight text-soil mb-2">
          Meet the People <em className="italic text-rust">Behind the Food</em>
        </h2>
        <p className="text-[15px] text-stone">Who they are, what they make, and why they make it.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {farms.map(f => (
          <Link key={f.slug} href={`/producers/${f.slug}`} className="group block">
            <div className="h-[220px] rounded-xl overflow-hidden bg-soil relative mb-4">
              {f.cover_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.cover_photo_url} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[90px] opacity-[0.08] font-serif text-white select-none">
                  {getInitials(f.name)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <div className="font-serif text-[19px] font-semibold leading-tight">{f.name}</div>
                <div className="text-[12px] text-white/70">{[f.producer_type, f.location].filter(Boolean).join(' · ')}</div>
              </div>
            </div>
            {f.bio && <p className="text-[13px] text-stone leading-relaxed line-clamp-3">{f.bio}</p>}
            <span className="inline-block mt-2 text-[12px] font-semibold text-rust group-hover:underline">Read their story →</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
