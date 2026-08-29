// Social Cards rendering plumbing — font loading, QR generation, and the small text
// helpers every card renderer needs. Kept separate from the route handler so future
// card types (Phase 4/5) import the same primitives instead of re-solving them.
//
// Fonts are read via fs.readFile from public/fonts/ — not fetch(new URL(...,
// import.meta.url)), which is really an Edge-runtime idiom: in this Node.js runtime
// route handler, Next's webpack rewrites that pattern to a bare relative asset path
// (e.g. "/_next/static/media/...woff"), and Node's fetch/undici rejects a relative
// URL outright (confirmed locally — ERR_INVALID_URL). public/ is always deployed
// verbatim on Vercel, so reading from it via an explicit process.cwd()-joined path is
// the reliable choice here, with none of the file-tracing ambiguity a path elsewhere
// in the repo would carry.
import { readFile } from 'fs/promises'
import path from 'path'
import QRCode from 'qrcode'

export const CARD_FORMATS = {
  story: { width: 1080, height: 1920 },
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://grano.network'

const FONT_DIR = path.join(process.cwd(), 'public', 'fonts')

let fontsPromise = null
export function loadCardFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      readFile(path.join(FONT_DIR, 'CormorantGaramond-Regular.woff')),
      readFile(path.join(FONT_DIR, 'CormorantGaramond-SemiBold.woff')),
      readFile(path.join(FONT_DIR, 'CormorantGaramond-Bold.woff')),
      readFile(path.join(FONT_DIR, 'DMSans-Regular.woff')),
      readFile(path.join(FONT_DIR, 'DMSans-SemiBold.woff')),
      readFile(path.join(FONT_DIR, 'DMSans-Bold.woff')),
    ]).then(([serifReg, serifSemi, serifBold, sansReg, sansSemi, sansBold]) => [
      { name: 'Cormorant Garamond', data: serifReg, weight: 400, style: 'normal' },
      { name: 'Cormorant Garamond', data: serifSemi, weight: 600, style: 'normal' },
      { name: 'Cormorant Garamond', data: serifBold, weight: 700, style: 'normal' },
      { name: 'DM Sans', data: sansReg, weight: 400, style: 'normal' },
      { name: 'DM Sans', data: sansSemi, weight: 600, style: 'normal' },
      { name: 'DM Sans', data: sansBold, weight: 700, style: 'normal' },
    ])
  }
  return fontsPromise
}

// Satori has no CSS text-truncation — a long business name or bio silently overflows
// the card's bounds instead of ellipsizing, so every free-text field must be cut down
// to a card-appropriate budget before it ever reaches a renderer.
export function truncate(text, max) {
  if (!text) return ''
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return trimmed.slice(0, max - 1).trimEnd() + '…'
}

// A quiet, scannable QR pointing at the business's real Grano page — generated as a
// raster data URL (not raw SVG) since Satori's SVG support is a constrained subset;
// a data URL is treated like any other image source with no extra handling needed.
export async function qrDataUrl(url) {
  return QRCode.toDataURL(url, {
    margin: 0,
    width: 240,
    color: { dark: '#1E1509', light: '#0000' },
  })
}

export function profilePath(businessType, slug) {
  return businessType === 'farm' ? `/producers/${slug}` : `/restaurants/${slug}`
}
