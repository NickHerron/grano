import Link from 'next/link'
import { businessProfileHref } from '@/lib/businessNetwork'

// Public display for product_sources — shown immediately, per the confirmed decision,
// without requiring the credited business's confirmation (the separate, mutual Local
// Network relationship stays opt-in and unchanged). `sources` are already hydrated
// via hydrateProductSources() in src/lib/productSources.js.
export default function ProductSourcedFrom({ sources }) {
  if (!sources?.length) return null

  return (
    <div className="mb-5 pb-5 border-b border-[#ECEAE4]">
      <h4 className="font-serif text-[13px] font-semibold tracking-[.15em] uppercase text-stone mb-3">Sourced From</h4>
      <div className="flex flex-col gap-2.5">
        {sources.map(s => (
          <div key={s.id} className="text-[13px] text-soil">
            {s.ingredient_label && <span className="font-semibold">{s.ingredient_label} · </span>}
            <Link href={businessProfileHref(s.sourceBusiness.type, s.sourceBusiness.slug)} className="text-rust font-semibold hover:underline">
              {s.sourceBusiness.name}
            </Link>
            {s.sourceProduct && (
              <>
                {' · '}
                <Link href={`/products/${s.sourceProduct.slug}`} className="text-rust hover:underline">{s.sourceProduct.name}</Link>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
