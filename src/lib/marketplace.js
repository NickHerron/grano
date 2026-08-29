import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

// Whether Grano's marketplace (Add to Cart / checkout) is live — an admin-controlled
// kill switch that overrides every farm's own "Sell on Grano" toggle while there's no
// payment network wired up yet. cache() dedupes this across the many places a single
// page render might ask for it, so it's one query per request no matter how many
// components need the answer. Defaults to true (today's behavior) if the settings row
// is ever missing, so a missing row can never silently take checkout offline.
export const getLiveMarketplaceEnabled = cache(async () => {
  const supabase = createClient()
  const { data } = await supabase.from('site_settings').select('live_marketplace_enabled').eq('id', true).maybeSingle()
  return data?.live_marketplace_enabled ?? true
})
