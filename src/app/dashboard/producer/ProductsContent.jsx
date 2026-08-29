'use client'
import { useState } from 'react'
import Link from 'next/link'
import DeleteProductButton from './DeleteProductButton'

// Filter chips built from fields that already exist on products (for_sale,
// is_available, stock, season months) rather than inventing new draft/archived
// status columns — this reads as "Active / Seasonal / Sold Out / Not for sale"
// without adding a whole new product-state system.
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active', test: p => p.for_sale && p.is_available !== false && p.stock !== 0 },
  { key: 'seasonal', label: 'Seasonal', test: p => Boolean(p.season_start_month) },
  { key: 'sold_out', label: 'Sold Out', test: p => p.stock === 0 },
  { key: 'not_for_sale', label: 'Not For Sale', test: p => !p.for_sale },
  { key: 'wholesale', label: 'Wholesale', test: p => p.wholesale_price != null },
]

export default function ProductsContent({ farm, products }) {
  const [filter, setFilter] = useState('all')
  const activeFilter = FILTERS.find(f => f.key === filter)
  const filtered = filter === 'all' ? products : products.filter(activeFilter.test)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-4">
        <p className="text-[13px] text-stone">{farm?.name} · {products?.length || 0} listing{products?.length === 1 ? '' : 's'}</p>
        <Link href="/dashboard/producer/new" className="bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors whitespace-nowrap">
          + Add Product
        </Link>
      </div>

      {products?.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg border-[1.5px] transition-all ${
                filter === f.key ? 'bg-soil border-soil text-white' : 'border-[#ECEAE4] text-stone hover:border-rust hover:text-rust'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {!products?.length ? (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
          <p className="text-[14px] text-stone mb-4">You haven't listed any products yet.</p>
          <Link href="/dashboard/producer/new" className="text-[14px] font-semibold text-rust hover:underline">Add your first product →</Link>
        </div>
      ) : !filtered.length ? (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
          <p className="text-[14px] text-stone">No products match this filter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-white border border-[#ECEAE4] rounded-xl p-4 grid grid-cols-[64px_1fr_auto] gap-4 items-center">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: p.img_bg }}>
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-serif text-lg font-semibold text-soil/25">{p.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-serif text-[18px] font-semibold text-soil truncate">{p.name}</div>
                <div className="text-[12px] text-stone capitalize truncate">{p.category || 'Uncategorized'} · ${p.price} / {p.unit} · Stock: {p.stock ?? '—'}</div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link href={`/dashboard/producer/${p.id}/edit`} className="text-[13px] font-semibold text-soil bg-linen px-3.5 py-2 rounded-lg hover:bg-[#E4E0D5] transition-colors">
                  Edit
                </Link>
                <DeleteProductButton id={p.id} name={p.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
