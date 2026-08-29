'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LOCATION_TYPES } from '@/lib/producerOptions'
import { DAY_ABBR, SCHEDULE_TYPES, formatScheduleLine } from '@/lib/schedule'
import ScheduleCalendar from './ScheduleCalendar'

const inputClass = "bg-linen border border-transparent rounded-lg px-3 py-2.5 text-[13px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors w-full"

// Every 30 minutes, 5am–11:30pm — a select instead of free text so "Hours" always
// comes out in a consistent, readable format.
const TIME_OPTIONS = (() => {
  const out = []
  for (let h = 5; h <= 23; h++) {
    for (const m of [0, 30]) {
      const period = h < 12 ? 'AM' : 'PM'
      const displayHour = h % 12 === 0 ? 12 : h % 12
      out.push(`${displayHour}:${m === 0 ? '00' : '30'} ${period}`)
    }
  }
  return out
})()

function parseHours(hours) {
  if (!hours) return { start: '', end: '' }
  const parts = hours.split(/[–-]/).map(s => s.trim())
  if (parts.length === 2 && TIME_OPTIONS.includes(parts[0]) && TIME_OPTIONS.includes(parts[1])) {
    return { start: parts[0], end: parts[1] }
  }
  return { start: '', end: '' }
}

function makeEmpty(defaultLocationType) {
  return {
    name: '', location_type: defaultLocationType || 'farmers_market', address: '', link: '',
    starts_on: '', ends_on: '',
    // Legacy month-based season fields — no longer editable here, but carried through
    // untouched on the payload so editing a location doesn't blow away season info set
    // before starts_on/ends_on existed (see inActiveRange() in schedule.js).
    seasonal_start: '', seasonal_end: '',
    schedule_type: 'weekly', schedule_days: [], schedule_anchor_date: '', schedule_dates: [], schedule_exceptions: [], days: '',
    hoursStart: '', hoursEnd: '', legacyHours: '',
    organization_id: null, organizationName: '',
  }
}

