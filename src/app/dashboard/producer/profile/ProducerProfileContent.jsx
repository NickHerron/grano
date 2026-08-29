import { Suspense } from 'react'
import DocumentsManager from '@/components/DocumentsManager'
import SectionTabs from '@/components/SectionTabs'
import ProfileForm from './ProfileForm'
import GalleryManager from '../gallery/GalleryManager'
import LocationsManager from '../locations/LocationsManager'
import PostsManager from '../posts/PostsManager'
import ReviewsContent from '../reviews/ReviewsContent'
import WorkOptionsManager from '../../profile/WorkOptionsManager'
import WholesaleTabContent from './WholesaleTabContent'

// Pure presentation, fed pre-fetched data — the actual queries live wherever this is
// mounted (the Profile hub page) so this can be reused without a second round trip.
// Uses its own nested SectionTabs (paramName="tab") so it doesn't collide with an
// outer ?section= tab param from a parent hub page.
export default function ProducerProfileContent({ farm, photos, locations, posts, documentRows, reviewInvites, reviews, workOptions, sourcingRequests = [], roles = [], memberships = [], availableAreas = [] }) {
  const missingRequired = documentRows.filter(r => r.required && r.effectiveStatus === 'not_uploaded').length

  const tabs = [
    { key: 'info', label: 'Basic Info', content: <ProfileForm farm={farm} roles={roles} memberships={memberships} availableAreas={availableAreas} /> },
    { key: 'photos', label: 'Photos', content: <GalleryManager farmId={farm.id} initialPhotos={photos} /> },
    { key: 'find-us', label: 'Find Us', content: <LocationsManager farmId={farm.id} initialLocations={locations} /> },
    { key: 'posts', label: 'News & Updates', content: <PostsManager farmId={farm.id} initialPosts={posts} /> },
    { key: 'wholesale', label: 'Wholesale', content: <WholesaleTabContent farm={farm} initialRequests={sourcingRequests} /> },
    { key: 'work-with-us', label: 'Work With Us', content: <WorkOptionsManager businessType="farm" businessId={farm.id} options={workOptions} /> },
    { key: 'documents', label: 'Documents', badge: missingRequired || null, content: <DocumentsManager ownerType="farm" ownerId={farm.id} rows={documentRows} /> },
    { key: 'reviews', label: 'Reviews', content: <ReviewsContent farmId={farm.id} slug={farm.slug} invites={reviewInvites} reviews={reviews} /> },
  ]

  return (
    <div>
      <p className="text-[13px] text-stone mb-5">
        Everything that builds out your public Grano page — basic info, photos, where to find you, updates, and documents.
      </p>
      <Suspense fallback={null}>
        <SectionTabs tabs={tabs} />
      </Suspense>
    </div>
  )
}
