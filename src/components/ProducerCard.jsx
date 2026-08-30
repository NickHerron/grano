import Link from 'next/link'
import { displayLocation, overlayProducerCopy } from '@/lib/producerCopy'

function ShopField({ name }) {
  return (
    <div className="w-full h-full bg-[#E8DFD0] flex items-center justify-center">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <path d="M8 16 V28 H28 V16" stroke="#6B6355" strokeWidth="1.4"/>
        <path d="M6 16 L18 8 L30 16" stroke="#6B6355" strokeWidth="1.4" strokeLinejoin="round"/>
        <rect x="15" y="20" width="6" height="8" stroke="#6B6355" strokeWidth="1.4"/>
      </svg>
      <span className="sr-only">{name}</span>
    </div>
  )
}

export default function ProducerCard({ farm }) {
  const f = overlayProducerCopy(farm) || farm
  const location = f.neighborhood || displayLocation(f)
  const photo = f.coverPhotoUrl || f.cover_photo_url || f.logoUrl || f.logo_url
  const typeLine = [location, f.producerType || f.producer_type].filter(Boolean).join(' · ')

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="h-44 relative overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={f.name} className="w-full h-full object-cover" />
        ) : (
          <ShopField name={f.name} />
        )}
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-serif text-[20px] font-semibold text-soil leading-tight">{f.name}</h3>
          {typeLine && <div className="text-[12px] text-stone mt-1">{typeLine}</div>}
        </div>

        {f.bio && <p className="text-[13px] leading-relaxed text-stone line-clamp-2">{f.bio}</p>}

        <Link href={`/producers/${f.slug}`}
          className="mt-auto text-center text-[13px] font-semibold text-rust py-2 rounded-full border-[1.5px] border-rust/80 hover:bg-[#FDF0E8] transition-colors">
          View profile
        </Link>
      </div>
    </div>
  )
}
