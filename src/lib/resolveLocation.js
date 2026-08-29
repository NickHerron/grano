import { headers, cookies } from 'next/headers'

// The site's implicit default — what every visitor effectively sees today. Used only
// when there's no signal at all (no cookie, no geo headers — e.g. local dev or a
// non-Vercel request), so behavior doesn't regress for anyone. NOT used when a real,
// detected location just doesn't match any Grano activity (see resolveArea() in
// locationQueries.js) — that's a different, honest "we're not here yet" case.
export const DEFAULT_AREA = { city: 'Chicago', state: 'IL' }

const COOKIE_NAME = 'grano_location'

// Raw location signal for this request, cheapest-first: an explicit "Choose Your
// Location" cookie always wins, then Vercel's free edge geo headers, then null.
// Deliberately NOT read in middleware — src/middleware.js's matcher only covers
// /dashboard and /onboarding, and widening it just to read a header isn't worth the
// risk to its auth/role gating. Called directly from Server Components instead,
// where next/headers works the same way.
export function resolveLocation() {
  const cookieStore = cookies()
  const override = cookieStore.get(COOKIE_NAME)?.value
  if (override) {
    const [state, city] = override.split('|')
    if (state && city) return { city, state, source: 'cookie' }
  }

  const headerList = headers()
  // x-vercel-ip-city is URL-encoded ("San%20Francisco"); country-region is the ISO
  // 3166-2 subdivision code, which for a US request is exactly our 2-letter state.
  const rawCity = headerList.get('x-vercel-ip-city')
  const state = headerList.get('x-vercel-ip-country-region')
  const country = headerList.get('x-vercel-ip-country')
  if (rawCity && state && (!country || country === 'US')) {
    return { city: decodeURIComponent(rawCity), state, source: 'vercel-geo' }
  }

  return null
}

export function locationCookieName() {
  return COOKIE_NAME
}
