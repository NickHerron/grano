import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/formatDate'

export default async function OrdersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(id, product_name, price, quantity, farm:farms(name, slug))')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">Your Orders</h1>
        <p className="text-[14px] text-stone">Everything you've ordered through Grano.</p>
      </div>

      {orders?.length ? (
        <div className="flex flex-col gap-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-[#ECEAE4] rounded-xl p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-[13px] font-semibold text-soil">{formatDate(order.created_at)}</span>
                <span className="text-[13px] font-semibold text-soil">${order.total.toFixed(2)}</span>
              </div>
              <div className="flex flex-col gap-1.5 mb-2">
                {(order.order_items || []).map(item => (
                  <div key={item.id} className="flex justify-between text-[13px] text-stone">
                    <span>
                      {item.product_name} × {item.quantity}
                      {item.farm?.slug && (
                        <> — <Link href={`/producers/${item.farm.slug}`} className="text-rust hover:underline">{item.farm.name}</Link></>
                      )}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Link href={`/orders/${order.id}`} className="text-[12px] font-semibold text-rust hover:underline">View order →</Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
          <p className="text-[14px] text-stone mb-4">No orders yet.</p>
          <Link href="/" className="inline-block bg-rust text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">
            Browse the Market →
          </Link>
        </div>
      )}
    </div>
  )
}
