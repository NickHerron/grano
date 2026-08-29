'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PRACTICE_OPTIONS } from '@/lib/producerOptions'
import { initialFarmForm, farmUpdatePayload } from '@/lib/farmProfileForm'
import { IdentityFields, LocationFields, ContactFields, SocialFields, ShortIntroField, StoryField } from '@/components/profile/ProfileFieldGroups'
import RolesEditor from '@/components/profile/RolesEditor'
import CommunityMemberships from '@/components/profile/CommunityMemberships'
import ImageUploadField from './ImageUploadField'

const inputClass = "bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors w-full"
const labelClass = "text-[12px] font-semibold tracking-wide uppercase text-stone"

export default function ProfileForm({ farm, roles = [], memberships = [], availableAreas = [] }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    ...initialFarmForm(farm),
    num_employees: farm.num_employees || '',
    delivery_area: farm.delivery_area || '',
    sell_on_grano: farm.sell_on_grano || false,
    practices: farm.practices || {},
  })
  const [photos, setPhotos] = useState({
    logo_url: farm.logo_url,
    cover_photo_url: farm.cover_photo_url,
    profile_photo_url: farm.profile_photo_url,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function update(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }
  function togglePractice(key) {
    setForm(f => ({ ...f, practices: { ...f.practices, [key]: !f.practices[key] } }))
    setSaved(false)
  }
  function toggleSecondaryType(type) {
    setForm(f => ({
      ...f,
      secondary_types: f.secondary_types.includes(type)
        ? f.secondary_types.filter(t => t !== type)
        : [...f.secondary_types, type],
    }))
    setSaved(false)
  }
  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: dbError } = await supabase.from('farms').update(farmUpdatePayload(form)).eq('id', farm.id)
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

      {/* ROLES — saves itself immediately (server actions), not part of this form's
          own save-on-submit flow, same pattern as ImageUploadField below. */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">Roles</h2>
        <p className="text-[13px] text-stone mb-4">What this profile does — separate from producer_type/secondary_types below, but kept in sync with them.</p>
        <RolesEditor businessType="farm" businessId={farm.id} initialRoles={roles} />
      </section>

      {/* COMMUNITIES — saves itself immediately, same as Roles above */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">Communities</h2>
        <p className="text-[13px] text-stone mb-4">Your home community comes from City/State below. Sell somewhere else too? Join that community as well.</p>
        <CommunityMemberships businessType="farm" businessId={farm.id}
          home={{ city: farm.city, state: farm.state }} initialMemberships={memberships} availableAreas={availableAreas} />
      </section>

      {/* PHOTOS */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-4">Photos</h2>
        <div className="flex flex-col gap-5">
          <ImageUploadField farmId={farm.id} farmName={farm.name} field="cover_photo_url" currentUrl={photos.cover_photo_url}
            label="Cover photo" shape="banner" onSaved={url => setPhotos(p => ({ ...p, cover_photo_url: url }))} />
          <ImageUploadField farmId={farm.id} farmName={farm.name} field="logo_url" currentUrl={photos.logo_url}
            label="Logo" shape="square" onSaved={url => setPhotos(p => ({ ...p, logo_url: url }))} />
          <ImageUploadField farmId={farm.id} farmName={farm.name} field="profile_photo_url" currentUrl={photos.profile_photo_url}
            label="Profile photo" shape="square" onSaved={url => setPhotos(p => ({ ...p, profile_photo_url: url }))} />
        </div>
      </section>

      {/* BASIC INFO */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-4">Basic Information</h2>
        <div className="flex flex-col gap-4">
          <IdentityFields form={form} update={update} toggleSecondaryType={toggleSecondaryType} />
          <LocationFields form={form} update={update} />
          <ContactFields form={form} update={update} />
          <SocialFields form={form} update={update} />
        </div>
      </section>

      {/* STORY */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">Your Story</h2>
        <p className="text-[13px] text-stone mb-4">Tell us about your business. How did you get started? What makes you different? Why do you make what you make? Write as much as you want.</p>
        <div className="flex flex-col gap-4">
          <ShortIntroField form={form} update={update} />
          <StoryField form={form} update={update} />
        </div>
      </section>

      {/* PRACTICES */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">Farm / Business Details</h2>
        <p className="text-[13px] text-stone mb-4">Only what you check here shows on your public profile.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {PRACTICE_OPTIONS.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-[13px] text-soil cursor-pointer bg-linen rounded-lg px-3 py-2.5">
              <input type="checkbox" checked={Boolean(form.practices[key])} onChange={() => togglePractice(key)} className="w-4 h-4 accent-rust" />
              {label}
            </label>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Number of employees</label>
            <input className={inputClass} value={form.num_employees} onChange={e => update('num_employees', e.target.value)} placeholder="e.g. 3, or 10-20" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Delivery area</label>
            <input className={inputClass} value={form.delivery_area} onChange={e => update('delivery_area', e.target.value)} placeholder="Chicagoland, 30 mile radius…" />
          </div>
        </div>
      </section>

      {/* COMMERCE */}
      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">Sell on Grano</h2>
        <p className="text-[13px] text-stone mb-4">
          Off: you have a profile, but nothing sells through Grano yet. On: products you mark "for sale" can appear in the Grano marketplace.
        </p>
        <button type="button" onClick={() => update('sell_on_grano', !form.sell_on_grano)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-[1.5px] transition-all ${
            form.sell_on_grano ? 'bg-[#EBF3EC] border-sage' : 'bg-linen border-transparent'
          }`}>
          <span className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${form.sell_on_grano ? 'bg-sage' : 'bg-[#D9D2C5]'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${form.sell_on_grano ? 'left-[18px]' : 'left-0.5'}`} />
          </span>
          <span className={`text-[14px] font-semibold ${form.sell_on_grano ? 'text-sage' : 'text-stone'}`}>
            {form.sell_on_grano ? 'Selling on Grano' : 'Not selling on Grano yet'}
          </span>
        </button>
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
