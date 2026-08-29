import StatCard from './StatCard'

// "Who We Supply" — the supplies_to slice of the same public Local Network data
// Local Network's own card shows in full (storyCards.js#computeLocalNetworkStats).
export default function WhoWeSupplyCard({ business, dims, showGranoLogo, qr, suppliesTo }) {
  const caption = suppliesTo.slice(0, 4).map(b => b.name).join('   ·   ')

  return (
    <StatCard
      business={business} dims={dims} showGranoLogo={showGranoLogo} qr={qr}
      eyebrow="Who We Supply" count={suppliesTo.length} photo={business.cover_photo_url}
      label={`Local Business${suppliesTo.length === 1 ? '' : 'es'}`} caption={caption}
    />
  )
}
