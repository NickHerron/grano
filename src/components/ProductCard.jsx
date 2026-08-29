'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getInitials } from '@/lib/initials'
import AddToCartButton from '@/components/AddToCartButton'

const badgeColors = {
  green:  'bg-sage text-white',
  yellow: 'bg-wheat text-white',
  red:    'bg-rust text-white',
}

export default function ProductCard({ product: p, purchasable = true }) {
  const router = useRouter()

  return (
    <div onClick={() => router.push(`/products/${p.slug}`)}
      className="block bg-white border border-[#ECEAE4] rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
      <div className="h-36 flex items-center justify-center relative overflow-hidden" style={{ background: p.imgBg }}>
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-serif text-4xl font-semibold text-soil/25">{getInitials(p.name)}</span>
        )}
        {p.badge && (
          <span className={`absolute top-2.5 left-2.5 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded ${badgeColors[p.badgeColor] || badgeColors.green}`}>
            {p.badge}
          </span>
        )}
        {p.isPreorder && (
          <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-wheat text-white">
            Preorder
          </span>
        )}
      </div>
      <div className="p-3.5">
        <Link href={`/producers/${p.farmSlug}`} onClick={e => e.stopPropagation()}
          className="text-[11px] font-semibold text-rust uppercase tracking-wide block mb-1 hover:underline">
          {p.farmName}
        </Link>
        <div className="font-serif text-[19px] font-semibold leading-tight text-soil mb-2">{p.name}</div>
        <div className="flex flex-col gap-0.5 mb-3">
          {p.location && <div className="text-[12px] text-stone">{p.location}</div>}
          {p.stock && <div className="text-[12px] text-rust font-medium">Only {p.stock} {p.stockUnit} remaining</div>}
          {p.seasonEnds && <div className="text-[12px] text-sage font-medium">{p.seasonEnds.includes('Through') ? `Available ${p.seasonEnds}` : `Season ends in ${p.seasonEnds}`}</div>}
          {/* Only shown once a producer has actually tagged a Sourced From credit —
              left off entirely otherwise, never a "0 local sources" line. */}
          {p.sourcedFromCount > 0 && (
            <Link href={`/products/${p.slug}#sourced-from`} onClick={e => e.stopPropagation()}
              className="text-[12px] font-semibold text-rust hover:underline">
              Made with {p.sourcedFromCount} local source{p.sourcedFromCount === 1 ? '' : 's'} →
            </Link>
          )}
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-[#F0EDE7]">
          {purchasable ? (
            <>
              <div>
                <span className="font-serif text-[21px] font-semibold text-soil">${p.price}</span>
                <span className="text-[12px] text-stone"> / {p.unit}</span>
              </div>
              <AddToCartButton
                productId={p.id}
                onClick={e => { e.preventDefault(); e.stopPropagation() }}
                className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white transition-colors bg-soil hover:bg-rust"
                addedClassName="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white transition-colors bg-sage"
                {...(p.isPreorder ? { children: 'Preorder', addedChildren: '✓ Preordered' } : {})}
              />
            </>
          ) : p.isPreorder ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-semibold text-wheat uppercase tracking-wide">Preorder soon</span>
              {p.preorderNote && <span className="text-[12px] text-stone">{p.preorderNote}</span>}
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-semibold text-stone uppercase tracking-wide">Not sold on Grano yet</span>
              {p.hasFindUsLocations && (
                <Link href={`/producers/${p.farmSlug}#find-us`} onClick={e => e.stopPropagation()}
                  className="text-[12px] font-semibold text-rust hover:underline">
                  Find us here →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
