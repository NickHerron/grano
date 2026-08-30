import Link from 'next/link'
import { overlayProducerCopy } from '@/lib/producerCopy'
import ProducerField, { is24Karat, producerPlaceLine } from '@/components/ProducerField'

export default function ProducerCard({ farm }) {
  const f = overlayProducerCopy(farm) || farm
  const typeLine = producerPlaceLine(f)
  const photo = is24Karat(f) ? (f.coverPhotoUrl || f.cover_photo_url || f.logoUrl || f.logo_url) : null

  return (
    <div className="bg-card border border-hair rounded-panel overflow-hidden flex flex-col">
      <div className="h-44 relative overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={f.name} className="w-full h-full object-cover" />
        ) : (
          <ProducerField farm={f} />
        )}
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          {typeLine && <div className="text-[12px] text-stone">{typeLine}</div>}
          <h3 className="font-serif text-[22px] font-medium text-ink leading-tight mt-1">{f.name}</h3>
        </div>

        {f.bio && <p className="text-[15px] leading-relaxed text-stone line-clamp-2">{f.bio}</p>}

        <Link href={`/producers/${f.slug}`}
          className="mt-auto text-[15px] font-semibold text-brick hover:underline">
          View profile →
        </Link>
      </div>
    </div>
  )
}
