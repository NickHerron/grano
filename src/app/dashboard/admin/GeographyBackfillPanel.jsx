'use client'
import { useState } from 'react'
import { dryRunGeographyBackfill, applyGeographyBackfill, dryRunGeographyLinkBackfill, applyGeographyLinkBackfill } from './geographyBackfillActions'

const TABLE_LABELS = { farms: 'Farms', restaurants: 'Restaurants', organizations: 'Organizations', profiles: 'Personal Profiles' }

export default function GeographyBackfillPanel() {
  return (
    <div className="flex flex-col gap-4">
      <CityStateBackfillPanel />
      <GeographyLinkBackfillPanel />
    </div>
  )
}

function CityStateBackfillPanel() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(null)
  const [error, setError] = useState('')

  async function handleDryRun() {
    setLoading(true); setError(''); setApplied(null)
    const result = await dryRunGeographyBackfill()
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setResults(result.results)
  }

  async function handleApply() {
    setApplying(true); setError('')
    const result = await applyGeographyBackfill()
    setApplying(false)
    if (result.error) { setError(result.error); return }
    setApplied(result.summary)
    setResults(null)
  }

  const totalConfident = results ? Object.values(results).reduce((sum, r) => sum + r.confident.length, 0) : 0

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl p-5 flex flex-col gap-4">
      <div>
        <div className="text-[14px] font-semibold text-soil mb-1">Geography Backfill</div>
        <p className="text-[12px] text-stone">Parses existing "City, ST"-shaped location text into structured city/state. Never guesses — ambiguous rows are left for the owner to fill in.</p>
      </div>
      <button onClick={handleDryRun} disabled={loading}
        className="self-start text-[12px] font-semibold text-white bg-rust px-4 py-2 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-60">
        {loading ? 'Checking…' : 'Run Dry Run'}
      </button>

      {results && (
        <div className="flex flex-col gap-3">
          {Object.entries(results).map(([table, r]) => (
            <div key={table} className="bg-linen rounded-lg p-3">
              <div className="text-[12px] font-semibold text-soil mb-1">{TABLE_LABELS[table]}</div>
              <div className="text-[11px] text-stone mb-1">{r.confident.length} would be set · {r.unparseable.length} left unparsed (of {r.totalConsidered} with no city set)</div>
              {r.confident.length > 0 && (
                <div className="text-[11px] text-stone flex flex-col gap-0.5">
                  {r.confident.slice(0, 5).map(c => (
                    <div key={c.id}>{c.label}: "{c.location}" → {c.city}, {c.state}</div>
                  ))}
                  {r.confident.length > 5 && <div>…and {r.confident.length - 5} more</div>}
                </div>
              )}
            </div>
          ))}
          <button onClick={handleApply} disabled={applying || totalConfident === 0}
            className="self-start text-[12px] font-semibold text-white bg-sage px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            {applying ? 'Applying…' : `Apply — set city/state on ${totalConfident} row${totalConfident === 1 ? '' : 's'}`}
          </button>
        </div>
      )}

      {applied && (
        <div className="text-[12px] font-semibold text-sage">
          Applied: {Object.entries(applied).map(([t, n]) => `${TABLE_LABELS[t]} ${n}`).join(' · ')}
        </div>
      )}

      {error && <p className="text-[12px] text-rust">{error}</p>}
    </div>
  )
}

// Phase 7 of the National Geographic Foundation plan — links each row's existing
// city/state text to a real Census place (from the Phase 3 seed). Separate card, same
// dry-run/apply shape as the panel above, reusing it rather than complicating one
// component with two independent modes.
function GeographyLinkBackfillPanel() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(null)
  const [error, setError] = useState('')

  async function handleDryRun() {
    setLoading(true); setError(''); setApplied(null)
    const result = await dryRunGeographyLinkBackfill()
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setResults(result.results)
  }

  async function handleApply() {
    setApplying(true); setError('')
    const result = await applyGeographyLinkBackfill()
    setApplying(false)
    if (result.error) { setError(result.error); return }
    setApplied(result.summary)
    setResults(null)
  }

  const totalConfident = results ? Object.values(results).reduce((sum, r) => sum + r.confident.length, 0) : 0

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl p-5 flex flex-col gap-4">
      <div>
        <div className="text-[14px] font-semibold text-soil mb-1">Link to Real Places</div>
        <p className="text-[12px] text-stone">Matches existing city/state text against real Census places. Ambiguous matches (two same-named places in one state) are left for a human — never guessed.</p>
      </div>
      <button onClick={handleDryRun} disabled={loading}
        className="self-start text-[12px] font-semibold text-white bg-rust px-4 py-2 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-60">
        {loading ? 'Checking…' : 'Run Dry Run'}
      </button>

      {results && (
        <div className="flex flex-col gap-3">
          {Object.entries(results).map(([table, r]) => (
            <div key={table} className="bg-linen rounded-lg p-3">
              <div className="text-[12px] font-semibold text-soil mb-1">{TABLE_LABELS[table]}</div>
              <div className="text-[11px] text-stone mb-1">{r.confident.length} would be linked · {r.unmatched.length} unmatched (of {r.totalConsidered} with city/state but no link yet)</div>
              {r.confident.length > 0 && (
                <div className="text-[11px] text-stone flex flex-col gap-0.5">
                  {r.confident.slice(0, 5).map(c => (
                    <div key={c.id}>{c.label}: {c.city}, {c.state} → {c.geographyName}</div>
                  ))}
                  {r.confident.length > 5 && <div>…and {r.confident.length - 5} more</div>}
                </div>
              )}
            </div>
          ))}
          <button onClick={handleApply} disabled={applying || totalConfident === 0}
            className="self-start text-[12px] font-semibold text-white bg-sage px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            {applying ? 'Applying…' : `Apply — link ${totalConfident} row${totalConfident === 1 ? '' : 's'}`}
          </button>
        </div>
      )}

      {applied && (
        <div className="text-[12px] font-semibold text-sage">
          Linked: {Object.entries(applied).map(([t, n]) => `${TABLE_LABELS[t]} ${n}`).join(' · ')}
        </div>
      )}

      {error && <p className="text-[12px] text-rust">{error}</p>}
    </div>
  )
}
