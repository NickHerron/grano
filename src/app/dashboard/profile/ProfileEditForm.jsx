'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FOOD_CATEGORIES } from '@/lib/consumerOptions'
import { US_STATE_OPTIONS } from '@/lib/geography'
import ImageUploadField from '@/app/dashboard/producer/profile/ImageUploadField'
import LocationSearchField from '@/components/profile/LocationSearchField'

export default function ProfileEditForm({ profile }) {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [neighborhood, setNeighborhood] = useState(profile.neighborhood || '')
  const [location, setLocation] = useState(profile.location || '')
  const [city, setCity] = useState(profile.city || '')
  const [state, setState] = useState(profile.state || '')
  const [cityGeographyId, setCityGeographyId] = useState(profile.city_geography_id || null)
  const [useLocationSearch, setUseLocationSearch] = useState(!profile.city && !profile.state)
  const [bio, setBio] = useState(profile.bio || '')
  const [website, setWebsite] = useState(profile.website || '')
  const [instagram, setInstagram] = useState(profile.instagram || '')
  const [x, setX] = useState(profile.x || '')
  const [categories, setCategories] = useState(profile.favorite_categories || [])
  const [photoUrl, setPhotoUrl] = useState(profile.profile_photo_url)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function toggleCategory(cat) {
    setCategories(cs => cs.includes(cat) ? cs.filter(c => c !== cat) : [...cs, cat])
    setSaved(false)
  }

  function handleGeoSelect({ geographyId, city: selectedCity, state: selectedState }) {
    setCity(selectedCity)
    setState(selectedState)
    setCityGeographyId(geographyId)
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: dbError } = await supabase.from('profiles').update({
      full_name: fullName,
      neighborhood: neighborhood || null,
      // Auto-fills the free-text display location from structured city/state when
      // the person used the new fields instead of the old one.
      location: location || (city && state ? `${city}, ${state}` : location) || null,
      city: city || null,
      state: state || null,
      city_geography_id: cityGeographyId,
      bio: bio || null,
      website: website || null,
      instagram: instagram || null,
      x: x || null,
      favorite_categories: categories,
    }).eq('id', profile.id)
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-[520px]">
      <ImageUploadField
        table="profiles" farmId={profile.id} farmName={profile.full_name} field="profile_photo_url"
        currentUrl={photoUrl} label="Profile photo" shape="square" onSaved={setPhotoUrl}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Name</label>
        <input value={fullName} onChange={e => { setFullName(e.target.value); setSaved(false) }}
          className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Neighborhood (optional)</label>
        <input value={neighborhood} onChange={e => { setNeighborhood(e.target.value); setSaved(false) }}
          placeholder="Logan Square"
          className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
      </div>

      {useLocationSearch ? (
        <div>
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">City &amp; state (optional)</label>
          <LocationSearchField initialQuery={city && state ? `${city}, ${state}` : ''} onSelect={handleGeoSelect} />
          <button type="button" onClick={() => setUseLocationSearch(false)} className="text-[11px] text-stone hover:text-soil mt-1.5">Not listed? Enter it manually</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">City (optional)</label>
            <input value={city} onChange={e => { setCity(e.target.value); setSaved(false) }}
              placeholder="Chicago"
              className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">State (optional)</label>
            <select value={state} onChange={e => { setState(e.target.value); setSaved(false) }}
              className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors">
              <option value="">Choose one</option>
              {US_STATE_OPTIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => setUseLocationSearch(true)} className="text-[11px] font-semibold text-rust hover:underline sm:col-span-2 self-start">← Search instead</button>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Display location (optional)</label>
        <input value={location} onChange={e => { setLocation(e.target.value); setSaved(false) }}
          placeholder="e.g. Logan Square, Chicago"
          className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Bio (optional)</label>
        <textarea value={bio} onChange={e => { setBio(e.target.value); setSaved(false) }}
          placeholder="A little about you and why local food matters to you."
          className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors resize-none h-24" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Website</label>
          <input value={website} onChange={e => { setWebsite(e.target.value); setSaved(false) }}
            placeholder="https://…"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Instagram</label>
          <input value={instagram} onChange={e => { setInstagram(e.target.value); setSaved(false) }}
            placeholder="@you"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">X</label>
          <input value={x} onChange={e => { setX(e.target.value); setSaved(false) }}
            placeholder="@you"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>
      </div>

      <div>
        <label className="text-[12px] font-semibold tracking-wide uppercase text-stone block mb-2">Favorite categories (optional)</label>
        <div className="flex flex-wrap gap-2">
          {FOOD_CATEGORIES.map(cat => (
            <button key={cat} type="button" onClick={() => toggleCategory(cat)}
              className={`text-[12px] font-semibold px-3 py-1.5 rounded-full border-[1.5px] transition-colors ${
                categories.includes(cat) ? 'bg-rust border-rust text-white' : 'bg-white border-[#ECEAE4] text-stone hover:border-wheat'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-[13px] text-rust">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="bg-rust text-white text-[14px] font-bold px-6 py-3 rounded-xl hover:bg-[#A8521F] transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="text-[13px] font-semibold text-sage">Saved.</span>}
      </div>
    </form>
  )
}
