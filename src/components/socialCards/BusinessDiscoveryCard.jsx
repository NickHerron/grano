import { COLORS, Footer, PhotoBackground } from './CardElements'
import { truncate } from '@/lib/socialCards/render'

// "Meet the people behind the food" — the simplest card: a business's own name,
// intro, category, and place, over their own photo. Zero cross-table joins. Proves
// the base rendering pipeline (photo fetch, scrim, editorial typography, footer)
// before any card that needs real data-layer work (Phase 3+).
export default function BusinessDiscoveryCard({ business, businessType, dims, showGranoLogo, qr }) {
  const photo = business.cover_photo_url || business.profile_photo_url || business.logo_url
  const category = businessType === 'farm' ? business.producer_type : business.restaurant_type
  const place = business.neighborhood || business.location
  const intro = truncate(business.bio || business.story || '', 140)
  const light = Boolean(photo)

  return (
    <div style={{ width: dims.width, height: dims.height, display: 'flex', flexDirection: 'column',
      position: 'relative', backgroundColor: COLORS.linen }}>
      <PhotoBackground src={photo} width={dims.width} height={dims.height} />

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', padding: 72, gap: 18 }}>
        {(category || place) && (
          <div style={{ display: 'flex', fontFamily: 'DM Sans', fontSize: 26, fontWeight: 600, letterSpacing: 3,
            textTransform: 'uppercase', color: light ? 'rgba(247,245,241,0.85)' : COLORS.stone }}>
            {[category, place].filter(Boolean).join('   ·   ')}
          </div>
        )}
        <div style={{ display: 'flex', fontFamily: 'Cormorant Garamond', fontWeight: 600, fontSize: 92,
          lineHeight: 1.05, color: light ? COLORS.linen : COLORS.soil }}>
          {business.name}
        </div>
        {intro && (
          <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 400, fontSize: 30, lineHeight: 1.45,
            color: light ? 'rgba(247,245,241,0.92)' : COLORS.soil, maxWidth: dims.width - 144 }}>
            {intro}
          </div>
        )}
        <div style={{ display: 'flex', marginTop: 20 }}>
          <Footer showGranoLogo={showGranoLogo} qr={qr} light={light} />
        </div>
      </div>
    </div>
  )
}
