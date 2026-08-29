'use client'
import { useState } from 'react'
import { createMarketArea, toggleMarketArea } from './marketAreaActions'

const inputClass = "text-[13px] bg-linen border border-transparent rounded-lg px-3 py-2 outline-none focus:border-wheat focus:bg-white transition-colors"

// A short, deliberately admin-curated list of "areas Grano tracks as a market" — not
// every city with activity, just the ones an admin has decided to track. Toggling
// marketplace_enabled here controls ONLY a discovery page's "Shop Local" presentation
// for that area — the real sitewide checkout gate (site_settings, the Marketplace
// section above) is completely separate and unaffected by anything on this panel.
export default function MarketAreasPanel({ areas }) {
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(null)
  const [error, setError] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true); setError('')
    const formData = new FormData()
    formData.set('city', city)
    formData.set('state', state)
    const result = await createMarketArea(formData)
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setCity(''); setState('')
  }

  async function handleToggle(id, next) {
    setToggling(id); setError('')
    const result = await toggleMarketArea(id, next)
    setToggling(null)
    if (result.error) setError(result.error)
  }

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
      {areas.length ? areas.map(a => (
        <div key={a.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[#F0EDE7] last:border-0">
          <div>
            <div className="text-[13px] font-semibold text-soil">{a.city}, {a.state}</div>
            <div className="text-[11px] text-stone">/locations/{a.state.toLowerCase()}/{a.slug}</div>
          </div>
          <button onClick={() => handleToggle(a.id, !a.marketplace_enabled)} disabled={toggling === a.id}
            className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 ${
              a.marketplace_enabled ? 'bg-sage text-white' : 'bg-linen text-stone'
            }`}>
            {toggling === a.id ? '…' : a.marketplace_enabled ? 'Marketplace On' : 'Marketplace Off'}
          </button>
        </div>
      )) : <div className="px-5 py-6 text-[13px] text-stone">No market areas yet.</div>}

      <form onSubmit={handleCreate} className="flex items-center gap-2 px-5 py-4 flex-wrap">
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" required className={inputClass} />
        <input value={state} onChange={e => setState(e.target.value)} placeholder="ST" maxLength={2} required className={`${inputClass} w-16`} />
        <button type="submit" disabled={saving}
          className="text-[12px] font-semibold text-white bg-rust px-4 py-2 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-60">
          {saving ? 'Adding…' : '+ Add Area'}
        </button>
      </form>
      {error && <p className="text-[12px] text-rust px-5 pb-3">{error}</p>}
    </div>
  )
}
