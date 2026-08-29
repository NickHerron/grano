import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FeedbackFilters from './FeedbackFilters'
import FeedbackRow from './FeedbackRow'

// Same admin gate as the main admin page (src/app/dashboard/admin/page.jsx) — checks
// profiles.role directly, mirroring is_admin()'s own definition rather than calling it
// via RPC. Its own page (not a section on the flat admin page) since feedback needs six
// filter dimensions — squeezing that into the single-page/section convention used for
// Marketplace/Accounts/Farms/etc. would crowd a page that's already long.
function since(param) {
  const now = new Date()
  if (param === 'today') { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString() }
  if (param === 'week') { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString() }
  if (param === 'month') { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString() }
  return null
}

export default async function AdminFeedbackPage({ searchParams }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (myProfile?.role !== 'admin') redirect('/dashboard')

  let query = supabase.from('feedback_submissions')
    .select('*, sender:profiles!feedback_submissions_user_id_fkey(full_name, restaurant_name), feedback_attachments(storage_path)')
    .order('created_at', { ascending: false })

  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.category) query = query.eq('category', searchParams.category)
  if (searchParams.priority) query = query.eq('priority', searchParams.priority)
  if (searchParams.account_type) query = query.eq('account_type', searchParams.account_type)
  if (searchParams.business_kind) query = query.eq('business_kind', searchParams.business_kind)
  if (searchParams.feature) query = query.eq('feature', searchParams.feature)
  const sinceIso = since(searchParams.since)
  if (sinceIso) query = query.gte('created_at', sinceIso)

  const { data: rows, error } = await query

  // Filter option lists come from the live data itself rather than a second hardcoded
  // copy of featureMap.js's route list — a feature only shows as a filter once
  // someone's actually sent feedback about it.
  const { data: allRows } = await supabase.from('feedback_submissions').select('feature, account_type')
  const features = [...new Set((allRows || []).map(r => r.feature).filter(Boolean))].sort()
  const accountTypes = [...new Set((allRows || []).map(r => r.account_type).filter(Boolean))].sort()

  const items = (rows || []).map(r => ({
    ...r,
    sender_name: r.sender?.restaurant_name || r.sender?.full_name || null,
    attachment_path: r.feedback_attachments?.[0]?.storage_path || null,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">Feedback</h1>
          <p className="text-[14px] text-stone">{items.length} submission{items.length === 1 ? '' : 's'}{Object.keys(searchParams).length ? ' matching these filters' : ''}.</p>
        </div>
        <Link href="/dashboard/admin" className="text-[13px] font-semibold text-rust hover:underline">← Admin Panel</Link>
      </div>

      <FeedbackFilters features={features} accountTypes={accountTypes} />

      <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
        {error && <div className="px-5 py-6 text-[13px] text-rust">{error.message}</div>}
        {items.length ? items.map(row => <FeedbackRow key={row.id} row={row} />) : (
          <div className="px-5 py-10 text-center text-[13px] text-stone">Nothing matches these filters.</div>
        )}
      </div>
    </div>
  )
}
