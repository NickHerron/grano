import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { CARD_FORMATS, SITE_URL, loadCardFonts, qrDataUrl, profilePath } from '@/lib/socialCards/render'
import {
  computeLocalNetworkStats, computeSourcingStats, computeProductStory,
  computeWorkWithUsStats, computeUpcomingEvent,
} from '@/lib/storyCards'
import BusinessDiscoveryCard from '@/components/socialCards/BusinessDiscoveryCard'
import LocalNetworkCard from '@/components/socialCards/LocalNetworkCard'
import SourcingCard from '@/components/socialCards/SourcingCard'
import OurSuppliersCard from '@/components/socialCards/OurSuppliersCard'
import WhoWeSupplyCard from '@/components/socialCards/WhoWeSupplyCard'
import WorkWithUsCard from '@/components/socialCards/WorkWithUsCard'
import UpcomingEventsCard from '@/components/socialCards/UpcomingEventsCard'
import ProductStoryCard from '@/components/socialCards/ProductStoryCard'

// Node runtime, not Edge — gives synchronous headroom for the real work each request
// does (photo fetch, QR generation, flex composition) and keeps the qrcode package's
// Buffer usage on solid ground. This is also the single endpoint both the dashboard's
// live preview AND the final download/share hit — same params in, same bytes out, so
// preview and export can never drift apart into two different code paths.
//
// The handler always re-derives every number from businessId server-side; it never
// trusts a stat value passed in the query string, so this endpoint can't be used to
// spoof a card showing fabricated numbers. It reads through the caller's own
// session-scoped Supabase client (not service-role) — an owner previewing their own
// business sees full data, and existing RLS (not extra logic here) is what limits a
// non-owner request to whatever's already publicly visible.
export const runtime = 'nodejs'

// Phase 6 (profile_milestone) is the last card_type in schema_social_cards.sql's
// CHECK list, folded into the dashboard hub rather than getting its own renderer here.
const CARD_RENDERERS = {
  business_discovery: renderBusinessDiscovery,
  local_network: renderLocalNetwork,
  sourcing: renderSourcing,
  our_suppliers: renderOurSuppliers,
  who_we_supply: renderWhoWeSupply,
  work_with_us: renderWorkWithUs,
  upcoming_events: renderUpcomingEvents,
  product_story: renderProductStory,
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const format = searchParams.get('format') || 'square'
  const businessType = searchParams.get('businessType')
  const businessId = searchParams.get('businessId')
  const productId = searchParams.get('productId')
  // Not a toggle — every card should say where to find the business. Ignored even if
  // a URL tries to pass showGranoLogo=false, not just hidden from the customize UI.
  const showGranoLogo = true
  const showQr = searchParams.get('showQr') !== 'false'

  const dims = CARD_FORMATS[format]
  const renderer = CARD_RENDERERS[type]
  if (!dims || !renderer || (businessType !== 'farm' && businessType !== 'restaurant') || !businessId) {
    return new Response('Bad request', { status: 400 })
  }

  const supabase = createClient()
  const table = businessType === 'farm' ? 'farms' : 'restaurants'
  const { data: business } = await supabase.from(table).select('*').eq('id', businessId).maybeSingle()
  if (!business) return new Response('Not found', { status: 404 })

  const [fonts, qr] = await Promise.all([
    loadCardFonts(),
    showQr ? qrDataUrl(`${SITE_URL}${profilePath(businessType, business.slug)}`) : Promise.resolve(null),
  ])

  const element = await renderer({ supabase, business, businessType, dims, showGranoLogo, qr, productId })
  if (!element) return new Response('Card unavailable — no data to show yet', { status: 404 })

  return new ImageResponse(element, { width: dims.width, height: dims.height, fonts })
}

function renderBusinessDiscovery({ business, businessType, dims, showGranoLogo, qr }) {
  return <BusinessDiscoveryCard business={business} businessType={businessType} dims={dims} showGranoLogo={showGranoLogo} qr={qr} />
}

async function renderLocalNetwork({ supabase, business, businessType, dims, showGranoLogo, qr }) {
  const { total, partners } = await computeLocalNetworkStats(supabase, { type: businessType, id: business.id })
  if (!total) return null
  return <LocalNetworkCard business={business} dims={dims} showGranoLogo={showGranoLogo} qr={qr} count={total} partners={partners} />
}

async function renderSourcing({ supabase, business, businessType, dims, showGranoLogo, qr }) {
  const sourcing = await computeSourcingStats(supabase, { ...business, type: businessType })
  if (!sourcing.total) return null
  return <SourcingCard business={business} dims={dims} showGranoLogo={showGranoLogo} qr={qr} sourcing={sourcing} />
}

async function renderOurSuppliers({ supabase, business, businessType, dims, showGranoLogo, qr }) {
  const { sourceFrom } = await computeLocalNetworkStats(supabase, { type: businessType, id: business.id })
  if (!sourceFrom.length) return null
  return <OurSuppliersCard business={business} dims={dims} showGranoLogo={showGranoLogo} qr={qr} sourceFrom={sourceFrom} />
}

async function renderWhoWeSupply({ supabase, business, businessType, dims, showGranoLogo, qr }) {
  const { suppliesTo } = await computeLocalNetworkStats(supabase, { type: businessType, id: business.id })
  if (!suppliesTo.length) return null
  return <WhoWeSupplyCard business={business} dims={dims} showGranoLogo={showGranoLogo} qr={qr} suppliesTo={suppliesTo} />
}

async function renderWorkWithUs({ supabase, business, businessType, dims, showGranoLogo, qr }) {
  const [{ data: workOptionRows }, { count: productCount }, { count: sourcingCount }] = await Promise.all([
    supabase.from('business_work_options').select('*').eq('business_type', businessType).eq('business_id', business.id),
    businessType === 'farm'
      ? supabase.from('products').select('id', { count: 'exact', head: true }).eq('farm_id', business.id)
      : Promise.resolve({ count: 0 }),
    supabase.from('sourcing_requests').select('id', { count: 'exact', head: true })
      .eq('owner_type', businessType).eq('owner_id', business.id).eq('status', 'open'),
  ])
  const ctx = { hasProducts: (productCount || 0) > 0, hasOpenSourcingRequests: (sourcingCount || 0) > 0 }
  const { enabled } = await computeWorkWithUsStats(supabase, business, businessType, workOptionRows, ctx)
  if (!enabled.length) return null
  return <WorkWithUsCard business={business} dims={dims} showGranoLogo={showGranoLogo} qr={qr} enabled={enabled} />
}

async function renderUpcomingEvents({ supabase, business, businessType, dims, showGranoLogo, qr }) {
  if (businessType !== 'farm') return null // farm_locations is farm-only today
  const { data: locations } = await supabase.from('farm_locations').select('*').eq('farm_id', business.id)
  const event = computeUpcomingEvent(locations)
  if (!event) return null
  return <UpcomingEventsCard business={business} dims={dims} showGranoLogo={showGranoLogo} qr={qr} event={event} />
}

async function renderProductStory({ supabase, business, dims, showGranoLogo, qr, productId }) {
  if (!productId) return null
  const { data: product } = await supabase.from('products').select('*').eq('id', productId).eq('farm_id', business.id).maybeSingle()
  if (!product) return null
  const story = await computeProductStory(supabase, product)
  if (!story) return null
  return <ProductStoryCard business={business} dims={dims} showGranoLogo={showGranoLogo} qr={qr} story={story} />
}
