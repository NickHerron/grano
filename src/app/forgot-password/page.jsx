'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import TurnstileWidget from '@/components/TurnstileWidget'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const turnstileRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken: captchaToken || undefined,
    })
    setLoading(false)
    // Always show the same confirmation regardless of whether the email exists —
    // otherwise this becomes a way to check which emails have Grano accounts.
    if (resetError) {
      setError(resetError.message)
      turnstileRef.current?.reset()
      setCaptchaToken('')
      return
    }
    setSent(true)
  }

  return (
    <div className="max-w-[420px] mx-auto px-8 py-24">
      {sent ? (
        <>
          <h1 className="font-serif text-[32px] font-semibold text-soil mb-1">Check your email</h1>
          <p className="text-[14px] text-stone">
            If an account exists for <strong>{email}</strong>, we've sent a link to reset your password. It expires soon, so use it within an hour.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-serif text-[32px] font-semibold text-soil mb-1">Reset your password</h1>
          <p className="text-[14px] text-stone mb-8">Enter your email and we'll send you a link to set a new password.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
            </div>

            <TurnstileWidget ref={turnstileRef} onToken={setCaptchaToken} />

            {error && <p className="text-[13px] text-rust">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-rust text-white text-[15px] font-bold py-3.5 rounded-xl hover:bg-[#A8521F] transition-colors disabled:opacity-60 mt-2">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        </>
      )}

      <p className="text-[13px] text-stone text-center mt-6">
        <Link href="/login" className="text-rust font-semibold hover:underline">Back to sign in</Link>
      </p>
    </div>
  )
}
