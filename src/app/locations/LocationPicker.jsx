'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setLocationCookie } from './actions'

// "Choose Your Location" — a plain city/state override, stored in a cookie
// resolveLocation() checks before Vercel's geo headers. Lists real areas (from
// getActiveAreas()) as one-click picks, plus a manual fallback for anywhere else.
export default function LocationPicker({ areas = [] }) {
  const router = useRouter()
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [saving, setSaving] = useState(false)

  async function choose(chosenState, chosenCity) {
    setSaving(true)
    await setLocationCookie(chosenState, chosenCity)
    setSaving(false)
    router.refresh()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!city.trim() || state.trim().length !== 2) return
    await choose(state.trim().toUpperCase(), city.trim())
  }

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl p-5 flex flex-col gap-4 max-w-[480px]">
      <div className="text-[14px] font-semibold text-soil">Choose Your Location</div>

      {areas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {areas.slice(0, 8).map(a => (
            <button key={`${a.state}-${a.citySlug}`} type="button" disabled={saving} onClick={() => choose(a.state, a.city)}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-linen text-soil hover:bg-[#E4E0D5] transition-colors disabled:opacity-60">
              {a.city}, {a.state}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-wrap">
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" required
          className="text-[13px] bg-linen border border-transparent rounded-lg px-3 py-2 outline-none focus:border-wheat" />
        <input value={state} onChange={e => setState(e.target.value)} placeholder="ST" maxLength={2} required
          className="text-[13px] bg-linen border border-transparent rounded-lg px-3 py-2 outline-none focus:border-wheat w-16" />
        <button type="submit" disabled={saving}
          className="text-[12px] font-semibold text-white bg-rust px-4 py-2 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : 'Set Location'}
        </button>
      </form>
    </div>
  )
}