// typeFilter/defaultLocationType are optional — used by the onboarding wizard's Find
// Us and Events steps to present the same manager as two focused views (regular
// locations vs. one-off events, both just farm_locations rows) instead of a second
// component. Omitted entirely by the main dashboard Find Us page, which keeps seeing
// every location type exactly as before.
export default function LocationsManager({ farmId, initialLocations, typeFilter, defaultLocationType, emptyMessage }) {
  const router = useRouter()
  const supabase = createClient()
  const empty = makeEmpty(defaultLocationType)
  const [locations, setLocations] = useState(initialLocations)
  const [form, setForm] = useState(empty)
  const visibleLocations = typeFilter ? locations.filter(l => typeFilter(l.location_type)) : locations
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [orgQuery, setOrgQuery] = useState('')
  const [orgResults, setOrgResults] = useState([])
  const [orgSearching, setOrgSearching] = useState(false)

  function update(key, value) { setForm(f => ({ ...f, [key]: value })) }

  async function searchOrganizations(q) {
    setOrgQuery(q)
    if (q.trim().length < 2) { setOrgResults([]); return }
    setOrgSearching(true)
    const { data } = await supabase.from('organizations').select('id, name, slug, org_type, location').ilike('name', `%${q.trim()}%`).limit(6)
    setOrgSearching(false)
    setOrgResults(data || [])
  }

  function linkOrganization(org) {
    setForm(f => ({ ...f, organization_id: org.id, organizationName: org.name }))
    setOrgQuery('')
    setOrgResults([])
  }

  function unlinkOrganization() {
    setForm(f => ({ ...f, organization_id: null, organizationName: '' }))
  }

  function toggleDay(d) {
    setForm(f => ({
      ...f,
      schedule_days: f.schedule_days.includes(d) ? f.schedule_days.filter(x => x !== d) : [...f.schedule_days, d].sort(),
    }))
  }

  function toggleException(dateStr) {
    setForm(f => ({
      ...f,
      schedule_exceptions: f.schedule_exceptions.includes(dateStr)
        ? f.schedule_exceptions.filter(d => d !== dateStr)
        : [...f.schedule_exceptions, dateStr],
    }))
  }

  function toggleSpecificDate(dateStr) {
    setForm(f => ({
      ...f,
      schedule_dates: f.schedule_dates.includes(dateStr)
        ? f.schedule_dates.filter(d => d !== dateStr)
        : [...f.schedule_dates, dateStr].sort(),
    }))
  }

  function startEdit(loc) {
    const { start, end } = parseHours(loc.hours)
    setForm({
      name: loc.name || '',
      location_type: loc.location_type || 'farmers_market',
      address: loc.address || '',
      link: loc.link || '',
      starts_on: loc.starts_on || '',
      ends_on: loc.ends_on || '',
      seasonal_start: loc.seasonal_start || '',
      seasonal_end: loc.seasonal_end || '',
      schedule_type: loc.schedule_type || 'weekly',
      schedule_days: loc.schedule_days || [],
      schedule_anchor_date: loc.schedule_anchor_date || '',
      schedule_dates: loc.schedule_dates || [],
      schedule_exceptions: loc.schedule_exceptions || [],
      days: loc.days || '',
      hoursStart: start,
      hoursEnd: end,
      organization_id: loc.organization_id || null,
      organizationName: loc.organization?.name || '',
      // If the existing hours text doesn't match our start/end select format (e.g. an
      // older freeform entry), keep it as-is unless the producer actually picks new
      // times — editing something else about the location shouldn't silently blow
      // away hours we can't cleanly parse.
      legacyHours: (!start && !end) ? (loc.hours || '') : '',
    })
    setEditingId(loc.id)
    setError('')
  }

  function cancelEdit() {
    setForm(empty)
    setEditingId(null)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const hours = (form.hoursStart && form.hoursEnd) ? `${form.hoursStart} – ${form.hoursEnd}` : (form.legacyHours || null)

    const payload = {
      farm_id: farmId,
      name: form.name,
      location_type: form.location_type,
      address: form.address || null,
      hours,
      link: form.link || null,
      starts_on: form.starts_on || null,
      ends_on: form.ends_on || null,
      // Carried through unchanged from whatever was already there (see empty{} above)
      // — no UI edits these anymore, but an edit to something else on this location
      // shouldn't erase season info set before starts_on/ends_on existed.
      seasonal_start: form.seasonal_start || null,
      seasonal_end: form.seasonal_end || null,
      schedule_type: form.schedule_type,
      schedule_days: form.schedule_type === 'weekly' || form.schedule_type === 'biweekly' ? form.schedule_days : [],
      schedule_anchor_date: form.schedule_type === 'biweekly' ? (form.schedule_anchor_date || null) : null,
      schedule_dates: form.schedule_type === 'specific_dates' ? form.schedule_dates : [],
      schedule_exceptions: form.schedule_type === 'weekly' || form.schedule_type === 'biweekly' ? form.schedule_exceptions : [],
      days: form.schedule_type === 'custom' ? form.days : null,
      organization_id: form.organization_id || null,
    }

    if (editingId) {
      const { data: row, error: dbError } = await supabase.from('farm_locations').update(payload).eq('id', editingId).select('*, organization:organizations(id, name, slug)').single()
      setSaving(false)
      if (dbError) { setError(dbError.message); return }
      setLocations(locations.map(l => l.id === editingId ? row : l))
      cancelEdit()
    } else {
      const { data: row, error: dbError } = await supabase.from('farm_locations').insert({ ...payload, sort_order: locations.length }).select('*, organization:organizations(id, name, slug)').single()
      setSaving(false)
      if (dbError) { setError(dbError.message); return }
      setLocations([...locations, row])
      setForm(empty)
    }
    router.refresh()
  }

  async function handleDelete(id) {
    setLocations(locations.filter(l => l.id !== id))
    if (editingId === id) cancelEdit()
    await supabase.from('farm_locations').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-white border border-[#ECEAE4] rounded-xl p-5 mb-6 flex flex-col gap-3">
        {editingId && (
          <div className="flex items-center justify-between bg-[#FDF0E8] rounded-lg px-3 py-2">
            <span className="text-[12px] font-semibold text-rust">Editing "{form.name}"</span>
            <button type="button" onClick={cancelEdit} className="text-[12px] text-rust hover:underline">Cancel</button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input required className={inputClass} value={form.name} onChange={e => update('name', e.target.value)} placeholder="Logan Square Farmers Market" />
          <select className={inputClass} value={form.location_type} onChange={e => update('location_type', e.target.value)}>
            {LOCATION_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <input className={inputClass} value={form.address} onChange={e => update('address', e.target.value)} placeholder="Address (optional)" />

        {/* LINK TO A REAL MARKET — optional; connects this location to an organization's
            own public profile (/markets/[slug]) so it can list its real vendors. Doesn't
            change how this location shows up here — purely additive. */}
        <div>
          <label className="text-[11px] text-stone block mb-1">Link to a Grano organization (optional)</label>
          {form.organization_id ? (
            <div className="flex items-center justify-between gap-2 bg-[#EBF3EC] rounded-lg px-3 py-2.5">
              <span className="text-[13px] text-soil">Linked to <strong>{form.organizationName || 'an organization'}</strong></span>
              <button type="button" onClick={unlinkOrganization} className="text-[12px] font-semibold text-rust hover:underline flex-shrink-0">Unlink</button>
            </div>
          ) : (
            <div className="relative">
              <input className={inputClass} value={orgQuery} onChange={e => searchOrganizations(e.target.value)}
                placeholder="Search farmers markets, food hubs…" />
              {orgSearching && <p className="text-[11px] text-stone mt-1">Searching…</p>}
              {orgResults.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1.5">
                  {orgResults.map(o => (
                    <button key={o.id} type="button" onClick={() => linkOrganization(o)}
                      className="text-left bg-linen hover:bg-[#E4E0D5] transition-colors rounded-lg px-3 py-2 w-full">
                      <div className="text-[13px] font-semibold text-soil">{o.name}</div>
                      <div className="text-[11px] text-stone">{[o.location].filter(Boolean).join(' · ')}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SCHEDULE */}
        <div className="bg-linen rounded-lg p-4 flex flex-col gap-3">
          <div className="text-[12px] font-semibold text-soil uppercase tracking-wide">When</div>
          <select className={inputClass + ' bg-white'} value={form.schedule_type} onChange={e => update('schedule_type', e.target.value)}>
            {SCHEDULE_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>

          {(form.schedule_type === 'weekly' || form.schedule_type === 'biweekly') && (
            <div className="flex flex-wrap gap-1.5">
              {DAY_ABBR.map((label, i) => (
                <button key={i} type="button" onClick={() => toggleDay(i)}
                  className={`w-10 h-10 rounded-lg text-[12px] font-semibold transition-colors ${
                    form.schedule_days.includes(i) ? 'bg-rust text-white' : 'bg-white text-stone border border-[#ECEAE4] hover:border-rust'
                  }`}>
                  {label[0]}
                </button>
              ))}
            </div>
          )}

          {form.schedule_type === 'biweekly' && (
            <div>
              <label className="text-[11px] text-stone block mb-1">One date it happens on, so we know which weeks</label>
              <input type="date" className={inputClass + ' bg-white'} value={form.schedule_anchor_date} onChange={e => update('schedule_anchor_date', e.target.value)} />
            </div>
          )}

          {/* Calendar: preview the recurring pattern and toggle off individual
              occurrences (e.g. closed for a holiday) without changing the whole rule. */}
          {(form.schedule_type === 'weekly' || form.schedule_type === 'biweekly') && form.schedule_days.length > 0 && (
            form.schedule_type === 'biweekly' && !form.schedule_anchor_date ? (
              <p className="text-[12px] text-stone">Pick an anchor date above to preview and manage this schedule.</p>
            ) : (
              <ScheduleCalendar
                mode="pattern"
                scheduleType={form.schedule_type}
                scheduleDays={form.schedule_days}
                scheduleAnchorDate={form.schedule_anchor_date}
                exceptions={form.schedule_exceptions}
                onToggle={toggleException}
                startsOn={form.starts_on}
                endsOn={form.ends_on}
                seasonalStart={form.seasonal_start}
                seasonalEnd={form.seasonal_end}
              />
            )
          )}

          {form.schedule_type === 'specific_dates' && (
            <div className="flex flex-col gap-2">
              <ScheduleCalendar mode="dates" dates={form.schedule_dates} onToggle={toggleSpecificDate} />
              {form.schedule_dates.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.schedule_dates.map(d => (
                    <span key={d} className="flex items-center gap-1.5 bg-white border border-[#ECEAE4] rounded-full px-3 py-1 text-[12px] text-soil">
                      {d}
                      <button type="button" onClick={() => toggleSpecificDate(d)} className="text-[#C0A090] hover:text-rust">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {form.schedule_type === 'custom' && (
            <input className={inputClass + ' bg-white'} value={form.days} onChange={e => update('days', e.target.value)} placeholder="Days — e.g. First Saturday of the month" />
          )}

          <div className="grid grid-cols-2 gap-3">
            <select className={inputClass + ' bg-white'} value={form.hoursStart} onChange={e => update('hoursStart', e.target.value)}>
              <option value="">Start time</option>
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className={inputClass + ' bg-white'} value={form.hoursEnd} onChange={e => update('hoursEnd', e.target.value)}>
              <option value="">End time</option>
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {!form.hoursStart && !form.hoursEnd && form.legacyHours && (
            <p className="text-[11px] text-stone">Current hours: {form.legacyHours} — pick start/end times above to replace this.</p>
          )}
        </div>

        {(form.schedule_type === 'weekly' || form.schedule_type === 'biweekly') && (
          <div>
            <div className="text-[11px] font-semibold text-stone uppercase tracking-wide mb-1">Season (optional)</div>
            <p className="text-[11px] text-stone -mt-0.5 mb-1.5">A weekly/biweekly schedule runs forever by default — set these if this market has a real start and end date, like a seasonal farmers market.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone block mb-1">Starting</label>
                <input type="date" className={inputClass} value={form.starts_on} onChange={e => update('starts_on', e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] text-stone block mb-1">Until</label>
                <input type="date" className={inputClass} value={form.ends_on} onChange={e => update('ends_on', e.target.value)} />
              </div>
            </div>
          </div>
        )}
        <input className={inputClass} value={form.link} onChange={e => update('link', e.target.value)} placeholder="Link (optional)" />
        {error && <p className="text-[12px] text-rust">{error}</p>}
        <button type="submit" disabled={saving} className="self-start bg-rust text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : editingId ? 'Save Changes' : '+ Add Location'}
        </button>
      </form>

      {visibleLocations.length ? (
        <div className="flex flex-col gap-3">
          {visibleLocations.map(loc => (
            <div key={loc.id} className="bg-white border border-[#ECEAE4] rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-serif text-[16px] font-semibold text-soil">{loc.name}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-rust bg-[#FDF0E8] px-2 py-0.5 rounded">
                    {LOCATION_TYPES.find(([k]) => k === loc.location_type)?.[1] || loc.location_type}
                  </span>
                </div>
                <div className="text-[12px] text-stone">{[loc.address, formatScheduleLine(loc), loc.hours].filter(Boolean).join(' · ')}</div>
                {loc.organization && (
                  <div className="text-[11px] font-semibold text-sage mt-1">Linked to {loc.organization.name}</div>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button onClick={() => startEdit(loc)} className="text-[11px] font-semibold text-rust hover:underline">Edit</button>
                <button onClick={() => handleDelete(loc.id)} className="text-[11px] text-[#C0A090] hover:text-rust transition-colors">Remove</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
          <p className="text-[14px] text-stone">{emptyMessage || 'No locations yet — add a farmers market, retail store, or pickup spot.'}</p>
        </div>
      )}
    </div>
  )
}
