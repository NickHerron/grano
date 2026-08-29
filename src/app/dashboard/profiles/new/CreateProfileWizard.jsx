'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ROLE_DEFS, ROLE_CATEGORIES, roleLabel } from '@/lib/businessRoles'
import { createProfileFromRoles } from '../actions'
import { ORG_TYPE_LABELS } from '@/lib/businessNetwork'

const cardClass = "bg-white border border-[#ECEAE4] rounded-xl p-6 text-left hover:border-rust transition-colors w-full"
const inputClass = "bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors w-full"
const chipClass = "text-[13px] font-semibold px-3.5 py-2 rounded-lg border transition-colors"

// Person / Organization -> (Organization only) category-grouped multi-select role
// picker -> pick one primary -> name + location -> create. Deliberately does NOT
// show Farm/Bakery/Restaurant/etc. as the first-level choice — those are one level
// down, inside "What does your organization do?" — matching the plan's explicit
// instruction not to overwhelm the first step.
export default function CreateProfileWizard() {
  const router = useRouter()
  const [step, setStep] = useState('what') // 'what' | 'categories' | 'primary' | 'details' | 'duplicates'
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  const [selectedRoles, setSelectedRoles] = useState(new Set())
  const [primaryRoleKey, setPrimaryRoleKey] = useState(null)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [existingHref, setExistingHref] = useState(null)
  const [duplicates, setDuplicates] = useState(null)

  function toggleCategory(key) {
    setExpandedCategories(s => {
      const next = new Set(s)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }
  function toggleRole(key) {
    setSelectedRoles(s => {
      const next = new Set(s)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function submit(confirmedDuplicate) {
    setSaving(true)
    setError('')
    setExistingHref(null)
    const result = await createProfileFromRoles({
      primaryRoleKey,
      additionalRoleKeys: [...selectedRoles],
      name,
      location,
      confirmedDuplicate,
    })
    setSaving(false)
    if (result.duplicates) {
      setDuplicates(result.duplicates)
      setStep('duplicates')
      return
    }
    if (result.error) {
      setError(result.error)
      if (result.existingHref) setExistingHref(result.existingHref)
      return
    }
    router.push(result.redirectHref)
  }

  function handleSubmit(e) {
    e.preventDefault()
    submit(false)
  }

  if (step === 'what') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[640px]">
        <button type="button" onClick={() => router.push('/dashboard/profile?section=personal')} className={cardClass}>
          <div className="text-[16px] font-semibold text-soil mb-1">Myself</div>
          <div className="text-[13px] text-stone">A personal profile — discover businesses, follow them, and participate in the local food community.</div>
        </button>
        <button type="button" onClick={() => setStep('categories')} className={cardClass}>
          <div className="text-[16px] font-semibold text-soil mb-1">A Business or Organization</div>
          <div className="text-[13px] text-stone">A farm, restaurant, market, food hub, or other organization — a public profile the community can find.</div>
        </button>
      </div>
    )
  }

  if (step === 'categories') {
    return (
      <div className="max-w-[640px]">
        <button type="button" onClick={() => setStep('what')} className="text-[12px] font-semibold text-stone hover:text-soil mb-4">← Back</button>
        <h2 className="font-serif text-[19px] font-semibold text-soil mb-1">What does your organization do?</h2>
        <p className="text-[13px] text-stone mb-4">Select everything that applies — most organizations have more than one.</p>
        <div className="flex flex-col gap-3 mb-6">
          {ROLE_CATEGORIES.map(cat => {
            const roles = Object.entries(ROLE_DEFS).filter(([, def]) => def.category === cat.key)
            const expanded = expandedCategories.has(cat.key)
            return (
              <div key={cat.key} className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
                <button type="button" onClick={() => toggleCategory(cat.key)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-linen transition-colors">
                  <div>
                    <div className="text-[14px] font-semibold text-soil">{cat.label}</div>
                    <div className="text-[12px] text-stone">{cat.blurb}</div>
                  </div>
                  <span className="text-[13px] text-stone flex-shrink-0">{expanded ? '−' : '+'}</span>
                </button>
                {expanded && (
                  <div className="flex flex-wrap gap-2 px-5 pb-4">
                    {roles.map(([key, def]) => (
                      <button key={key} type="button" onClick={() => toggleRole(key)}
                        className={`${chipClass} ${selectedRoles.has(key) ? 'bg-rust border-rust text-white' : 'bg-linen border-transparent text-soil hover:border-rust'}`}>
                        {def.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <button type="button" disabled={selectedRoles.size === 0} onClick={() => setStep('primary')}
          className="bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-40">
          Continue
        </button>
      </div>
    )
  }

  if (step === 'primary') {
    return (
      <div className="max-w-[640px]">
        <button type="button" onClick={() => setStep('categories')} className="text-[12px] font-semibold text-stone hover:text-soil mb-4">← Back</button>
        <h2 className="font-serif text-[19px] font-semibold text-soil mb-1">Which one best describes your organization?</h2>
        <p className="text-[13px] text-stone mb-4">This determines how your profile is presented — the rest become additional roles.</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {[...selectedRoles].map(key => (
            <button key={key} type="button" onClick={() => { setPrimaryRoleKey(key); setStep('details') }}
              className={`${chipClass} bg-white border-[#ECEAE4] text-soil hover:border-rust`}>
              {roleLabel(key)}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'duplicates') {
    return (
      <div className="max-w-[520px] flex flex-col gap-4">
        <div>
          <div className="text-[14px] font-semibold text-soil mb-1">This might already exist</div>
          <p className="text-[13px] text-stone">We found {duplicates.length === 1 ? 'an organization with a similar name' : `${duplicates.length} organizations with similar names`}:</p>
        </div>
        <div className="flex flex-col gap-2">
          {duplicates.map(d => (
            <Link key={d.id} href={`/markets/${d.slug}`} target="_blank"
              className="bg-linen hover:bg-[#E4E0D5] transition-colors rounded-lg px-4 py-3">
              <div className="text-[13px] font-semibold text-soil">{d.name}</div>
              <div className="text-[11px] text-stone">{[ORG_TYPE_LABELS[d.org_type], d.location].filter(Boolean).join(' · ')}</div>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button type="button" onClick={() => submit(true)} disabled={saving}
            className="text-[13px] font-semibold text-white bg-rust px-4 py-2 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-60">
            {saving ? 'Creating…' : "This is different — create anyway"}
          </button>
          <button type="button" onClick={() => setStep('details')} className="text-[13px] text-stone hover:text-soil">← Back</button>
        </div>
        {error && <p className="text-[13px] text-rust">{error}</p>}
      </div>
    )
  }

  // 'details'
  return (
    <form onSubmit={handleSubmit} className="max-w-[480px] flex flex-col gap-4">
      <button type="button" onClick={() => setStep('primary')} className="self-start text-[12px] font-semibold text-stone hover:text-soil">← Back</button>
      <div>
        <div className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-1.5">Primary role</div>
        <div className={`${chipClass} inline-block bg-rust border-rust text-white`}>{roleLabel(primaryRoleKey)}</div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Name</label>
        <input required className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Business or organization name" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Location (optional)</label>
        <input className={inputClass} value={location} onChange={e => setLocation(e.target.value)} placeholder="Chicago, IL" />
      </div>
      {error && (
        <div className="text-[13px] text-rust">
          {error} {existingHref && <Link href={existingHref} className="underline">Manage it here →</Link>}
        </div>
      )}
      <button type="submit" disabled={saving}
        className="self-start bg-rust text-white text-[15px] font-bold px-6 py-3 rounded-xl hover:bg-[#A8521F] transition-colors disabled:opacity-60">
        {saving ? 'Creating…' : '+ Create Profile'}
      </button>
    </form>
  )
}
