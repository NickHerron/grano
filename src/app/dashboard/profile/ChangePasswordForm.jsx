'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ChangePasswordForm() {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setPassword('')
    setConfirm('')
    setSaved(true)
    setOpen(false)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-[520px]">
      {!open ? (
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setOpen(true)}
            className="bg-linen text-soil text-[13px] font-semibold px-4 py-2.5 rounded-lg hover:bg-[#E4E0D5] transition-colors">
            Change password
          </button>
          {saved && <span className="text-[13px] font-semibold text-sage">Password updated.</span>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">New password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Confirm new password</label>
            <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
              className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
          </div>
          {error && <p className="text-[13px] text-rust">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="bg-rust text-white text-[14px] font-bold px-6 py-3 rounded-xl hover:bg-[#A8521F] transition-colors disabled:opacity-60">
              {saving ? 'Saving…' : 'Save new password'}
            </button>
            <button type="button" onClick={() => { setOpen(false); setError(''); setPassword(''); setConfirm('') }}
              className="text-[13px] font-medium text-stone hover:text-soil transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
