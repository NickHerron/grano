import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeRoles } from '@/lib/accountRoles'

// Deliberately minimal chrome — no dashboard sidebar/tabs, just enough to orient and
// a way out. The wizard is a focused, linear flow; the full dashboard nav would only
// invite hopping away mid-step. "Save & exit" is honest about what it does: every
// step already saves itself on Continue/Skip, so leaving loses nothing.
export default async function OnboardingLayout({ children }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/onboarding')

  const [{ data: roleRows }, { data: profile }, { data: farm }] = await Promise.all([
    supabase.from('account_roles').select('role').eq('user_id', user.id),
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    supabase.from('farms').select('id').eq('owner_id', user.id).maybeSingle(),
  ])
  const roles = computeRoles(roleRows, profile?.role)

  // Producer/Vendor only, per scope — and a farm row has to exist to have anything to
  // onboard (every producer signup creates one; this only guards a stray edge case).
  if (!roles.has('producer') && !roles.has('admin')) redirect('/dashboard')
  if (!farm) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="border-b border-[#ECEAE4] px-4 sm:px-8 py-4">
        <div className="max-w-[640px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-serif text-[20px] text-soil">grano<span className="text-rust">.</span></Link>
          <Link href="/dashboard" className="text-[13px] font-semibold text-stone hover:text-soil transition-colors">
            Save &amp; exit
          </Link>
        </div>
      </div>
      <div className="max-w-[640px] mx-auto px-4 sm:px-8 py-10">
        {children}
      </div>
    </div>
  )
}
