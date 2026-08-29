import Link from 'next/link'
import { getInitials } from '@/lib/initials'

export default function RestaurantCard({ restaurant }) {
  const locationLine = [restaurant.neighborhood, restaurant.location].filter(Boolean).join(' · ')
  const badges = [
    ...(restaurant.sells_wholesale ? ['Sells Wholesale'] : []),
    ...(restaurant.buys_wholesale ? ['Buying Wholesale'] : []),
  ]
  return (
    <Link href={`/restaurants/${restaurant.slug}`}
      className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden hover:border-rust transition-colors group">
      <div className="h-32 bg-linen flex items-center justify-center overflow-hidden">
        {restaurant.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={restaurant.logo_url} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-serif text-3xl font-semibold text-soil/25">{getInitials(restaurant.name)}</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-serif text-[17px] font-semibold text-soil group-hover:text-rust transition-colors">{restaurant.name}</span>
          {restaurant.verification_status === 'verified' && (
            <span title="Verified" className="w-4 h-4 rounded-full bg-sage text-white flex items-center justify-center text-[9px] flex-shrink-0">✓</span>
          )}
        </div>
        <div className="text-[12px] text-stone">{[restaurant.restaurant_type, locationLine].filter(Boolean).join(' · ') || 'Chicago area'}</div>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {badges.map(label => (
              <span key={label} className="text-[10px] font-semibold bg-[#FDF0E8] text-rust px-2 py-0.5 rounded">{label}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
