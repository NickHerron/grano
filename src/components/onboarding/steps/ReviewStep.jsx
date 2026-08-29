'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import WizardShell from '@/components/onboarding/WizardShell'
import QuickPulse from '@/components/feedback/QuickPulse'
import { previousDestination } from '@/lib/onboardingProgress'

// Deliberately not a second renderer — this links straight to the real, already-live
// public profile (per the confirmed "stays live throughout" decision) instead of
// rendering a preview clone of RealProducerProfile.jsx with a parallel data-fetch.
// Publishing is a milestone flag only; nothing here ever gated public visibility.
export default function ReviewStep({ farm, recommendations }) {
  const router = useRouter()
  const supabase = createClient()
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(farm.onboarding_status === 'published')
  const [error, setError] = useState('')
  // Separate from `published` on purpose — `published` is also true on a revisit to an
  // already-published profile (initialized from farm.onboarding_status), and the
  // feedback prompt should only fire the moment publishing actually happens, not every
  // time this step re-renders in the published state.
  const [justPublished, setJustPublished] = useState(false)

  async function handlePublish() {
    setPublishing(true)
    setError('')
    const completed = new Set(farm.onboarding_completed_steps || [])
    completed.add('review')
    const { error: dbError } = await supabase.from('farms').update({
      onboarding_status: 'published',
      onboarding_published_at: farm.onboarding_published_at || new Date().toISOString(),
      onboarding_step: null,
      onboarding_completed_steps: [...completed],
    }).eq('id', farm.id)
    setPublishing(false)
    if (dbError) { setError(dbError.message); return }
    setPublished(true)
    setJustPublished(true)
  }

  const remaining = recommendations.filter(r => !r.done)

  return (
    <WizardShell
      stepKey="review"
      title="Review your profile"
      subtitle="Your profile has already been live this whole time — this is just a moment to look it over."
      explain="Publishing isn't a gate, it's a milestone. Your profile has been visible to shoppers and restaurants since you signed up — marking it published just tells Grano you're done setting up for now."
      onBack={() => router.push(previousDestination('review'))}
      error={error}
    >
      <div className="flex flex-col gap-6">
        <a href={`/producers/${farm.slug}`} target="_blank" rel="noopener noreferrer"
          className="block bg-linen rounded-xl p-5 hover:bg-[#E4E0D5] transition-colors">
          <div className="text-[14px] font-semibold text-rust mb-1">View your public profile →</div>
          <div className="text-[12px] text-stone">Opens in a new tab — see exactly what buyers and restaurants see.</div>
        </a>

        {remaining.length > 0 ? (
          <div>
            <div className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-2">A few things that could help</div>
            <div className="flex flex-col gap-2">
              {remaining.map(r => (
                <Link key={r.key} href={`/onboarding/${r.stepKey}`}
                  className="flex items-center justify-between gap-3 bg-white border border-[#ECEAE4] rounded-lg px-4 py-3 hover:border-rust transition-colors">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-soil">{r.label}</div>
                    <div className="text-[12px] text-stone">{r.why}</div>
                  </div>
                  <span className="text-[12px] font-semibold text-rust flex-shrink-0">Add →</span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[13px] font-medium text-sage">Everything's filled in — nice work.</p>
        )}

        {published ? (
          <div className="flex flex-col gap-4">
            <div className="bg-[#EBF3EC] border-[1.5px] border-sage rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[14px] font-semibold text-sage">Published</div>
                <div className="text-[12px] text-stone">Your profile is marked complete. You can keep editing anytime.</div>
              </div>
              <Link href="/dashboard" className="text-[13px] font-semibold text-rust hover:underline whitespace-nowrap">Go to dashboard →</Link>
            </div>

            {justPublished && (
              <QuickPulse
                question="Before you go — does your Grano profile represent your business the way you want it to?"
                options={[['Yes', 'positive', true], ['Not quite', 'confusing_ux', false]]}
                context={{ accountType: 'producer', businessKind: 'farm', businessId: farm.id, businessType: farm.producer_type }}
              />
            )}
          </div>
        ) : (
          <button type="button" onClick={handlePublish} disabled={publishing}
            className="self-start bg-rust text-white text-[15px] font-bold px-6 py-3 rounded-xl hover:bg-[#A8521F] transition-colors disabled:opacity-60">
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        )}
      </div>
    </WizardShell>
  )
}
