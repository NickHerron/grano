'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addAreaMembership, removeAreaMembership } from '@/app/dashboard/profiles/communityActions'

const chipClass = "text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors"

// Home city/state (schema_geography.sql) says where a profile is based. This is
// everything ELSE it's chosen to join — e.g. a Waukegan-based producer who actually
// sells in Chicago can add itself to the Chicago community without its profile
// claiming to be based there. Saves itself immediately (server actions), same
// self-contained pattern as RolesEditor.
export default function CommunityMemberships({ businessType, businessId, home, initialMemberships, availableAreas }) {
  const router = useRouter()
  const [memberships, setMemberships] = useState(initialMemberships)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const homeKey = home ? `${home.state}|${home.city}` : null
  const joinedKeys = new Set(memberships.map(m => `${m.state}|${m.city}`))
  const joinable = availableAreas.filter(a => {
    const key = `${a.state}|${a.city}`
    return key !== homeKey && !joinedKeys.has(key)
  })

  async function handleAdd(area) {
    setSaving(true); setError('')
    const result = await addAreaMembership(businessType, businessId, area.state, area.city)
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setMemberships(m => [...m, result.membership])
    setAdding(false)
    router.refresh()
  }

  async function handleRemove(id) {
    setSaving(true); setError('')
    const result = await removeAreaMembership(id)
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setMemberships(m => m.filter(x => x.id !== id))
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      {home?.city && (
        <p className="text-[12px] text-stone">Home community: <span className="font-semibold text-soil">{home.city}, {home.state}</span></p>
      )}

      {memberships.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {memberships.map(m => (
            <span key={m.id} className={`${chipClass} bg-linen text-soil flex items-center gap-2`}>
              {m.city}, {m.state}
              <button type="button" onClick={() => handleRemove(m.id)} disabled={saving} className="text-[#C0A090] hover:text-rust disabled:opacity-60">×</button>
            </span>
          ))}
        </div>
      )}

      {adding ? (
        <div className="flex flex-col gap-2">
          {joinable.length ? (
            <div className="flex flex-wrap gap-2">
              {joinable.map(a => (
                <button key={`${a.state}-${a.city}`} type="button" onClick={() => handleAdd(a)} disabled={saving}
                  className={`${chipClass} bg-white border border-[#ECEAE4] text-soil hover:border-rust disabled:opacity-60`}>
                  + {a.city}, {a.state}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-stone">No other communities to join yet — check back as Grano grows.</p>
          )}
          <button type="button" onClick={() => setAdding(false)} className="self-start text-[12px] text-stone hover:text-soil">Cancel</button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="self-start text-[12px] font-semibold text-rust hover:underline">
          + Join another community
        </button>
      )}

      {error && <p className="text-[12px] text-rust">{error}</p>}
    </div>
  )
}
