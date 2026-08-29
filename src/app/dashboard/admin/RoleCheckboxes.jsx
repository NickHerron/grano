'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ROLES = [
  ['customer', 'Customer'],
  ['restaurant', 'Restaurant'],
  ['producer', 'Producer'],
  ['admin', 'Admin'],
]

// account_roles is the source of truth for what an account can do, and an account can
// hold several roles at once — a dropdown that only ever adds one role never let an
// admin actually remove one. Checkboxes read/write account_roles directly.
export default function RoleCheckboxes({ userId, initialRoles, disabled }) {
  const router = useRouter()
  const supabase = createClient()
  const [roles, setRoles] = useState(new Set(initialRoles))
  const [saving, setSaving] = useState(false)

  async function toggle(role) {
    if (disabled || saving) return
    const has = roles.has(role)
    // Every account needs at least one role — refuse to remove the last one rather
    // than leaving someone with none.
    if (has && roles.size === 1) return

    setSaving(true)
    if (has) {
      await supabase.from('account_roles').delete().eq('user_id', userId).eq('role', role)
    } else {
      await supabase.from('account_roles').insert({ user_id: userId, role })
    }
    setRoles(prev => {
      const next = new Set(prev)
      has ? next.delete(role) : next.add(role)
      return next
    })
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-1">
      {ROLES.map(([key, label]) => (
        <label key={key}
          className={`flex items-center gap-1.5 text-[12px] font-medium text-soil ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
          <input type="checkbox" checked={roles.has(key)} disabled={disabled || saving}
            onChange={() => toggle(key)} className="w-3.5 h-3.5 accent-rust" />
          {label}
        </label>
      ))}
    </div>
  )
}
