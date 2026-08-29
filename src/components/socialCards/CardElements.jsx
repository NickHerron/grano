// Shared visual primitives for every Social Card renderer — plain functions returning
// a JSX tree, composed inside next/og's ImageResponse (Satori walks the element tree
// directly; function components work exactly like they do in React, just without a
// real DOM). Every node needs an explicit `display: flex` — Satori has no implicit
// block layout the way a browser does.
//
// Design direction (see the approved plan): the business is the publisher, Grano is
// the infrastructure — so this footer is deliberately small and quiet, never a header,
// never competing with the business's own name/photo for attention.
export const COLORS = {
  soil: '#1E1509',
  wheat: '#C8943A',
  sage: '#4A7A51',
  rust: '#C0622E',
  stone: '#6B6355',
  linen: '#F7F5F1',
}

export function Footer({ showGranoLogo, qr, light }) {
  if (!showGranoLogo && !qr) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <div style={{ display: 'flex', fontFamily: 'DM Sans', fontSize: 24, fontWeight: 600, letterSpacing: 2,
        textTransform: 'uppercase', color: light ? 'rgba(247,245,241,0.75)' : 'rgba(30,21,9,0.55)' }}>
        {showGranoLogo ? 'grano.network' : ''}
      </div>
      {qr && (
        // A dark QR on a dark photo has no contrast to scan reliably — a small light
        // chip behind it guarantees scannability regardless of what's underneath.
        <div style={{ display: 'flex', backgroundColor: COLORS.linen, padding: 10, borderRadius: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} width={80} height={80} style={{ display: 'flex' }} />
        </div>
      )}
    </div>
  )
}

// Full-bleed background photo with a bottom-anchored dark scrim for text legibility —
// the "photography is the dominant visual element" half of the design direction. Falls
// back to a solid warm color when a business has no usable photo, per the same
// direction ("leans harder into typography and whitespace rather than filling the gap
// with a generic graphic").
export function PhotoBackground({ src, width, height, scrim = true }) {
  if (!src) return null
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} width={width} height={height}
        style={{ position: 'absolute', top: 0, left: 0, width, height, objectFit: 'cover', display: 'flex' }} />
      {scrim && (
        <div style={{ position: 'absolute', top: 0, left: 0, width, height, display: 'flex',
          background: 'linear-gradient(to top, rgba(30,21,9,0.90) 0%, rgba(30,21,9,0.45) 42%, rgba(30,21,9,0) 68%)' }} />
      )}
    </>
  )
}
