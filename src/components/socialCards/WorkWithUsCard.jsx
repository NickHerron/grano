import { COLORS, Footer } from './CardElements'

// "Work With Us" — a contents-page shape rather than a checkbox list: each enabled
// capability gets its own large serif line, stacked, quiet — what a magazine's table
// of contents looks like, not a spec sheet of feature toggles.
export default function WorkWithUsCard({ business, dims, showGranoLogo, qr, enabled }) {
  return (
    <div style={{ width: dims.width, height: dims.height, display: 'flex', flexDirection: 'column',
      position: 'relative', backgroundColor: COLORS.linen }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: 96 }}>
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 28, letterSpacing: 4,
          textTransform: 'uppercase', color: COLORS.rust, marginBottom: 12 }}>
          Work With Us
        </div>
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 400, fontSize: 30, color: COLORS.stone,
          marginBottom: 36 }}>
          We're currently open for
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {enabled.map((label, i) => (
            <div key={i} style={{ display: 'flex', fontFamily: 'Cormorant Garamond', fontWeight: 600,
              fontSize: 76, lineHeight: 1.12, color: COLORS.soil }}>
              {label}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 30, color: COLORS.soil,
          marginTop: 44 }}>
          {business.name}
        </div>
      </div>

      <div style={{ display: 'flex', padding: '0 96px 72px' }}>
        <Footer showGranoLogo={showGranoLogo} qr={qr} light={false} />
      </div>
    </div>
  )
}
