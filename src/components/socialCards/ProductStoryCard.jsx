import { COLORS, Footer, PhotoBackground } from './CardElements'
import { truncate } from '@/lib/socialCards/render'

// "This product has a story" — one product's own sourcing tags, editorial-caption
// style rather than a spec sheet. Only ever rendered when storyCards.js's
// computeProductStory() found at least one tag; the caller is responsible for the
// spec's own suggested fallback ("Add local sources to this product...") when it
// hasn't, since that's a UI concern for the picker, not this renderer's job.
export default function ProductStoryCard({ business, dims, showGranoLogo, qr, story }) {
  const { product, sources } = story
  const photo = product.image_url
  const light = Boolean(photo)
  const lines = sources.slice(0, 5).map(s => {
    const label = s.ingredientLabel || s.business.name
    return `${label} — ${s.business.name}`
  })

  return (
    <div style={{ width: dims.width, height: dims.height, display: 'flex', flexDirection: 'column',
      position: 'relative', backgroundColor: COLORS.linen }}>
      <PhotoBackground src={photo} width={dims.width} height={dims.height} />

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', padding: 72, gap: 18 }}>
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontSize: 26, fontWeight: 600, letterSpacing: 3,
          textTransform: 'uppercase', color: light ? 'rgba(247,245,241,0.85)' : COLORS.stone }}>
          This Product Has a Story
        </div>
        <div style={{ display: 'flex', fontFamily: 'Cormorant Garamond', fontWeight: 600, fontSize: 84,
          lineHeight: 1.05, color: light ? COLORS.linen : COLORS.soil }}>
          {truncate(product.name, 60)}
        </div>
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 400, fontSize: 30,
          color: light ? 'rgba(247,245,241,0.9)' : COLORS.soil }}>
          Made with products from {sources.length} local business{sources.length === 1 ? '' : 'es'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {lines.map((line, i) => (
            <div key={i} style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 400, fontSize: 26,
              color: light ? 'rgba(247,245,241,0.8)' : COLORS.stone }}>
              {line}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 26,
          color: light ? COLORS.linen : COLORS.soil, marginTop: 6 }}>
          {business.name}
        </div>
        <div style={{ display: 'flex', marginTop: 16 }}>
          <Footer showGranoLogo={showGranoLogo} qr={qr} light={light} />
        </div>
      </div>
    </div>
  )
}
