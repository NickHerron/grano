import Link from 'next/link'
import { getInitials } from '@/lib/initials'
import { displayLocation, overlayProducerCopy } from '@/lib/producerCopy'

export default function ProducerCard({ farm }) {
  const f = overlayProducerCopy(farm) || farm
  const location = displayLocation(f)
  const photo = f.coverPhotoUrl || f.cover_photo_url || f.logoUrl || f.logo_url
  const hasPickup = Boolean(f.practices?.pickup_available || f.hasPickup)

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="h-44 bg-soil relative overflow-hidden flex items-center justify-center" style={f.avatarBg && !photo ? { background: f.avatarBg } : undefined}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={f.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-serif text-[42px] font-semibold text-white/20">{getInitials(f.name)}</span>
        )}
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-serif text-[20px] font-semibold text-soil leading-tight">{f.name}</h3>
            {f.verificationStatus === 'verified' || f.verification_status === 'verified' ? (
              <span title="Verified Producer" className="w-4 h-4 rounded-full bg-sage text-white flex items-center justify-center text-[9px] flex-shrink-0">✓</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {(f.producerType || f.producer_type || location) && (
              <div className="text-[12px] text-stone">
                {[f.producerType || f.producer_type, location].filter(Boolean).join(' · ')}
              </div>
            )}
            {hasPickup && (
              <span className="text-[10px] font-semibold bg-[#EBF3EC] text-sage px-2 py-0.5 rounded-full">✓ Pickup</span>
            )}
          </div>
        </div>

        {f.bio && <p className="text-[13px] leading-relaxed text-stone line-clamp-2">{f.bio}</p>}

        <Link href={`/producers/${f.slug}`}
          className="mt-auto text-center text-[13px] font-semibold text-rust py-2 rounded-lg border-[1.5px] border-rust/80 hover:bg-[#FDF0E8] transition-colors">
          View profile
        </Link>
      </div>
    </div>
  )
}
