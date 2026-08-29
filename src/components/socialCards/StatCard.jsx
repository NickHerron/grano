import { COLORS, Footer } from './CardElements'

// The typographic "pull-quote" shape shared by every stat-led card (Local Network,
// Sourcing, Our Suppliers) — a bare number set huge, a small-caps label beneath it,
// an optional one-line caption naming what's behind the number. Extracted out of what
// was originally LocalNetworkCard's own layout so Phase 4's Sourcing/Our Suppliers
// cards reuse the exact same shape instead of a second copy.
export default function StatCard({ business, dims, showGranoLogo, qr, eyebrow, count, label, caption, photo }) {
  return (
    <div style={{ width: dims.width, height: dims.height, display: 'flex', flexDirection: 'column',
      position: 'relative', backgroundColor: COLORS.soil }}>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} width={dims.width} height={dims.height}
          style={{ position: 'absolute', top: 0, left: 0, width: dims.width, height: dims.height,
            objectFit: 'cover', opacity: 0.22, display: 'flex' }} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: 96 }}>
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 28, letterSpacing: 4,
          textTransform: 'uppercase', color: COLORS.wheat, marginBottom: 20 }}>
          {eyebrow}
        </div>
        <div style={{ display: 'flex', fontFamily: 'Cormorant Garamond', fontWeight: 700, fontSize: 320,
          lineHeight: 0.92, color: COLORS.linen }}>
          {count}
        </div>
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 38, letterSpacing: 2,
          textTransform: 'uppercase', color: COLORS.linen, marginTop: 14 }}>
          {label}
        </div>
        {caption && (
          <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 400, fontSize: 28,
            color: 'rgba(247,245,241,0.75)', marginTop: 16, maxWidth: dims.width - 192 }}>
            {caption}
          </div>
        )}
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 400, fontSize: 30,
          color: 'rgba(247,245,241,0.65)', marginTop: 18 }}>
          {business.name}
        </div>
      </div>

      <div style={{ display: 'flex', padding: '0 96px 72px' }}>
        <Footer showGranoLogo={showGranoLogo} qr={qr} light={true} />
      </div>
    </div>
  )
}
