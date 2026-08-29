'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { hostsVendors } from '@/lib/businessRoles'

// Turns an accepted market<->vendor business_relationships row into a real public
// "Find Us" entry — same farm_locations table and insert shape LocationsManager.jsx
// already uses, just pre-filled from the organization's own profile instead of a
// blank form + manual search. Mirrors AddToFindUsPrompt.jsx's exact shape (an
// accepted thing in one system becoming a farm_locations row), applied to an accepted
// relationship instead of an accepted event inquiry — same reasoning: farm_locations
// RLS is farm-owner-only, so the farm has to be the one performing this insert, not
// something the market or a trigger can do on its behalf.
//
// Fetches the organization's roles/org_type/schedule fields itself on mount, rather
// than widening networkQueries.js's hydrateOtherSides() — that function is shared
// with the public profile's getPublicNetwork(), and this data is dashboard-only.
export default function ListAtMarketPrompt({ farmId, organizationId, alreadyLinked }) {
  const router = useRouter()
  const supabase = createClient()
  const [org, setOrg] = useState(null)
  const [checked, setChecked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      if (alreadyLinked) { setChecked(true); return }
      const [{ data: orgRow }, { data: roleRows }] = await Promise.all([
        supabase.from('organizations').select(
          'id, name, address, org_type, hours, days, schedule_type, schedule_days, schedule_anchor_date, schedule_dates, schedule_exceptions, starts_on, ends_on, seasonal_start, seasonal_end'
        ).eq('id', organizationId).single(),
        supabase.from('business_roles').select('role_key, is_primary').eq('business_type', 'organization').eq('business_id', organizationId),
      ])
      if (cancelled) return
      if (orgRow && hostsVendors(roleRows || [], orgRow.org_type)) setOrg(orgRow)
      setChecked(true)
    }
    check()
    return () => { cancelled = true }
  }, [organizationId, alreadyLinked, supabase])

  async function handleAdd() {
    setSaving(true)
    setError('')
    const { error: insertError } = await supabase.from('farm_locations').insert({
      farm_id: farmId,
      name: org.name,
      location_type: 'farmers_market',
      address: org.address || null,
      organization_id: org.id,
      hours: org.hours || null,
      days: org.days || null,
      schedule_type: org.schedule_type || 'custom',
      schedule_days: org.schedule_days || [],
      schedule_anchor_date: org.schedule_anchor_date || null,
      schedule_dates: org.schedule_dates || [],
      schedule_exceptions: org.schedule_exceptions || [],
      starts_on: org.starts_on || null,
      ends_on: org.ends_on || null,
      seasonal_start: org.seasonal_start || null,
      seasonal_end: org.seasonal_end || null,
    })
    setSaving(false)
    if (insertError) { setError(insertError.message); return }
    setDone(true)
    router.refresh()
  }

  if (!checked || !org) return null

  if (done) {
    return (
      <div className="bg-[#EBF3EC] border border-sage/30 rounded-lg p-3 mt-2">
        <p className="text-[12px] font-semibold text-sage">Added to Where to Find Us.</p>
      </div>
    )
  }

  return (
    <div className="bg-linen rounded-lg p-3 mt-2 flex items-center justify-between gap-3 flex-wrap">
      <p className="text-[12px] text-stone">List yourself as a vendor at {org.name}?</p>
      <button type="button" onClick={handleAdd} disabled={saving}
        className="flex-shrink-0 bg-rust text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-50">
        {saving ? 'Adding…' : 'Add to Find Us'}
      </button>
      {error && <p className="text-[11px] text-rust w-full">{error}</p>}
    </div>
  )
}
