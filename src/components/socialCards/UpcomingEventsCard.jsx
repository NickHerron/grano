import { COLORS, Footer, PhotoBackground } from './CardElements'
import { formatDate } from '@/lib/formatDate'

// "Find Us This Weekend" — the single soonest event, matching the spec's own example
// shape: a day, a place, a time. One upcoming date, not a calendar dump.
export default function UpcomingEventsCard({ business, dims, showGranoLogo, qr, event }) {
  const photo = business.cover_photo_url
  const light = Boolean(photo)
  const dateLabel = formatDate(event.date, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{ width: dims.width, height: dims.height, display: 'flex', flexDirection: 'column',
      position: 'relative', backgroundColor: COLORS.soil }}>
      <PhotoBackground src={photo} width={dims.width} height={dims.height} />

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', padding: 72, gap: 16 }}>
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 26, letterSpacing: 3,
          textTransform: 'uppercase', color: light ? COLORS.wheat : COLORS.wheat }}>
          Find Us Next
        </div>
        <div style={{ display: 'flex', fontFamily: 'Cormorant Garamond', fontWeight: 600, fontSize: 66,
          lineHeight: 1.1, color: COLORS.linen }}>
          {dateLabel}
        </div>
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 38,
          color: COLORS.linen, marginTop: 4 }}>
          {event.location.name}
        </div>
        {event.location.hours && (
          <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 400, fontSize: 30,
            color: 'rgba(247,245,241,0.8)' }}>
            {event.location.hours}
          </div>
        )}
        {event.location.address && (
          <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 400, fontSize: 26,
            color: 'rgba(247,245,241,0.65)' }}>
            {event.location.address}
          </div>
        )}
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 400, fontSize: 28,
          color: 'rgba(247,245,241,0.65)', marginTop: 8 }}>
          {business.name}
        </div>
        <div style={{ display: 'flex', marginTop: 16 }}>
          <Footer showGranoLogo={showGranoLogo} qr={qr} light={true} />
        </div>
      </div>
    </div>
  )
}
