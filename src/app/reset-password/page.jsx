'use client'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function establishSession() {
      // The link Supabase emails uses PKCE (?code=...), which our browser client
      // (set up for PKCE by default) needs exchanged explicitly for a session —
      // it isn't picked up automatically the way the older implicit #access_token
      // flow was. Fall back to checking for an existing session in case a session
      // was already established (e.g. the older link format, or a retry).
      const code = searchParams.get('code')
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return
        if (!exchangeError) {
          setReady(true)
          setChecking(false)
          return
        }
      }
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (data.session) setReady(true)
      setChecking(false)
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    establishSession()

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [supabase, searchParams])

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
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  return (
    <div className="max-w-[420px] mx-auto px-8 py-24">
      {done ? (
        <>
          <h1 className="font-serif text-[32px] font-semibold text-soil mb-1">Password updated</h1>
          <p className="text-[14px] text-stone">Taking you to your dashboard…</p>
        </>
      ) : checking ? (
        <p className="text-[14px] text-stone">Checking your link…</p>
      ) : !ready ? (
        <>
          <h1 className="font-serif text-[32px] font-semibold text-soil mb-1">Reset link needed</h1>
          <p className="text-[14px] text-stone">
            This page only works from the link in your password reset email — it may have expired or already been used.
          </p>
          <p className="text-[13px] text-stone mt-6">
            <Link href="/forgot-password" className="text-rust font-semibold hover:underline">Request a new link</Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="font-serif text-[32px] font-semibold text-soil mb-1">Set a new password</h1>
          <p className="text-[14px] text-stone mb-8">Choose a new password for your account.</p>

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

            <button type="submit" disabled={loading}
              className="w-full bg-rust text-white text-[15px] font-bold py-3.5 rounded-xl hover:bg-[#A8521F] transition-colors disabled:opacity-60 mt-2">
              {loading ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  )
}
