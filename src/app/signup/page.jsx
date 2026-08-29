'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PRODUCER_BUSINESS_TYPES } from '@/lib/producerOptions'
import { RESTAURANT_BUSINESS_TYPES } from '@/lib/restaurantOptions'
import TurnstileWidget, { TURNSTILE_SITE_KEY } from '@/components/TurnstileWidget'

const roleOptions = [
  ['producer', 'Producer / Vendor', 'I grow or make food to sell'],
  ['restaurant', 'Restaurant / Buyer', 'I source ingredients for a restaurant or business'],
  ['customer', 'Consumer / Community Member', 'I want to discover and shop local food'],
]

const presets = [
  { label: 'Producer AND a Buyer', roles: ['producer', 'restaurant'] },
  { label: 'Vendor AND a Consumer', roles: ['producer', 'customer'] },
  { label: 'Consumer AND a Business', roles: ['customer', 'producer'] },
]

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const preselect = searchParams.get('as')
  const invitedByName = searchParams.get('invited_by_name')
  const [roles, setRoles] = useState(
    preselect === 'restaurant' ? ['restaurant'] : preselect === 'producer' ? ['producer'] : ['customer']
  )
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    restaurantName: '', farmName: '', farmLocation: '', organizationName: '',
  })
  const [producerBusinessTypes, setProducerBusinessTypes] = useState([])
  const [restaurantBusinessTypes, setRestaurantBusinessTypes] = useState([])
  // Tracked separately from `roles` on purpose — an organization is not an account
  // role (no account_roles row gets created for it), same distinction the dashboard's
  // own organization-creation flow already keeps. See schema_signup_organization.sql.
  const [wantsOrganization, setWantsOrganization] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const turnstileRef = useRef(null)

  function update(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleRole(role) {
    setRoles(rs => rs.includes(role) ? rs.filter(r => r !== role) : [...rs, role])
  }

  function toggleProducerBusinessType(type) {
    setProducerBusinessTypes(ts => ts.includes(type) ? ts.filter(t => t !== type) : [...ts, type])
  }

  function toggleRestaurantBusinessType(type) {
    setRestaurantBusinessTypes(ts => ts.includes(type) ? ts.filter(t => t !== type) : [...ts, type])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!roles.length) {
      setError('Choose at least one way you\'ll use Grano.')
      return
    }
    if (roles.includes('producer') && producerBusinessTypes.length === 0) {
      setError('Choose at least one business type that fits your business.')
      return
    }
    if (roles.includes('restaurant') && restaurantBusinessTypes.length === 0) {
      setError('Choose at least one business type for your restaurant / business.')
      return
    }
    if (wantsOrganization && !form.organizationName.trim()) {
      setError('Enter a name for your farmers market or organization.')
      return
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy to create an account.')
      return
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError('Please complete the verification check below.')
      return
    }
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        captchaToken: captchaToken || undefined,
        data: {
          roles,
          full_name: form.fullName,
          restaurant_name: roles.includes('restaurant') ? form.restaurantName : undefined,
          farm_name: roles.includes('producer') ? form.farmName : undefined,
          farm_location: roles.includes('producer') ? form.farmLocation : undefined,
          farm_business_types: roles.includes('producer') ? producerBusinessTypes : undefined,
          restaurant_business_types: roles.includes('restaurant') ? restaurantBusinessTypes : undefined,
          wants_organization: wantsOrganization || undefined,
          organization_name: wantsOrganization ? form.organizationName : undefined,
        },
      },
    })

    setLoading(false)
    if (signUpError) {
      setError(signUpError.message)
      turnstileRef.current?.reset()
      setCaptchaToken('')
      return
    }
    if (!data.session) {
      setCheckEmail(true)
      return
    }
    // A brand-new producer gets the guided setup wizard (takes priority — the wizard
    // exists specifically for a first farm profile); a brand-new organization with no
    // producer role goes straight to managing it; everyone else goes to the dashboard
    // as before. onboarding_status stays 'not_started' for a new farm until the
    // wizard is finished or abandoned, so a later /login also knows to route them
    // back here — see the redirect in login/page.jsx.
    router.push(roles.includes('producer') ? '/onboarding' : wantsOrganization ? '/dashboard/organization' : '/dashboard')
    router.refresh()
  }

  if (checkEmail) {
    return (
      <div className="max-w-[480px] mx-auto px-8 py-24 text-center">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-3">Check your email</h1>
        <p className="text-[14px] text-stone leading-relaxed">
          We sent a confirmation link to <strong className="text-soil">{form.email}</strong>. Click it to activate your account, then come back and sign in.
        </p>
        <Link href="/login" className="inline-block mt-6 text-[13px] font-semibold text-rust hover:underline">Go to sign in →</Link>
      </div>
    )
  }

  return (
    <div className="max-w-[520px] mx-auto px-8 py-16">
      <h1 className="font-serif text-[32px] font-semibold text-soil mb-1">Create an account</h1>
      <p className="text-[14px] text-stone mb-7">One Grano account, any combination of roles — you can add more later.</p>

      {invitedByName && (
        <div className="bg-[#FDF0E8] border border-[#F0DCC8] rounded-lg px-4 py-3 mb-6 text-[13px] text-soil">
          <span className="font-semibold text-rust">{invitedByName}</span> invited you to join Grano — Chicago's local food network.
        </div>
      )}

      <div className="mb-6">
        <label className="text-[12px] font-semibold tracking-wide uppercase text-stone block mb-2">How will you use Grano?</label>
        <div className="flex flex-col gap-2">
          {roleOptions.map(([id, label, blurb]) => (
            <button key={id} type="button" onClick={() => toggleRole(id)}
              className={`text-left px-4 py-3 rounded-lg border-[1.5px] transition-colors ${
                roles.includes(id) ? 'border-rust bg-[#FDF0E8]' : 'border-[#ECEAE4] hover:border-wheat'
              }`}>
              <div className="flex items-center gap-2.5">
                <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                  roles.includes(id) ? 'bg-rust text-white' : 'bg-white border border-[#D9D2C5]'
                }`}>{roles.includes(id) ? '✓' : ''}</span>
                <div>
                  <div className="text-[14px] font-semibold text-soil">I'm a {label}</div>
                  <div className="text-[12px] text-stone">{blurb}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {presets.map(p => (
            <button key={p.label} type="button" onClick={() => setRoles(p.roles)}
              className="text-[11px] font-medium text-stone bg-linen px-2.5 py-1 rounded hover:bg-[#E4E0D5] transition-colors">
              I'm a {p.label} →
            </button>
          ))}
        </div>

        {/* Not a role option above — an organization isn't an account role, same
            distinction the dashboard keeps between account_roles and a business row
            anyone can create. Kept as its own separate button so that stays visually
            clear. */}
        <button type="button" onClick={() => setWantsOrganization(w => !w)}
          className={`w-full text-left px-4 py-3 rounded-lg border-[1.5px] transition-colors mt-2 ${
            wantsOrganization ? 'border-rust bg-[#FDF0E8]' : 'border-[#ECEAE4] hover:border-wheat'
          }`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
              wantsOrganization ? 'bg-rust text-white' : 'bg-white border border-[#D9D2C5]'
            }`}>{wantsOrganization ? '✓' : ''}</span>
            <div>
              <div className="text-[14px] font-semibold text-soil">I also run a farmers market or organization</div>
              <div className="text-[12px] text-stone">A market, food hub, or community organization — a public profile local producers can list under</div>
            </div>
          </div>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Your name</label>
          <input required value={form.fullName} onChange={e => update('fullName', e.target.value)}
            placeholder="Maria Chen"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>

        {roles.includes('restaurant') && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Restaurant / Business</label>
              <input required value={form.restaurantName} onChange={e => update('restaurantName', e.target.value)}
                placeholder="The Publican"
                className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Categories</label>
              <p className="text-[12px] text-stone -mt-0.5 mb-0.5">Select all that apply.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RESTAURANT_BUSINESS_TYPES.map(t => (
                  <label key={t} className="flex items-center gap-2 text-[13px] text-soil cursor-pointer bg-linen rounded-lg px-3 py-2.5">
                    <input type="checkbox" checked={restaurantBusinessTypes.includes(t)} onChange={() => toggleRestaurantBusinessType(t)} className="w-4 h-4 accent-rust" />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {roles.includes('producer') && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Farm / Business name</label>
              <input required value={form.farmName} onChange={e => update('farmName', e.target.value)}
                placeholder="Smith Family Farm"
                className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Location</label>
              <input required value={form.farmLocation} onChange={e => update('farmLocation', e.target.value)}
                placeholder="Elgin, IL"
                className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Categories</label>
              <p className="text-[12px] text-stone -mt-0.5 mb-0.5">Select all that apply.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRODUCER_BUSINESS_TYPES.map(t => (
                  <label key={t} className="flex items-center gap-2 text-[13px] text-soil cursor-pointer bg-linen rounded-lg px-3 py-2.5">
                    <input type="checkbox" checked={producerBusinessTypes.includes(t)} onChange={() => toggleProducerBusinessType(t)} className="w-4 h-4 accent-rust" />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {wantsOrganization && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Farmers market / organization name</label>
            <input required value={form.organizationName} onChange={e => update('organizationName', e.target.value)}
              placeholder="Logan Square Farmers Market"
              className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Email address</label>
          <input type="email" required value={form.email} onChange={e => update('email', e.target.value)}
            placeholder="maria@example.com"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Password</label>
          <input type="password" required minLength={6} value={form.password} onChange={e => update('password', e.target.value)}
            placeholder="At least 6 characters"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>

        <label className="flex items-start gap-2.5 text-[13px] text-soil cursor-pointer">
          <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-rust flex-shrink-0" />
          <span>
            I agree to Grano's{' '}
            <Link href="/terms" target="_blank" className="font-semibold text-rust hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" target="_blank" className="font-semibold text-rust hover:underline">Privacy Policy</Link>.
          </span>
        </label>

        <TurnstileWidget ref={turnstileRef} onToken={setCaptchaToken} />

        {error && <p className="text-[13px] text-rust">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-rust text-white text-[15px] font-bold py-3.5 rounded-xl hover:bg-[#A8521F] transition-colors disabled:opacity-60 mt-2">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-[13px] text-stone text-center mt-6">
        Already have an account? <Link href="/login" className="text-rust font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
