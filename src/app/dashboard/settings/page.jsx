import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeRoles } from '@/lib/accountRoles'
import ChangePasswordForm from '../profile/ChangePasswordForm'
import AddRoleButtons from '../AddRoleButtons'
import CreateOrganizationForm from '../organization/CreateOrganizationForm'
import FeedbackHistory from './FeedbackHistory'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: profile }, { data: roleRows }, { data: feedbackRows }, { data: organizations }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('account_roles').select('role').eq('user_id', user.id),
    supabase.from('feedback_submissions').select('id, category, message, status, feature, admin_response, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }),
    // An owner can now have more than one organization (Phase 5 of the
    // Person/Organization Multi-Role plan) — no more .maybeSingle().
    supabase.from('organizations').select('id, name').eq('owner_id', user.id).order('created_at', { ascending: true }),
  ])
  const roles = computeRoles(roleRows, profile?.role)
  const missingRoles = ['producer', 'restaurant', 'customer'].filter(r => !roles.has(r))

  return (
    <div className="flex flex-col gap-8 max-w-[520px]">
      <div>
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">Settings</h1>
        <p className="text-[14px] text-stone">Account-level settings — separate from any producer or restaurant profile.</p>
      </div>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">Account</h2>
        <p className="text-[13px] text-stone mb-4">Signed in as {user.email}</p>
      </section>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-4">Security</h2>
        <ChangePasswordForm />
      </section>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-4">Roles</h2>
        <AddRoleButtons missingRoles={missingRoles} />
      </section>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">Organization</h2>
        <p className="text-[13px] text-stone mb-4">Not a role — a public profile for a farmers market, pickup location, food hub, or community organization, separate from any producer or restaurant profile.</p>
        {organizations?.length > 0 ? (
          <Link href="/dashboard/profiles"
            className="inline-block bg-white border border-[#ECEAE4] rounded-xl px-5 py-3 text-[13px] font-semibold text-rust hover:underline w-fit">
            Manage your organization{organizations.length === 1 ? '' : 's'} ({organizations.length}) →
          </Link>
        ) : (
          <CreateOrganizationForm />
        )}
      </section>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">My Feedback</h2>
        <p className="text-[13px] text-stone mb-4">Everything you've sent the Grano team through "Help Improve Grano," and any response.</p>
        <FeedbackHistory submissions={feedbackRows || []} />
      </section>
    </div>
  )
}
