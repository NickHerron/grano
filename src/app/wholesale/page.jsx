import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import WholesaleMarketplace from '@/components/WholesaleMarketplace'

export const metadata = {
  title: "Wholesale Marketplace | Grano",
  description: "Browse wholesale product listings from Chicago-area producers — price, minimum order, case size, and lead time up front.",
}

export default async function WholesalePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: products } = await supabase
    .from('products')
    .select('*, farm:farms(name, slug, location, producer_type, verification_status, logo_url)')
    .not('wholesale_price', 'is', null)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-8 pb-20">
      <div className="mb-8">
        <h1 className="font-serif text-[32px] sm:text-[40px] font-semibold tracking-tight text-soil mb-2">
          Wholesale <em className="italic text-rust">Marketplace</em>
        </h1>
        <p className="text-[15px] text-stone mb-3">
          {products?.length ? `${products.length} wholesale listing${products.length === 1 ? '' : 's'} from Chicago-area producers.` : 'No wholesale listings yet.'}
        </p>
        <Link href="/sourcing-requests" className="text-[13px] font-semibold text-rust hover:underline">See what local businesses are looking for →</Link>
      </div>
      <WholesaleMarketplace products={products || []} signedIn={Boolean(user)} />
    </div>
  )
}
