'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RESTAURANT_TYPES, RESTAURANT_BUSINESS_TYPES } from '@/lib/restaurantOptions'
import { US_STATE_OPTIONS } from '@/lib/geography'
import ImageUploadField from '../../producer/profile/ImageUploadField'
import RolesEditor from '@/components/profile/RolesEditor'
import CommunityMemberships from '@/components/profile/CommunityMemberships'
import LocationSearchField from '@/components/profile/LocationSearchField'

const inputClass = "bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors w-full"
const labelClass = "text-[12px] font-semibold tracking-wide uppercase text-stone"

export default function RestaurantProfileForm({ restaurant, roles = [], memberships = [], availableAreas = [] }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    name: restaurant.name || '',
    legal_name: restaurant.legal_name || '',
    restaurant_type: restaurant.restaurant_type || '',
    cuisine: restaurant.cuisine || '',
    location: restaurant.location || '',
    neighborhood: restaurant.neighborhood || '',
    address: restaurant.address || '',
    city: restaurant.city || '',
    state: restaurant.state || '',
    city_geography_id: restaurant.city_geography_id || null,
    hours: restaurant.hours || '',
    website: restaurant.website || '',
    instagram: restaurant.instagram || '',
    x: restaurant.x || '',
    chef_name: restaurant.chef_name || '',
    years_operating: restaurant.years_operating || '',
    about: restaurant.about || '',
    business_types: restaurant.business_types || [],
  })
  const [photos, setPhotos] = useState({
    logo_url: restaurant.logo_url,
    cover_photo_url: restaurant.cover_photo_url,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [useLocationSearch, setUseLocationSearch] = useState(!restaurant.city && !restaurant.state)

  function update(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  function handleGeoSelect({ geographyId, city, state }) {
    update('city', city)
    update('state', state)
    update('city_geography_id', geographyId)
  }
  function toggleBusinessType(type) {
    setForm(f => ({
      ...f,
      business_types: f.business_types.includes(type)
        ? f.business_types.filter(t => t !== type)
        : [...f.business_types, type],
    }))
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      years_operating: form.years_operating ? parseInt(form.years_operating, 10) : null,
      // Auto-fills the free-text display location from structured city/state when
      // the owner used the new fields instead of the old one.
      location: form.location || (form.city && form.state ? `${form.city}, ${form.state}` : form.location),
    }

    const { error: dbError } = await supabase.from('restaurants').update(payload).eq('id', restaurant.id)
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

      {/* ROLES — saves itself immediately, not part of this form's save-on-submit flow */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">Roles</h2>
        <p className="text-[13px] text-stone mb-4">What this profile does — separate from the Type field below, but kept in sync with it.</p>
        <RolesEditor businessType="restaurant" businessId={restaurant.id} initialRoles={roles} />
      </section>

      {/* COMMUNITIES — saves itself immediately, same as Roles above */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">Communities</h2>
        <p className="text-[13px] text-stone mb-4">Your home community comes from City/State below. Sell somewhere else too? Join that community as well.</p>
        <CommunityMemberships businessType="restaurant" businessId={restaurant.id}
          home={{ city: restaurant.city, state: restaurant.state }} initialMemberships={memberships} availableAreas={availableAreas} />
      </section>

      {/* PHOTOS */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-4">Photos</h2>
        <div className="flex flex-col gap-5">
          <ImageUploadField farmId={restaurant.id} farmName={restaurant.name} table="restaurants" field="cover_photo_url" currentUrl={photos.cover_photo_url}
            label="Cover photo" shape="banner" onSaved={url => setPhotos(p => ({ ...p, cover_photo_url: url }))} />
          <ImageUploadField farmId={restaurant.id} farmName={restaurant.name} table="restaurants" field="logo_url" currentUrl={photos.logo_url}
            label="Logo" shape="square" onSaved={url => setPhotos(p => ({ ...p, logo_url: url }))} />
        </div>
      </section>

      {/* BASIC INFO */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-4">Basic Information</h2>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Restaurant / business name</label>
              <input className={inputClass} value={form.name} onChange={e => update('name', e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Type</label>
              <select className={inputClass} value={form.restaurant_type} onChange={e => update('restaurant_type', e.target.value)}>
                <option value="">Choose one</option>
                {RESTAURANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Categories</label>
            <p className="text-[12px] text-stone -mt-0.5 mb-1">Check every category that fits your business — shown on your profile, and used to suggest relevant "Work With Us" options.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RESTAURANT_BUSINESS_TYPES.map(t => (
                <label key={t} className="flex items-center gap-2 text-[13px] text-soil cursor-pointer bg-linen rounded-lg px-3 py-2.5">
                  <input type="checkbox" checked={form.business_types.includes(t)} onChange={() => toggleBusinessType(t)} className="w-4 h-4 accent-rust" />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Legal business name (optional)</label>
              <input className={inputClass} value={form.legal_name} onChange={e => update('legal_name', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Cuisine</label>
              <input className={inputClass} value={form.cuisine} onChange={e => update('cuisine', e.target.value)} placeholder="Modern American, Italian…" />
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
              <input className={inputClass} value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. West Loop, Chicago" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Neighborhood</label>
              <input className={inputClass} value={form.neighborhood} onChange={e => update('neighborhood', e.target.value)} placeholder="West Loop" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Address (optional)</label>
            <input className={inputClass} value={form.address} onChange={e => update('address', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Hours</label>
              <input className={inputClass} value={form.hours} onChange={e => update('hours', e.target.value)} placeholder="Tue–Sun, 5pm–10pm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Years operating</label>
              <input type="number" className={inputClass} value={form.years_operating} onChange={e => update('years_operating', e.target.value)} placeholder="5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Website</label>
              <input className={inputClass} value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Instagram</label>
              <input className={inputClass} value={form.instagram} onChange={e => update('instagram', e.target.value)} placeholder="@yourrestaurant" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>X</label>
            <input className={inputClass} value={form.x} onChange={e => update('x', e.target.value)} placeholder="@yourrestaurant" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Chef / owner (optional)</label>
            <input className={inputClass} value={form.chef_name} onChange={e => update('chef_name', e.target.value)} />
          </div>
        </div>
      </section>

      {/* STORY */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">About</h2>
        <p className="text-[13px] text-stone mb-4">Who you are, what you cook, why local sourcing matters to you, and what you're looking for from producers.</p>
        <textarea className={inputClass + ' resize-none h-56'} value={form.about} onChange={e => update('about', e.target.value)}
          placeholder="Tell producers and diners about your restaurant." />
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
