'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Two independent capability flags — "we sell wholesale" and "we buy wholesale" —
// deliberately separate from business type (see schema_wholesale_capabilities.sql).
// Saves immediately per toggle, same pattern as WorkOptionsManager, so this can be
// mounted from both the producer onboarding wizard's Wholesale step and the
// restaurant dashboard's Wholesale settings tab without either one owning a bigger
// save flow. Written directly to farms/restaurants (not business_work_options) since
// these describe the business itself, not an inbound-inquiry channel.
export default function WholesaleSettingsPanel({ businessType, businessId, sellsWholesale, buysWholesale, onChange }) {
  const router = useRouter()
  const supabase = createClient()
  const [sells, setSells] = useState(Boolean(sellsWholesale))
  const [buys, setBuys] = useState(Boolean(buysWholesale))
  const [savingKey, setSavingKey] = useState(null)

  const table = businessType === 'farm' ? 'farms' : 'restaurants'

  async function toggle(key, value) {
    setSavingKey(key)
    if (key === 'sells_wholesale') setSells(value)
    else setBuys(value)
    await supabase.from(table).update({ [key]: value }).eq('id', businessId)
    setSavingKey(null)
    router.refresh()
    onChange?.({
      sells_wholesale: key === 'sells_wholesale' ? value : sells,
      buys_wholesale: key === 'buys_wholesale' ? value : buys,
    })
  }

  return (
    <div>
      <p className="text-[13px] text-stone mb-4">
        Wholesale isn't limited to any one kind of business — farms, bakeries, coffee businesses, retailers, restaurants, and other businesses can buy from and sell to one another on Grano. Check whatever applies; you can change these anytime.
      </p>
      <div className="flex flex-col gap-2.5">
        <label className={`flex items-start gap-3 cursor-pointer rounded-xl border-[1.5px] transition-colors p-4 ${
          sells ? 'bg-[#FDF0E8] border-rust' : 'bg-linen border-transparent'
        }`}>
          <input type="checkbox" checked={sells} disabled={savingKey === 'sells_wholesale'}
            onChange={e => toggle('sells_wholesale', e.target.checked)} className="w-4 h-4 accent-rust mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[14px] font-semibold text-soil">We sell wholesale</div>
            <div className="text-[12px] text-stone">Other businesses can buy from you — shows a Wholesale Inquiry option on your public profile.</div>
          </div>
        </label>
        <label className={`flex items-start gap-3 cursor-pointer rounded-xl border-[1.5px] transition-colors p-4 ${
          buys ? 'bg-[#FDF0E8] border-rust' : 'bg-linen border-transparent'
        }`}>
          <input type="checkbox" checked={buys} disabled={savingKey === 'buys_wholesale'}
            onChange={e => toggle('buys_wholesale', e.target.checked)} className="w-4 h-4 accent-rust mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[14px] font-semibold text-soil">We buy wholesale</div>
            <div className="text-[12px] text-stone">Other businesses can pitch you as a supplier — shows a Supplier Inquiry option on your public profile.</div>
          </div>
        </label>
      </div>
    </div>
  )
}
