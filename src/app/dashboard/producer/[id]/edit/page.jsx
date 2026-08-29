import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductForm from '../../ProductForm'
import SourcedFromEditor from '@/components/SourcedFromEditor'

export default async function EditProductPage({ params }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: farm } = await supabase.from('farms').select('id, name').eq('owner_id', user.id).single()
  const { data: product } = await supabase.from('products').select('*').eq('id', params.id).single()

  if (!product) notFound()

  return (
    <div>
      <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">Edit product</h1>
      <p className="text-[14px] text-stone mb-8">{product.name}</p>
      <div className="flex flex-col gap-6 max-w-[640px]">
        <ProductForm farmId={farm.id} product={product} />
        <SourcedFromEditor productId={product.id} farmId={farm.id} farmName={farm.name} />
      </div>
    </div>
  )
}
