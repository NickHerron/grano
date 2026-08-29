'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VERIFICATION_LABELS } from '@/lib/producerOptions'
import { ORG_VERIFICATION_LABELS } from '@/lib/businessNetwork'

const RESTAURANT_LABELS = { unverified: 'Unverified', verified: 'Verified Restaurant' }
// A map, not a binary ternary — the exact anti-pattern businessNetwork.js's own
// comments warn against. table === 'restaurants' ? RESTAURANT_LABELS : VERIFICATION_LABELS
// silently fell into the farm-shaped branch for table="organizations" (offering
// "Profile Complete"/"Verified Producer" for a market), since VERIFICATION_LABELS has
// a third 'profile_complete' state organizations don't have at all.
const LABELS_BY_TABLE = { farms: VERIFICATION_LABELS, restaurants: RESTAURANT_LABELS, organizations: ORG_VERIFICATION_LABELS }

export default function VerificationSelect({ farmId, status, table = 'farms' }) {
  const labels = LABELS_BY_TABLE[table] || VERIFICATION_LABELS
  const router = useRouter()
  const supabase = createClient()
  const [value, setValue] = useState(status)
  const [saving, setSaving] = useState(false)

  async function handleChange(e) {
    const next = e.target.value
    setValue(next)
    setSaving(true)
    await supabase.from(table).update({ verification_status: next }).eq('id', farmId)
    setSaving(false)
    router.refresh()
  }

  return (
    <select value={value} onChange={handleChange} disabled={saving}
      className="text-[12px] font-semibold bg-linen border border-transparent rounded-md px-2.5 py-1.5 outline-none focus:border-wheat disabled:opacity-50">
      {Object.entries(labels).map(([k, label]) => (
        <option key={k} value={k}>{label}</option>
      ))}
    </select>
  )
}
