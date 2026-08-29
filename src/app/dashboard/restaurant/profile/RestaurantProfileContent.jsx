import { Suspense } from 'react'
import Link from 'next/link'
import DocumentsManager from '@/components/DocumentsManager'
import SectionTabs from '@/components/SectionTabs'
import RestaurantProfileForm from './RestaurantProfileForm'
import WholesaleTabContent from './WholesaleTabContent'
import WorkOptionsManager from '../../profile/WorkOptionsManager'

// Pure presentation, fed pre-fetched data — queries live in the Restaurant hub page
// (src/app/dashboard/restaurant/page.jsx). Nested SectionTabs uses paramName="tab" so
// it doesn't collide with the hub's outer ?section= param.
export default function RestaurantProfileContent({ restaurant, documentRows, workOptions, sourcingRequests = [], roles = [], memberships = [], availableAreas = [] }) {
  const missingRequired = documentRows.filter(r => r.required && r.effectiveStatus === 'not_uploaded').length

  const tabs = [
    { key: 'info', label: 'Basic Info', content: <RestaurantProfileForm restaurant={restaurant} roles={roles} memberships={memberships} availableAreas={availableAreas} /> },
    { key: 'wholesale', label: 'Wholesale', content: <WholesaleTabContent restaurant={restaurant} initialRequests={sourcingRequests} /> },
    { key: 'work-with-us', label: 'Work With Us', content: <WorkOptionsManager businessType="restaurant" businessId={restaurant.id} options={workOptions} /> },
    { key: 'documents', label: 'Documents', badge: missingRequired || null, content: <DocumentsManager ownerType="restaurant" ownerId={restaurant.id} rows={documentRows} /> },
  ]

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <p className="text-[13px] text-stone">This is what producers and diners see on your public Grano page, plus the private documents Grano may ask for.</p>
        <Link href={`/restaurants/${restaurant.slug}`} target="_blank" className="text-[13px] font-semibold text-rust hover:underline whitespace-nowrap flex-shrink-0">
          View public page →
        </Link>
      </div>
      <Suspense fallback={null}>
        <SectionTabs tabs={tabs} />
      </Suspense>
    </div>
  )
}
