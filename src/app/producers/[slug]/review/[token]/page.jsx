import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import InviteReviewForm from './InviteReviewForm'

export const metadata = { title: 'Leave a review | Grano' }

export default async function InviteReviewPage({ params }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: invite } = await supabase.rpc('get_review_invite_public', { p_token: params.token }).maybeSingle()

  if (!invite || invite.farm_slug !== params.slug) {
    return (
      <div className="max-w-[520px] mx-auto px-6 py-24 text-center">
        <h1 className="font-serif text-[26px] font-semibold text-soil mb-2">This review link isn't valid</h1>
        <p className="text-[14px] text-stone mb-6">It may have been mistyped, or the producer removed it.</p>
        <Link href="/" className="inline-block bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">← Back to Grano</Link>
      </div>
    )
  }

  if (invite.status === 'used') {
    return (
      <div className="max-w-[520px] mx-auto px-6 py-24 text-center">
        <h1 className="font-serif text-[26px] font-semibold text-soil mb-2">This review has already been submitted</h1>
        <p className="text-[14px] text-stone mb-6">Thanks for reviewing {invite.farm_name} — this link can only be used once.</p>
        <Link href={`/producers/${invite.farm_slug}`} className="inline-block bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">
          View {invite.farm_name}'s profile →
        </Link>
      </div>
    )
  }

  if (invite.status === 'revoked') {
    return (
      <div className="max-w-[520px] mx-auto px-6 py-24 text-center">
        <h1 className="font-serif text-[26px] font-semibold text-soil mb-2">This review link is no longer active</h1>
        <Link href="/" className="inline-block bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">← Back to Grano</Link>
      </div>
    )
  }

  return (
    <div className="max-w-[520px] mx-auto px-6 py-16 sm:py-24">
      <div className="text-center mb-8">
        <div className="font-mono text-[10px] tracking-[.2em] uppercase text-rust mb-3">You're invited to review</div>
        <h1 className="font-serif text-[28px] sm:text-[32px] font-semibold text-soil mb-2">{invite.farm_name}</h1>
        <p className="text-[14px] text-stone">
          {invite.customer_name}, {invite.farm_name} asked us to send you this link so you can share how it went.
        </p>
      </div>

      {!user ? (
        <div className="bg-linen rounded-xl p-6 text-center">
          <p className="text-[14px] text-stone mb-4">Sign in or create a free Grano account to leave your review.</p>
          <Link href={`/login?next=/producers/${invite.farm_slug}/review/${params.token}`}
            className="inline-block bg-rust text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors">
            Sign in →
          </Link>
        </div>
      ) : (
        <InviteReviewForm token={params.token} slug={invite.farm_slug} />
      )}
    </div>
  )
}
