'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Saves itself immediately, same pattern as RolesEditor/CommunityMemberships — not
// part of the surrounding form's save payload. The owner can only ever move between
// 'unverified' and 'pending_verification' here; approval to 'verified' is admin-only
// (schema_organizations_verification.sql's protect_organization_verification_status()
// trigger enforces this server-side regardless of what this component sends).
export default function RequestVerificationControl({ organizationId, status }) {
  const router = useRouter()
  const supabase = createClient()
  const [current, setCurrent] = useState(status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function setStatus(next) {
    setSaving(true)
    setError('')
    const { error: updErr } = await supabase.from('organizations').update({ verification_status: next }).eq('id', organizationId)
    setSaving(false)
    if (updErr) { setError(updErr.message); return }
    setCurrent(next)
    router.refresh()
  }

  if (current === 'verified') {
    return (
      <div className="flex items-center gap-2 bg-[#EBF3EC] rounded-lg px-4 py-3">
        <span className="w-5 h-5 rounded-full bg-sage text-white flex items-center justify-center text-[11px] flex-shrink-0">✓</span>
        <span className="text-[13px] font-semibold text-sage">Grano Verified</span>
      </div>
    )
  }

  if (current === 'pending_verification') {
    return (
      <div className="flex items-center justify-between gap-3 bg-linen rounded-lg px-4 py-3 flex-wrap">
        <span className="text-[13px] font-semibold text-soil">Verification requested — an admin will review it soon.</span>
        <button type="button" onClick={() => setStatus('unverified')} disabled={saving}
          className="text-[12px] font-semibold text-stone hover:text-soil transition-colors disabled:opacity-60">
          {saving ? 'Withdrawing…' : 'Withdraw request'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-linen rounded-lg px-4 py-3 flex-wrap">
      <span className="text-[13px] text-stone">Not yet verified.</span>
      <button type="button" onClick={() => setStatus('pending_verification')} disabled={saving}
        className="text-[12px] font-semibold text-white bg-rust px-3 py-1.5 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-60">
        {saving ? 'Requesting…' : 'Request Verification'}
      </button>
      {error && <p className="text-[11px] text-rust w-full">{error}</p>}
    </div>
  )
}
