'use client'
import Link from 'next/link'
import { getInitials } from '@/lib/initials'
import FollowButton from '@/components/FollowButton'

const PRACTICE_BADGES = [
  ['pickup_available', 'Pickup Available'],
  ['csa_available', 'CSA Available'],
]

export default function ProducerCard({ farm: f }) {
  // Wholesale badges read the top-level sellsWholesale/buysWholesale flags, not
  // practices — that's now the source of truth for wholesale capability, independent
  // of business type (see schema_wholesale_capabilities.sql). Everything else here
  // still comes from practices (ownership/trust badges, unrelated to this).
  const badges = [
    ...(f.sellsWholesale ? [['sells_wholesale', 'Sells Wholesale']] : []),
    ...(f.buysWholesale ? [['buys_wholesale', 'Buying Wholesale']] : []),
    ...PRACTICE_BADGES.filter(([key]) => f.practices?.[key]),
  ]

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex gap-3 items-start">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: f.avatarBg }}>
          {f.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.logoUrl} alt={f.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-serif text-[15px] font-semibold text-soil/50">{getInitials(f.name)}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="font-serif text-[18px] font-semibold text-soil truncate">{f.name}</div>
            {f.verificationStatus === 'verified' && (
              <span title="Verified Producer" className="w-4 h-4 rounded-full bg-sage text-white flex items-center justify-center text-[9px] flex-shrink-0">✓</span>
            )}
          </div>
          {/* Real info only — no distance (never actually computed) and no fake
              review/restaurant-count placeholders when there's no real data behind them. */}
          <div className="text-[12px] text-stone truncate">
            {[f.producerType, f.location || 'Chicago, IL'].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>

      {f.bio && <p className="text-[13px] leading-relaxed text-stone line-clamp-2">{f.bio}</p>}

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map(([key, label]) => (
            <span key={key} className="text-[10px] font-semibold bg-[#FDF0E8] text-rust px-2 py-0.5 rounded">{label}</span>
          ))}
        </div>
      )}

      {f.availableProducts?.length > 0 ? (
        <div className="text-[12px] text-stone">
          <span className="font-semibold text-soil">Currently available: </span>
          {f.availableProducts.slice(0, 3).join(' · ')}
        </div>
      ) : f.productCount > 0 ? (
        <div className="text-[12px] text-stone">{f.productCount} product{f.productCount === 1 ? '' : 's'} on their profile</div>
      ) : null}

      <div className="flex flex-col gap-2 mt-auto pt-1">
        <Link href={`/producers/${f.slug}#work-with-us`}
          className="text-center text-[13px] font-semibold bg-rust text-white py-1.5 rounded-lg hover:bg-[#A8521F] transition-colors">
          Work With Us →
        </Link>
        <div className="flex gap-2">
          <FollowButton
            farmId={f.id}
            initialFollowing={f.isFollowing || false}
            className="flex-1 text-[13px] font-medium py-1.5 rounded-lg border-[1.5px] transition-all border-[#ECEAE4] text-stone hover:border-rust hover:text-rust"
            followingClassName="flex-1 text-[13px] font-medium py-1.5 rounded-lg border-[1.5px] transition-all bg-[#EBF3EC] border-sage text-sage"
          />
          <Link href={`/producers/${f.slug}`}
            className="flex-1 text-center text-[13px] font-semibold bg-linen text-soil py-1.5 rounded-lg hover:bg-[#E4E0D5] transition-colors">
            View Profile →
          </Link>
        </div>
      </div>
    </div>
  )
}
