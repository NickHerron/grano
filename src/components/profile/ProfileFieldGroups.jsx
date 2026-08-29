// Extracted from ProfileForm.jsx, verbatim — same markup, same classes, same
// behavior. Exists so both the flat dashboard profile form and the onboarding
// wizard's Basics/Short Intro/Story steps render the exact same fields instead of
// two copies that can drift apart. Each fragment takes the shared `{ form, update }`
// pair from useState(initialFarmForm(farm)) (see src/lib/farmProfileForm.js) plus
// whatever extra handler its own field needs (e.g. the secondary-types toggle).
'use client'
import { useState } from 'react'
import { PRODUCER_TYPE_GROUPS } from '@/lib/producerOptions'
import { US_STATE_OPTIONS } from '@/lib/geography'
import LocationSearchField from './LocationSearchField'

const inputClass = "bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors w-full"
const labelClass = "text-[12px] font-semibold tracking-wide uppercase text-stone"

export function IdentityFields({ form, update, toggleSecondaryType }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Business / farm name</label>
          <input className={inputClass} value={form.name} onChange={e => update('name', e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Producer type (primary)</label>
          <select className={inputClass} value={form.producer_type} onChange={e => update('producer_type', e.target.value)}>
            <option value="">Choose one</option>
            {PRODUCER_TYPE_GROUPS.map(g => (
              <optgroup key={g.group} label={g.group}>
                {g.types.map(t => <option key={t} value={t}>{t}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Also make or sell (optional)</label>
        <p className="text-[12px] text-stone -mt-0.5 mb-1">Check any other types that describe your business — shown alongside your primary type on your profile, and used to suggest relevant "Work With Us" options.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRODUCER_TYPE_GROUPS.flatMap(g => g.types).filter(t => t !== form.producer_type).map(t => (
            <label key={t} className="flex items-center gap-2 text-[13px] text-soil cursor-pointer bg-linen rounded-lg px-3 py-2.5">
              <input type="checkbox" checked={form.secondary_types.includes(t)} onChange={() => toggleSecondaryType(t)} className="w-4 h-4 accent-rust" />
              {t}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export function LocationFields({ form, update }) {
  // Defaults to search for a brand-new/empty profile (the better UX for someone who
  // hasn't set a location yet); defaults to the plain fields, already filled in, for
  // a profile that already has one — so opening the form never forces an existing
  // Chicago farm to re-search itself.
  const [useSearch, setUseSearch] = useState(!form.city && !form.state)

  function handleGeoSelect({ geographyId, city, state }) {
    update('city', city)
    update('state', state)
    update('city_geography_id', geographyId)
  }

  return (
    <div className="flex flex-col gap-4">
      {useSearch ? (
        <div>
          <label className={labelClass}>City &amp; state</label>
          <LocationSearchField
            initialQuery={form.city && form.state ? `${form.city}, ${form.state}` : ''}
            onSelect={handleGeoSelect}
          />
          <button type="button" onClick={() => setUseSearch(false)} className="text-[11px] text-stone hover:text-soil mt-1.5">Not listed? Enter it manually</button>
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
          <button type="button" onClick={() => setUseSearch(true)} className="text-[11px] font-semibold text-rust hover:underline sm:col-span-2 self-start">← Search instead</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Display location</label>
          <input className={inputClass} value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Logan Square, Chicago" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Neighborhood</label>
          <input className={inputClass} value={form.neighborhood} onChange={e => update('neighborhood', e.target.value)} placeholder="Logan Square" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>County</label>
          <input className={inputClass} value={form.county} onChange={e => update('county', e.target.value)} placeholder="Cook County" />
        </div>
      </div>
      <p className="text-[11px] text-stone -mt-2">"Display location" is how your location appears on your public profile — City/State power local discovery and search.</p>

      <label className="flex items-center gap-2 text-[13px] text-stone cursor-pointer w-fit">
        <input type="checkbox" checked={form.location_hidden} onChange={e => update('location_hidden', e.target.checked)} className="w-4 h-4 accent-rust" />
        Hide exact location from public profile
      </label>
    </div>
  )
}

export function ContactFields({ form, update }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Founded year</label>
          <input type="number" className={inputClass} value={form.founded_year} onChange={e => update('founded_year', e.target.value)} placeholder="2015" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Years operating</label>
          <input type="number" className={inputClass} value={form.years_operating} onChange={e => update('years_operating', e.target.value)} placeholder="10" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Business email</label>
          <input type="email" className={inputClass} value={form.business_email} onChange={e => update('business_email', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Phone (optional)</label>
          <input className={inputClass} value={form.phone} onChange={e => update('phone', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

export function SocialFields({ form, update }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Website</label>
          <input className={inputClass} value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://…" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Instagram</label>
          <input className={inputClass} value={form.instagram} onChange={e => update('instagram', e.target.value)} placeholder="@yourfarm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>TikTok</label>
          <input className={inputClass} value={form.tiktok} onChange={e => update('tiktok', e.target.value)} placeholder="@yourfarm" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Facebook</label>
          <input className={inputClass} value={form.facebook} onChange={e => update('facebook', e.target.value)} placeholder="https://facebook.com/…" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>X</label>
          <input className={inputClass} value={form.x} onChange={e => update('x', e.target.value)} placeholder="@yourfarm" />
        </div>
      </div>
    </div>
  )
}

// placeholder is optional — the onboarding wizard's Intro step passes a category-
// specific example (see src/lib/onboardingEmphasis.js); the flat dashboard form
// keeps the generic default.
export function ShortIntroField({ form, update, placeholder = 'A one or two sentence introduction to who you are.' }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass}>Short intro (shown large at the top of your story)</label>
      <textarea className={inputClass + ' resize-none h-20'} value={form.bio} onChange={e => update('bio', e.target.value)}
        placeholder={placeholder} />
    </div>
  )
}

export function StoryField({ form, update }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass}>Your full story</label>
      <textarea className={inputClass + ' resize-none h-56'} value={form.story} onChange={e => update('story', e.target.value)}
        placeholder="Tell us about your business, how you got started, what makes it different, why you grow or make what you make, what local food means to you, and who's behind it." />
    </div>
  )
}
