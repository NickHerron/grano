import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductsContent from './ProductsContent'

export default async function ProducerProductsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: farm } = await supabase.from('farms').select('*').eq('owner_id', user.id).single()
  if (!farm) redirect('/dashboard')

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('farm_id', farm.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">Products</h1>
        <p className="text-[14px] text-stone">Everything you sell (or plan to) through Grano.</p>
      </div>
      <ProductsContent farm={farm} products={products || []} />
    </div>
  )
}
