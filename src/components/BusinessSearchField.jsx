'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ORG_TYPE_LABELS } from '@/lib/businessNetwork'

// The "search Grano businesses by name, pick one" field — extracted out of
// AddBusinessPanel.jsx (Local Network invites) so SourcedFromEditor.jsx (product
// "Sourced From" tagging) can reuse the exact same search instead of a second
// implementation. Behavior-identical to what AddBusinessPanel had inline.
export default function BusinessSearchField({ excludeType, excludeId, onSelect, placeholder = 'Business name…', onInviteClick, onQueryChange }) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  async function runSearch(q) {
    setQuery(q)
    onQueryChange?.(q)
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    const like = `%${q.trim()}%`
    const [{ data: farms }, { data: restaurants }, { data: organizations }] = await Promise.all([
      supabase.from('farms').select('id, slug, name, producer_type, location, logo_url, verification_status').ilike('name', like).limit(6),
      supabase.from('restaurants').select('id, slug, name, restaurant_type, location, logo_url, verification_status').ilike('name', like).limit(6),
      supabase.from('organizations').select('id, slug, name, org_type, location, logo_url, verification_status').ilike('name', like).limit(6),
    ])
    setSearching(false)
    const combined = [
      ...(farms || []).filter(f => !(excludeType === 'farm' && f.id === excludeId)).map(f => ({ ...f, type: 'farm', typeLabel: f.producer_type || 'Producer' })),
      ...(restaurants || []).filter(r => !(excludeType === 'restaurant' && r.id === excludeId)).map(r => ({ ...r, type: 'restaurant', typeLabel: r.restaurant_type || 'Restaurant' })),
      ...(organizations || []).filter(o => !(excludeType === 'organization' && o.id === excludeId)).map(o => ({ ...o, type: 'organization', typeLabel: ORG_TYPE_LABELS[o.org_type] || 'Organization' })),
    ]
    setResults(combined)
  }

  return (
    <div>
      <label className="text-[12px] font-semibold tracking-wide uppercase text-stone block mb-1.5">Search Grano businesses</label>
      <input value={query} onChange={e => runSearch(e.target.value)} autoFocus
        placeholder={placeholder}
        className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors w-full mb-3" />
      {searching && <p className="text-[12px] text-stone">Searching…</p>}
      {results.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {results.map(b => (
            <button key={`${b.type}-${b.id}`} type="button" onClick={() => onSelect(b)}
              className="text-left bg-linen hover:bg-[#E4E0D5] transition-colors rounded-lg px-4 py-3 w-full">
              <div className="text-[13px] font-semibold text-soil">{b.name}</div>
              <div className="text-[11px] text-stone">{[b.typeLabel, b.location].filter(Boolean).join(' · ')}</div>
            </button>
          ))}
        </div>
      )}
      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-[12px] text-stone mb-3">No businesses found.</p>
      )}
      {onInviteClick && !searching && query.trim().length >= 2 && (
        <button type="button" onClick={onInviteClick} className="text-[13px] font-semibold text-rust hover:underline">
          Not on Grano yet? Invite them →
        </button>
      )}
    </div>
  )
}
