import Link from 'next/link'
import { getInitials } from '@/lib/initials'
import { ORG_TYPE_LABELS } from '@/lib/businessNetwork'
import { formatScheduleLine } from '@/lib/schedule'

export default function MarketCard({ organization }) {
  const locationLine = [organization.neighborhood, organization.location].filter(Boolean).join(' · ')
  const scheduleLine = formatScheduleLine(organization)
  return (
    <Link href={`/markets/${organization.slug}`}
      className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden hover:border-rust transition-colors group">
      <div className="h-32 bg-linen flex items-center justify-center overflow-hidden">
        {organization.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={organization.logo_url} alt={organization.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-serif text-3xl font-semibold text-soil/25">{getInitials(organization.name)}</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-serif text-[17px] font-semibold text-soil group-hover:text-rust transition-colors">{organization.name}</span>
          {organization.verification_status === 'verified' && (
            <span title="Grano Verified" className="w-4 h-4 rounded-full bg-sage text-white flex items-center justify-center text-[9px] flex-shrink-0">✓</span>
          )}
        </div>
        <div className="text-[12px] text-stone">{[ORG_TYPE_LABELS[organization.org_type], locationLine].filter(Boolean).join(' · ') || 'Chicago area'}</div>
        {scheduleLine && <div className="text-[12px] text-stone mt-1.5">{scheduleLine}</div>}
      </div>
    </Link>
  )
}
