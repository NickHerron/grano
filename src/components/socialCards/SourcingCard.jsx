import StatCard from './StatCard'

// "Where Our Products Come From" — product_sources rolled up across a farm's whole
// catalog (storyCards.js#computeSourcingStats). Caption names the categories behind
// the number (e.g. "2 Farms · 1 Mill") per the spec's own example, using
// storyCards.js's short-label map so long producer_type values fit.
export default function SourcingCard({ business, dims, showGranoLogo, qr, sourcing }) {
  const caption = Object.entries(sourcing.byCategory)
    .map(([label, n]) => `${n} ${label}${n === 1 ? '' : 's'}`)
    .join('   ·   ')

  return (
    <StatCard
      business={business} dims={dims} showGranoLogo={showGranoLogo} qr={qr}
      eyebrow="Where Our Products Come From" count={sourcing.total} photo={business.cover_photo_url}
      label={`Local Business${sourcing.total === 1 ? '' : 'es'}`} caption={caption}
    />
  )
}
