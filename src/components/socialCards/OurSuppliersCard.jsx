import StatCard from './StatCard'

// "Who We Source From" — the source_from slice of the same public Local Network data
// Local Network's own card shows in full (storyCards.js#computeLocalNetworkStats).
export default function OurSuppliersCard({ business, dims, showGranoLogo, qr, sourceFrom }) {
  const caption = sourceFrom.slice(0, 4).map(b => b.name).join('   ·   ')

  return (
    <StatCard
      business={business} dims={dims} showGranoLogo={showGranoLogo} qr={qr}
      eyebrow="Who We Source From" count={sourceFrom.length} photo={business.cover_photo_url}
      label={`Local Supplier${sourceFrom.length === 1 ? '' : 's'}`} caption={caption}
    />
  )
}
