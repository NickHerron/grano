'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ORG_TYPE_LABELS } from '@/lib/businessNetwork'
import { US_STATE_OPTIONS } from '@/lib/geography'
import { initialOrganizationForm, organizationUpdatePayload } from '@/lib/organizationProfileForm'
import { DAY_ABBR, SCHEDULE_TYPES } from '@/lib/schedule'
import ImageUploadField from '../producer/profile/ImageUploadField'
import ScheduleCalendar from '../producer/locations/ScheduleCalendar'
import RolesEditor from '@/components/profile/RolesEditor'
import CommunityMemberships from '@/components/profile/CommunityMemberships'
import LocationSearchField from '@/components/profile/LocationSearchField'
import RequestVerificationControl from './RequestVerificationControl'

const inputClass = "bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors w-full"
const labelClass = "text-[12px] font-semibold tracking-wide uppercase text-stone"

export default function OrganizationProfileForm({ organization, roles = [], memberships = [], availableAreas = [] }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState(initialOrganizationForm(organization))
  const [photos, setPhotos] = useState({
    logo_url: organization.logo_url,
    cover_photo_url: organization.cover_photo_url,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [useLocationSearch, setUseLocationSearch] = useState(!organization.city && !organization.state)

  function update(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }
  function handleGeoSelect({ geographyId, city, state }) {
    update('city', city)
    update('state', state)
    update('city_geography_id', geographyId)
  }
  function toggleDay(d) {
    update('schedule_days', form.schedule_days.includes(d) ? form.schedule_days.filter(x => x !== d) : [...form.schedule_days, d].sort())
  }
  function toggleException(dateStr) {
    update('schedule_exceptions', form.schedule_exceptions.includes(dateStr) ? form.schedule_exceptions.filter(d => d !== dateStr) : [...form.schedule_exceptions, dateStr])
  }
  function toggleSpecificDate(dateStr) {
    update('schedule_dates', form.schedule_dates.includes(dateStr) ? form.schedule_dates.filter(d => d !== dateStr) : [...form.schedule_dates, dateStr].sort())
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: dbError } = await supabase.from('organizations').update(organizationUpdatePayload(form)).eq('id', organization.id)
    setSaving(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10 max-w-[720px]">

      {/* VERIFICATION — saves itself immediately, owner can only request/withdraw;
          approval is admin-only and enforced server-side regardless of what this
          control sends (see schema_organizations_verification.sql). */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">Verification</h2>
        <RequestVerificationControl organizationId={organization.id} status={organization.verification_status || 'unverified'} />
      </section>

      {/* ROLES — saves itself immediately, not part of this form's save-on-submit flow */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">Roles</h2>
        <p className="text-[13px] text-stone mb-4">What this organization does — separate from the Type field below, but kept in sync with it.</p>
        <RolesEditor businessType="organization" businessId={organization.id} initialRoles={roles} />
      </section>

      {/* COMMUNITIES — saves itself immediately, same as Roles above */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">Communities</h2>
        <p className="text-[13px] text-stone mb-4">Your home community comes from City/State below. Active somewhere else too? Join that community as well.</p>
        <CommunityMemberships businessType="organization" businessId={organization.id}
          home={{ city: organization.city, state: organization.state }} initialMemberships={memberships} availableAreas={availableAreas} />
      </section>

      {/* PHOTOS */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-4">Photos</h2>
        <div className="flex flex-col gap-5">
          <ImageUploadField farmId={organization.id} farmName={organization.name} table="organizations" field="cover_photo_url" currentUrl={photos.cover_photo_url}
            label="Cover photo" shape="banner" onSaved={url => setPhotos(p => ({ ...p, cover_photo_url: url }))} />
          <ImageUploadField farmId={organization.id} farmName={organization.name} table="organizations" field="logo_url" currentUrl={photos.logo_url}
            label="Logo" shape="square" onSaved={url => setPhotos(p => ({ ...p, logo_url: url }))} />
        </div>
      </section>

      {/* BASIC INFO */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-4">Basic Information</h2>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Name</label>
              <input required className={inputClass} value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Type</label>
              <select className={inputClass} value={form.org_type} onChange={e => update('org_type', e.target.value)}>
                {Object.entries(ORG_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
          </div>

          {useLocationSearch ? (
            <div>
              <label className={labelClass}>City &amp; state</label>
              <LocationSearchField initialQuery={form.city && form.state ? `${form.city}, ${form.state}` : ''} onSelect={handleGeoSelect} />
              <button type="button" onClick={() => setUseLocationSearch(false)} className="text-[11px] text-stone hover:text-soil mt-1.5">Not listed? Enter it manually</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>City</label>
                <input className={inputClass} value={form.city || ''} onChange={e => update('city', e.target.value)} placeholder="Chicago" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>State</label>
                <select className={inputClass} value={form.state || ''} onChange={e => update('state', e.target.value)}>
                  <option value="">Choose one</option>
                  {US_STATE_OPTIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                </select>
              </div>
              <button type="button" onClick={() => setUseLocationSearch(true)} className="text-[11px] font-semibold text-rust hover:underline sm:col-span-2 self-start">← Search instead</button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Display location</label>
              <input className={inputClass} value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Logan Square, Chicago" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Neighborhood</label>
              <input className={inputClass} value={form.neighborhood} onChange={e => update('neighborhood', e.target.value)} placeholder="Logan Square" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Address (optional)</label>
            <input className={inputClass} value={form.address} onChange={e => update('address', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Website (optional)</label>
            <input className={inputClass} value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://…" />
          </div>
        </div>
      </section>

      {/* SCHEDULE */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">When</h2>
        <p className="text-[13px] text-stone mb-4">When this organization is open or active — shown on its public profile and used to compute upcoming dates.</p>
        <div className="bg-linen rounded-lg p-4 flex flex-col gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-stone block mb-1">Hours</label>
              <input className={inputClass + ' bg-white'} value={form.hours} onChange={e => update('hours', e.target.value)} placeholder="9am – 1pm" />
            </div>
          </div>

          {(form.schedule_type === 'weekly' || form.schedule_type === 'biweekly') && (
            <div>
              <div className="text-[11px] font-semibold text-stone uppercase tracking-wide mb-1">Season (optional)</div>
              <p className="text-[11px] text-stone -mt-0.5 mb-1.5">A weekly/biweekly schedule runs forever by default — set these if this has a real start and end date, like a seasonal farmers market.</p>
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
        </div>
      </section>

      {/* ABOUT */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">About</h2>
        <p className="text-[13px] text-stone mb-4">What this organization is, who it serves, and why it matters to the local food network.</p>
        <textarea className={inputClass + ' resize-none h-40'} value={form.description} onChange={e => update('description', e.target.value)}
          placeholder="Tell people about this organization." />
      </section>

      {error && <p className="text-[13px] text-rust">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="bg-rust text-white text-[15px] font-bold px-6 py-3.5 rounded-xl hover:bg-[#A8521F] transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : 'Save profile'}
        </button>
        {saved && <span className="text-[13px] font-semibold text-sage">Saved.</span>}
      </div>
    </form>
  )
}
