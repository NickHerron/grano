import StatCard from './StatCard'

// "Our Local Network" — Phase 2 proved this as a bare count; Phase 5 adds a quiet
// caption naming a few real partners (not a logo grid — a small grid of fetched
// partner logos is real added failure surface for a busy, un-editorial result; a
// short named list reads more like a magazine credit line and fits the "generous
// whitespace, one idea per card" design direction better).
export default function LocalNetworkCard({ business, dims, showGranoLogo, qr, count, partners = [] }) {
  const caption = partners.slice(0, 4).map(b => b.name).join('   ·   ')

  return (
    <StatCard
      business={business} dims={dims} showGranoLogo={showGranoLogo} qr={qr}
      eyebrow="Our Local Network" count={count} photo={business.cover_photo_url}
      label={`Local Business${count === 1 ? '' : 'es'}`} caption={caption}
    />
  )
}
