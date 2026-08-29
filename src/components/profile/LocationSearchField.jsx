'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { lsadLabel } from '@/lib/geography'

const inputClass = "bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors w-full"

// Real-place autocomplete over the ~32,285 US places seeded in the National
// Geographic Foundation plan. Structurally cloned from BusinessSearchField.jsx (same
// direct-to-Supabase client query, no server action — RLS on geographies is public
// read), debounced since this fires against a much bigger table than
// BusinessSearchField's few dozen rows. On select, calls onSelect({ geographyId,
// city, state }) — the caller writes both the new FK and the existing city/state text
// fields, so every current read path keeps working unchanged.
export default function LocationSearchField({ onSelect, initialQuery = '', placeholder = 'City or town…' }) {
  const supabase = createClient()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef(null)

  function handleChange(q) {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(() => runSearch(q), 200)
  }

  async function runSearch(q) {
    const term = q.trim().toLowerCase()
    // Prefix match first (hits the normalized_name index) — if that's thin, widen to
    // a contains match so "york" still finds "New York".
    const { data: prefixMatches } = await supabase.from('geographies')
      .select('id, name, slug, state_code, lsad, population, funcstat')
      .eq('type', 'place').ilike('normalized_name', `${term}%`)
      .order('funcstat', { ascending: true }).order('population', { ascending: false, nullsFirst: false })
      .limit(8)
    let combined = prefixMatches || []
    if (combined.length < 8) {
      const { data: containsMatches } = await supabase.from('geographies')
        .select('id, name, slug, state_code, lsad, population, funcstat')
        .eq('type', 'place').ilike('normalized_name', `%${term}%`)
        .order('funcstat', { ascending: true }).order('population', { ascending: false, nullsFirst: false })
        .limit(8)
      const seen = new Set(combined.map(r => r.id))
      combined = [...combined, ...(containsMatches || []).filter(r => !seen.has(r.id))]
    }
    setSearching(false)
    setResults(combined.slice(0, 8))
  }

  function handleSelect(place) {
    const cleanName = place.name.replace(/\s+(city|town|village|CDP|borough)$/i, '')
    setQuery(`${cleanName}, ${place.state_code}`)
    setResults([])
    onSelect({ geographyId: place.id, city: cleanName, state: place.state_code })
  }

  return (
    <div>
      <input value={query} onChange={e => handleChange(e.target.value)} placeholder={placeholder} className={inputClass} />
      {searching && <p className="text-[12px] text-stone mt-1.5">Searching…</p>}
      {!searching && results.length > 0 && (
        <div className="flex flex-col gap-1 mt-1.5 max-h-64 overflow-y-auto">
          {results.map(r => (
            <button key={r.id} type="button" onClick={() => handleSelect(r)}
              className="text-left bg-linen hover:bg-[#E4E0D5] transition-colors rounded-lg px-3 py-2">
              <div className="text-[13px] font-semibold text-soil">{r.name.replace(/\s+(city|town|village|CDP|borough)$/i, '')}, {r.state_code}</div>
              <div className="text-[11px] text-stone">{lsadLabel(r.lsad)}</div>
            </button>
          ))}
        </div>
      )}
      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-[12px] text-stone mt-1.5">No matches — try a different spelling, or enter it manually below.</p>
      )}
    </div>
  )
}
