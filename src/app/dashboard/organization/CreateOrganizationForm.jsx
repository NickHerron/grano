'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ORG_TYPE_LABELS } from '@/lib/businessNetwork'
import { createOrganization } from './actions'

const inputClass = "bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors w-full"
const labelClass = "text-[12px] font-semibold tracking-wide uppercase text-stone"

// The one-time "create your organization" step — everything else (photos, schedule,
// description) is edited afterward on OrganizationProfileForm, same split as a brand
// new farm/restaurant (created with just a name, filled in over time).
export default function CreateOrganizationForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [orgType, setOrgType] = useState('farmers_market')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [duplicates, setDuplicates] = useState(null)

  async function submit(confirmedDuplicate) {
    setSaving(true)
    setError('')
    const formData = new FormData()
    formData.set('name', name)
    formData.set('org_type', orgType)
    const result = await createOrganization(formData, confirmedDuplicate)
    setSaving(false)
    if (result.duplicates) {
      setDuplicates(result.duplicates)
      return
    }
    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  function handleSubmit(e) {
    e.preventDefault()
    submit(false)
  }

  // Advisory only — never blocks. A possible-duplicate match pauses here so the
  // person can go manage the real one instead of creating a second profile for the
  // same market, or confirm this is genuinely a different organization.
  if (duplicates) {
    return (
      <div className="bg-white border border-[#ECEAE4] rounded-xl p-6 flex flex-col gap-4 max-w-[520px]">
        <div>
          <div className="text-[14px] font-semibold text-soil mb-1">This might already exist</div>
          <p className="text-[12px] text-stone">We found {duplicates.length === 1 ? 'an organization with a similar name' : `${duplicates.length} organizations with similar names`}:</p>
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
          <button type="button" onClick={() => setDuplicates(null)} className="text-[13px] text-stone hover:text-soil">Cancel</button>
        </div>
        {error && <p className="text-[12px] text-rust">{error}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#ECEAE4] rounded-xl p-6 flex flex-col gap-4 max-w-[520px]">
      <div>
        <div className="text-[14px] font-semibold text-soil mb-1">Create an organization</div>
        <p className="text-[12px] text-stone">A farmers market, pickup location, food hub, or community organization — a public profile local businesses can link to.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Name</label>
        <input required className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Logan Square Farmers Market" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Type</label>
        <select className={inputClass} value={orgType} onChange={e => setOrgType(e.target.value)}>
          {Object.entries(ORG_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      {error && <p className="text-[12px] text-rust">{error}</p>}
      <button type="submit" disabled={saving} className="self-start bg-rust text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-60">
        {saving ? 'Creating…' : '+ Create Organization'}
      </button>
    </form>
  )
}
