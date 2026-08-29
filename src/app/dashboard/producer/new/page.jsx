import { createClient } from '@/lib/supabase/server'
import ProductForm from '../ProductForm'

export default async function NewProductPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: farm } = await supabase.from('farms').select('id').eq('owner_id', user.id).single()

  return (
    <div>
      <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">Add a product</h1>
      <p className="text-[14px] text-stone mb-8">This will appear on your storefront right away.</p>
      <ProductForm farmId={farm.id} />
    </div>
  )
}
