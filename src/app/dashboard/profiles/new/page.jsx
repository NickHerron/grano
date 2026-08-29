import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateProfileWizard from './CreateProfileWizard'

// Phase 7 of the Person/Organization Multi-Role plan — the "What are you creating?"
// entry point. Deliberately separate from /signup (see the plan's architecture
// decisions: signup's role checkboxes are account permissions; this is a different,
// later step — creating a profile once an account already exists).
export default async function NewProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">Create a Profile</h1>
        <p className="text-[14px] text-stone">One Grano account, any number of profiles — a business, market, or organization takes about two minutes to get started.</p>
      </div>
      <CreateProfileWizard />
    </div>
  )
}
