'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { linkMarketLocations } from './marketBackfillActions'

export default function MarketBackfillRow({ name, locationIds, farmNames, organizations }) {
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleLink() {
    setSaving(true)
    setError('')
    const result = await linkMarketLocations(locationIds, organizationId)
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setDone(true)
    router.refresh()
  }

  if (done) return null // revalidatePath will drop this row on next fetch; hide immediately so it doesn't sit there stale

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[#F0EDE7] last:border-0">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-soil truncate">{name}</div>
        <div className="text-[11px] text-stone truncate">{locationIds.length} location{locationIds.length === 1 ? '' : 's'} · {farmNames.join(', ')}</div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <select value={organizationId} onChange={e => setOrganizationId(e.target.value)}
          className="text-[12px] bg-linen border border-transparent rounded-lg px-2.5 py-1.5 outline-none focus:border-wheat">
          <option value="">Link to…</option>
          {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <button onClick={handleLink} disabled={saving || !organizationId}
          className="text-[12px] font-semibold text-white bg-rust px-3 py-1.5 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-50">
          {saving ? 'Linking…' : 'Link All'}
        </button>
        {error && <span className="text-[11px] text-rust">{error}</span>}
      </div>
    </div>
  )
}
