'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_DEFS, ROLE_CATEGORIES } from '@/lib/businessRoles'
import { setPrimaryRole, addRoleTag, removeRoleTag } from '@/app/dashboard/profiles/roleTagActions'

const chipClass = "text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-colors"

// Mounted into all three profile-edit forms (producer, restaurant, organization).
// The primary-role picker only ever offers roles from this entity's OWN category —
// changing primary role can't move an entity to a different table. Additional roles
// have no such limit: this is where a farm can pick up a 'caterer' tag, matching the
// plan's own cross-category examples.
export default function RolesEditor({ businessType, businessId, initialRoles }) {
  const router = useRouter()
  const [roles, setRoles] = useState(initialRoles)
  const [saving, setSaving] = useState(null) // role_key currently in flight, for per-button disabled state
  const [error, setError] = useState('')
  const [pendingRemoval, setPendingRemoval] = useState(null) // { roleKey, warning }
  const [adding, setAdding] = useState(false)

  const primary = roles.find(r => r.is_primary)
  const additional = roles.filter(r => !r.is_primary)
  const additionalKeys = new Set(additional.map(r => r.role_key))
  const ownCategoryRoles = Object.entries(ROLE_DEFS).filter(([, def]) => def.table === businessType)
  const addableRoles = Object.entries(ROLE_DEFS).filter(([key]) => key !== primary?.role_key && !additionalKeys.has(key))

  async function handleSetPrimary(roleKey) {
    if (roleKey === primary?.role_key) return
    setSaving(roleKey); setError('')
    const result = await setPrimaryRole(businessType, businessId, roleKey)
    setSaving(null)
    if (result.error) { setError(result.error); return }
    setRoles(rs => {
      const withoutOldPrimary = rs.map(r => ({ ...r, is_primary: false }))
      return withoutOldPrimary.some(r => r.role_key === roleKey)
        ? withoutOldPrimary.map(r => r.role_key === roleKey ? { ...r, is_primary: true } : r)
        : [...withoutOldPrimary, { role_key: roleKey, is_primary: true }]
    })
    router.refresh()
  }

  async function handleAdd(roleKey) {
    setSaving(roleKey); setError('')
    const result = await addRoleTag(businessType, businessId, roleKey)
    setSaving(null)
    if (result.error) { setError(result.error); return }
    setRoles(rs => [...rs, { role_key: roleKey, is_primary: false }])
    setAdding(false)
    router.refresh()
  }

  async function handleRemove(roleKey, force = false) {
    setSaving(roleKey); setError('')
    const result = await removeRoleTag(businessType, businessId, roleKey, { force })
    setSaving(null)
    if (result.error) { setError(result.error); return }
    if (result.warning && !force) { setPendingRemoval({ roleKey, warning: result.warning }); return }
    setPendingRemoval(null)
    setRoles(rs => rs.filter(r => r.role_key !== roleKey))
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-1.5">Primary role</div>
        <p className="text-[12px] text-stone mb-2">Determines how this profile is presented and categorized. Changing it updates your profile's main type.</p>
        <div className="flex flex-wrap gap-2">
          {ownCategoryRoles.map(([key, def]) => (
            <button key={key} type="button" onClick={() => handleSetPrimary(key)} disabled={saving === key}
              className={`${chipClass} ${primary?.role_key === key ? 'bg-rust border-rust text-white' : 'bg-white border-[#ECEAE4] text-soil hover:border-rust'} disabled:opacity-60`}>
              {def.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-1.5">Additional roles</div>
        <p className="text-[12px] text-stone mb-2">Everything else this profile does — a bakery that also caters, a cafe that's also a pickup point.</p>
        {additional.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {additional.map(r => (
              <span key={r.role_key} className={`${chipClass} bg-linen border-transparent text-soil flex items-center gap-2`}>
                {ROLE_DEFS[r.role_key]?.label || r.role_key}
                <button type="button" onClick={() => handleRemove(r.role_key)} disabled={saving === r.role_key}
                  className="text-[#C0A090] hover:text-rust disabled:opacity-60">×</button>
              </span>
            ))}
          </div>
        )}

        {pendingRemoval && (
          <div className="bg-[#FDF0E8] rounded-lg p-3 mb-2 flex flex-col gap-2">
            <p className="text-[12px] text-soil">{pendingRemoval.warning}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleRemove(pendingRemoval.roleKey, true)}
                className="text-[12px] font-semibold text-white bg-rust px-3 py-1.5 rounded-lg hover:bg-[#A8521F] transition-colors">
                Remove anyway
              </button>
              <button type="button" onClick={() => setPendingRemoval(null)}
                className="text-[12px] font-semibold text-stone px-3 py-1.5 rounded-lg hover:text-soil transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {adding ? (
          <div className="flex flex-col gap-3">
            {ROLE_CATEGORIES.map(cat => {
              const inCategory = addableRoles.filter(([, def]) => def.category === cat.key)
              if (!inCategory.length) return null
              return (
                <div key={cat.key}>
                  <div className="text-[11px] font-semibold text-rust uppercase tracking-wide mb-1">{cat.label}</div>
                  <div className="flex flex-wrap gap-2">
                    {inCategory.map(([key, def]) => (
                      <button key={key} type="button" onClick={() => handleAdd(key)} disabled={saving === key}
                        className={`${chipClass} bg-white border-[#ECEAE4] text-soil hover:border-rust disabled:opacity-60`}>
                        + {def.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
            <button type="button" onClick={() => setAdding(false)} className="self-start text-[12px] font-semibold text-stone hover:text-soil">
              Done
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="text-[12px] font-semibold text-rust hover:underline">
            + Add a role
          </button>
        )}
      </div>

      {error && <p className="text-[12px] text-rust">{error}</p>}
    </div>
  )
}
