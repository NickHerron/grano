import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/formatDate'

export default async function OrderConfirmationPage({ params }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase.from('orders').select('*').eq('id', params.id).maybeSingle()
  if (!order || order.buyer_id !== user.id) notFound()

  const { data: items } = await supabase
    .from('order_items')
    .select('*, farm:farms(name, slug)')
    .eq('order_id', order.id)

  const farmGroups = (items || []).reduce((acc, i) => {
    const key = i.farm?.name || 'Unknown farm'
    acc[key] = acc[key] || { slug: i.farm?.slug, items: [] }
    acc[key].items.push(i)
    return acc
  }, {})

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-8 py-14 sm:py-20">
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-full bg-sage text-white flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
        <h1 className="font-serif text-[28px] sm:text-[34px] font-semibold text-soil mb-2">Order placed</h1>
        <p className="text-[14px] text-stone">Placed {formatDate(order.created_at)} · No payment was collected.</p>
      </div>

      <div className="bg-white border border-[#ECEAE4] rounded-xl p-6 mb-6">
        {Object.entries(farmGroups).map(([farmName, group]) => (
          <div key={farmName} className="mb-5 last:mb-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-rust uppercase tracking-widest mb-2">
              {group.slug ? <Link href={`/producers/${group.slug}`} className="hover:underline">{farmName}</Link> : farmName}
            </div>
            {group.items.map(i => (
              <div key={i.id} className="flex justify-between text-[14px] text-soil mb-1.5">
                <span>{i.product_name} × {i.quantity}</span>
                <span>${(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ))}
        <div className="border-t border-[#ECEAE4] pt-4 mt-2 flex flex-col gap-1.5">
          <div className="flex justify-between text-[13px] text-stone"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-[13px] text-stone"><span>Delivery fee</span><span>${order.delivery_fee.toFixed(2)}</span></div>
          <div className="flex justify-between text-[13px] text-stone"><span>Grano service fee</span><span>${order.service_fee.toFixed(2)}</span></div>
          <div className="flex justify-between text-[16px] font-bold text-soil pt-1"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="bg-linen rounded-xl p-4 text-[13px] text-stone text-center mb-6">
        Once a producer confirms your order, you'll be able to leave them a verified review from their profile.
      </div>

      <div className="text-center">
        <Link href="/" className="inline-block bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">
          ← Back to Market
        </Link>
      </div>
    </div>
  )
}
