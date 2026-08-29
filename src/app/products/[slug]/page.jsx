import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RealProductProfile from '@/components/RealProductProfile'
import { getLiveMarketplaceEnabled } from '@/lib/marketplace'
import { hydrateProductSources } from '@/lib/productSources'

async function getProduct(slug) {
  const supabase = createClient()
  const { data: product } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle()
  return product
}

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug)
  if (!product) return { title: "Product not found | Grano" }
  return {
    title: `${product.name} | Grano`,
    description: product.description || `${product.name} — available on Grano, Chicago's local food network.`,
    openGraph: { images: product.image_url ? [product.image_url] : [] },
  }
}

export default async function ProductPage({ params }) {
  const supabase = createClient()
  const product = await getProduct(params.slug)

  if (!product) {
    return (
      <div className="max-w-[600px] mx-auto px-8 py-24 text-center">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-2">Product not found</h1>
        <p className="text-[14px] text-stone mb-6">This listing doesn't exist or has been removed.</p>
        <Link href="/" className="inline-block bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">
          Back to the market →
        </Link>
      </div>
    )
  }

  const [{ data: farm }, liveMarketplaceEnabled, { count: locationCount }, { data: sourceRows }] = await Promise.all([
    supabase.from('farms').select('*').eq('id', product.farm_id).single(),
    getLiveMarketplaceEnabled(),
    supabase.from('farm_locations').select('id', { count: 'exact', head: true }).eq('farm_id', product.farm_id),
    supabase.from('product_sources').select('*').eq('product_id', product.id).order('sort_order', { ascending: true }),
  ])
  const sources = await hydrateProductSources(supabase, sourceRows || [])

  // best-effort view counter, not critical if it fails
  supabase.from('products').update({ view_count: (product.view_count || 0) + 1 }).eq('id', product.id).then(() => {})

  return (
    <RealProductProfile
      product={product}
      farm={farm}
      liveMarketplaceEnabled={liveMarketplaceEnabled}
      hasFindUsLocations={Boolean(locationCount)}
      sources={sources}
    />
  )
}
