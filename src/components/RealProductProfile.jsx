'use client'
import { useState } from 'react'
import Link from 'next/link'
import { getInitials } from '@/lib/initials'
import AddToCartButton from '@/components/AddToCartButton'
import ProductSourcedFrom from '@/components/ProductSourcedFrom'

export default function RealProductProfile({ product: p, farm, liveMarketplaceEnabled = true, hasFindUsLocations = false, sources = [] }) {
  const [qty, setQty] = useState(1)
  const availableForPurchase = liveMarketplaceEnabled && p.for_sale && farm.sell_on_grano && p.is_available !== false

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-20">
      <div className="text-[12px] text-stone mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-rust transition-colors">Market</Link> ›
        <span className="capitalize">{p.category || 'Uncategorized'}</span> ›
        <Link href={`/producers/${farm.slug}`} className="hover:text-rust transition-colors">{farm.name}</Link> ›
        <span className="text-soil">{p.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-start">
        {/* GALLERY */}
        <div className="rounded-2xl h-[280px] sm:h-[380px] flex items-center justify-center relative overflow-hidden" style={{ background: p.img_bg }}>
          {p.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-serif text-8xl font-semibold text-soil/20">{getInitials(p.name)}</span>
          )}
          {p.badge && (
            <div className="absolute top-4 left-4">
              <span className="bg-sage text-white text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded">{p.badge}</span>
            </div>
          )}
        </div>

        {/* INFO */}
        <div>
          <Link href={`/producers/${farm.slug}`} className="flex items-center gap-2.5 mb-3 group">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: p.img_bg }}>
              {farm.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={farm.logo_url} alt={farm.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-[13px] font-semibold text-soil/40">{getInitials(farm.name)}</span>
              )}
            </div>
            <div>
              <div className="text-[13px] font-semibold text-rust group-hover:underline">{farm.name} →</div>
              <div className="text-[11px] text-stone">{farm.location || 'Chicago, IL'}</div>
            </div>
          </Link>

          <h1 className="font-serif text-[32px] sm:text-[42px] font-semibold tracking-tight text-soil leading-tight sm:leading-none mb-4">{p.name}</h1>

          <div className="grid grid-cols-2 gap-2 mb-5">
            {p.harvested_at && <div className="bg-linen rounded-lg p-3"><div className="text-[10px] font-semibold tracking-widest uppercase text-stone mb-0.5">Harvested</div><div className="text-[14px] font-semibold text-soil">{p.harvested_at}</div></div>}
            {p.stock != null && <div className="bg-linen rounded-lg p-3"><div className="text-[10px] font-semibold tracking-widest uppercase text-stone mb-0.5">Stock</div><div className="text-[14px] font-semibold text-rust">Only {p.stock} {p.stock_unit} left</div></div>}
            {p.season_ends && <div className="bg-linen rounded-lg p-3"><div className="text-[10px] font-semibold tracking-widest uppercase text-stone mb-0.5">Season ends</div><div className="text-[14px] font-semibold text-sage">{p.season_ends}</div></div>}
          </div>

          <div className="flex items-baseline gap-2.5 mb-1">
            <span className="font-serif text-[32px] sm:text-[44px] font-semibold text-soil">${p.price}</span>
            <span className="text-[16px] text-stone">/ {p.unit}{p.unit_detail ? ` (${p.unit_detail})` : ''}</span>
          </div>
          <div className="text-[13px] text-stone mb-5">Minimum 1 {p.unit}</div>

          {availableForPurchase ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[13px] font-medium text-stone">Quantity</span>
                <div className="flex border-[1.5px] border-[#ECEAE4] rounded-lg overflow-hidden">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 text-lg text-soil hover:bg-linen transition-colors">−</button>
                  <span className="w-11 text-center text-[15px] font-semibold text-soil flex items-center justify-center">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="w-9 h-9 text-lg text-soil hover:bg-linen transition-colors">+</button>
                </div>
                <span className="text-[13px] text-stone">${(qty * p.price).toFixed(2)} total</span>
              </div>

              <AddToCartButton
                productId={p.id}
                qty={qty}
                className="w-full py-3.5 rounded-xl text-[15px] font-bold text-white mb-5 transition-colors bg-rust hover:bg-[#A8521F]"
                addedClassName="w-full py-3.5 rounded-xl text-[15px] font-bold text-white mb-5 transition-colors bg-sage"
                addedChildren="✓ Added to Cart"
              >
                {`Add to Cart — $${(qty * p.price).toFixed(2)}`}
              </AddToCartButton>
            </>
          ) : (
            <div className="bg-linen rounded-xl p-4 mb-5">
              <div className="text-[14px] font-semibold text-soil mb-1">
                {p.is_preorder ? 'Available for preorder soon' : 'Not sold on Grano yet'}
              </div>
              <p className="text-[13px] text-stone leading-relaxed">
                <Link href={`/producers/${farm.slug}`} className="text-rust font-semibold hover:underline">Follow {farm.name}</Link> to hear when this becomes available, or check their profile for other ways to buy.
              </p>
              {hasFindUsLocations && (
                <Link href={`/producers/${farm.slug}#find-us`} className="inline-block mt-2 text-[13px] font-semibold text-rust hover:underline">
                  Find us here →
                </Link>
              )}
            </div>
          )}

          {p.description && (
            <div className="mb-5">
              <h4 className="font-serif text-[18px] font-semibold text-soil mb-2">About these {p.name.toLowerCase()}</h4>
              <p className="text-[14px] text-stone leading-relaxed">{p.description}</p>
            </div>
          )}

          {Boolean(p.specialty_attributes?.roast_level || p.specialty_attributes?.grade || p.specialty_attributes?.origin) && (
            <div className="flex flex-wrap gap-4 mb-5 pb-5 border-b border-[#ECEAE4]">
              {p.specialty_attributes?.roast_level && (
                <div>
                  <div className="text-[11px] font-semibold tracking-wide uppercase text-stone mb-0.5">Roast</div>
                  <div className="text-[14px] text-soil">{p.specialty_attributes.roast_level}</div>
                </div>
              )}
              {p.specialty_attributes?.grade && (
                <div>
                  <div className="text-[11px] font-semibold tracking-wide uppercase text-stone mb-0.5">Grade</div>
                  <div className="text-[14px] text-soil">{p.specialty_attributes.grade}</div>
                </div>
              )}
              {p.specialty_attributes?.origin && (
                <div>
                  <div className="text-[11px] font-semibold tracking-wide uppercase text-stone mb-0.5">Origin</div>
                  <div className="text-[14px] text-soil">{p.specialty_attributes.origin}</div>
                </div>
              )}
            </div>
          )}

          <div id="sourced-from">
            <ProductSourcedFrom sources={sources} />
          </div>
        </div>
      </div>
    </div>
  )
}
