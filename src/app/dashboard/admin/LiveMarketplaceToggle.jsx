'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LiveMarketplaceToggle({ enabled }) {
  const router = useRouter()
  const supabase = createClient()
  const [value, setValue] = useState(enabled)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    const next = !value
    setValue(next)
    setSaving(true)
    await supabase.from('site_settings').update({ live_marketplace_enabled: next, updated_at: new Date().toISOString() }).eq('id', true)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl p-6 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <div className="text-[15px] font-semibold text-soil mb-1">Live Marketplace</div>
        <p className="text-[13px] text-stone max-w-[480px]">
          Master switch for Add to Cart / checkout sitewide. Off overrides every producer's own "Sell on Grano" toggle —
          products still show, but each displays "Not sold on Grano yet" and nobody can place an order until you turn this back on.
        </p>
      </div>
      <button onClick={toggle} disabled={saving}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-[1.5px] transition-all flex-shrink-0 disabled:opacity-60 ${
          value ? 'bg-[#EBF3EC] border-sage' : 'bg-linen border-transparent'
        }`}>
        <span className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${value ? 'bg-sage' : 'bg-[#D9D2C5]'}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${value ? 'left-[18px]' : 'left-0.5'}`} />
        </span>
        <span className={`text-[14px] font-semibold whitespace-nowrap ${value ? 'text-sage' : 'text-stone'}`}>
          {value ? 'Marketplace Live' : 'Marketplace Paused'}
        </span>
      </button>
    </div>
  )
}
