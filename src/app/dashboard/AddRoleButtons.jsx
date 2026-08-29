'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addRole } from './roleActions'

const ROLE_COPY = {
  producer: { label: 'Producer / Farm', blurb: 'Build a profile, list what you make, sell when ready.' },
  restaurant: { label: 'Restaurant / Buyer', blurb: 'Discover local producers and source what you need.' },
  customer: { label: 'Consumer', blurb: 'Follow producers, shop, and see what\'s in season.' },
}

export default function AddRoleButtons({ missingRoles }) {
  const router = useRouter()
  const [open, setOpen] = useState(null) // which role's inline form is expanded
  const [fields, setFields] = useState({ restaurantName: '', farmName: '', farmLocation: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!missingRoles.length) return null

  async function handleAdd(role) {
    if ((role === 'restaurant' || role === 'producer') && open !== role) {
      setOpen(role)
      setError('')
      return
    }
    setSaving(true)
    setError('')
    const formData = new FormData()
    formData.set('role', role)
    if (role === 'restaurant') formData.set('restaurantName', fields.restaurantName)
    if (role === 'producer') {
      formData.set('farmName', fields.farmName)
      formData.set('farmLocation', fields.farmLocation)
    }
    const result = await addRole(formData)
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setOpen(null)
    // Brand-new producer role → straight into the guided setup wizard, same as a
    // fresh signup. Restaurant/customer additions just refresh in place.
    if (role === 'producer') {
      router.push('/onboarding')
      return
    }
    router.refresh()
  }

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl p-6">
      <div className="text-[14px] font-semibold text-soil mb-1">Add a role to your account</div>
      <p className="text-[12px] text-stone mb-4">One Grano account, multiple roles — switch anytime, no separate sign-up needed.</p>
      <div className="flex flex-col gap-3">
        {missingRoles.map(role => (
          <div key={role} className="border border-[#ECEAE4] rounded-lg p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[13px] font-semibold text-soil">{ROLE_COPY[role].label}</div>
                <div className="text-[12px] text-stone">{ROLE_COPY[role].blurb}</div>
              </div>
              <button onClick={() => handleAdd(role)} disabled={saving}
                className="text-[12px] font-semibold text-white bg-rust px-4 py-2 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-60 whitespace-nowrap">
                {role === 'customer' ? '+ Add' : (open === role ? (saving ? 'Adding…' : 'Confirm') : `Become a ${ROLE_COPY[role].label.split(' / ')[0]}`)}
              </button>
            </div>

            {open === role && role === 'restaurant' && (
              <input
                value={fields.restaurantName}
                onChange={e => setFields(f => ({ ...f, restaurantName: e.target.value }))}
                placeholder="Restaurant / business name"
                className="mt-3 w-full bg-linen border border-transparent rounded-lg px-3 py-2 text-[13px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors"
              />
            )}

            {open === role && role === 'producer' && (
              <div className="mt-3 flex flex-col gap-2">
                <input
                  value={fields.farmName}
                  onChange={e => setFields(f => ({ ...f, farmName: e.target.value }))}
                  placeholder="Farm / business name"
                  className="w-full bg-linen border border-transparent rounded-lg px-3 py-2 text-[13px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors"
                />
                <input
                  value={fields.farmLocation}
                  onChange={e => setFields(f => ({ ...f, farmLocation: e.target.value }))}
                  placeholder="Location — e.g. Elgin, IL"
                  className="w-full bg-linen border border-transparent rounded-lg px-3 py-2 text-[13px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors"
                />
              </div>
            )}
          </div>
        ))}
      </div>
      {error && <p className="text-[12px] text-rust mt-3">{error}</p>}
    </div>
  )
}
