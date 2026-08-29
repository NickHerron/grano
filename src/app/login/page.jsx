'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TurnstileWidget from '@/components/TurnstileWidget'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const turnstileRef = useRef(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email, password,
      options: { captchaToken: captchaToken || undefined },
    })

    setLoading(false)
    if (signInError) {
      setError(signInError.message)
      turnstileRef.current?.reset()
      setCaptchaToken('')
      return
    }

    // A producer who never finished (or never started) the onboarding wizard picks
    // back up where they left off — but only when nothing sent them to login for a
    // specific reason (an explicit `next` deep link always wins).
    const next = searchParams.get('next')
    if (!next) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: farm } = user
        ? await supabase.from('farms').select('onboarding_status').eq('owner_id', user.id).maybeSingle()
        : { data: null }
      if (farm?.onboarding_status === 'not_started') {
        router.push('/onboarding')
        router.refresh()
        return
      }
    }
    router.push(next || '/dashboard')
    router.refresh()
  }

  return (
    <div className="max-w-[420px] mx-auto px-8 py-24">
      <h1 className="font-serif text-[32px] font-semibold text-soil mb-1">Sign in</h1>
      <p className="text-[14px] text-stone mb-8">Welcome back to Grano.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Email address</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Password</label>
            <Link href="/forgot-password" className="text-[12px] font-semibold text-rust hover:underline">Forgot password?</Link>
          </div>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Your password"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>

        <TurnstileWidget ref={turnstileRef} onToken={setCaptchaToken} />

        {error && <p className="text-[13px] text-rust">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-rust text-white text-[15px] font-bold py-3.5 rounded-xl hover:bg-[#A8521F] transition-colors disabled:opacity-60 mt-2">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-[13px] text-stone text-center mt-6">
        Don't have an account? <Link href="/signup" className="text-rust font-semibold hover:underline">Sign up</Link>
      </p>
    </div>
  )
}
