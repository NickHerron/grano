'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '@/lib/feedbackLabels'

// Query-string-driven filtering (?category=&priority=&status=&account_type=&
// business_kind=&feature=&since=) — same idiom SectionTabs.jsx uses for tab state, so
// a filtered view is linkable/shareable. Plain native <select>s, submit-on-change; no
// client state beyond what's already in the URL.
const SINCE_OPTIONS = [
  ['', 'All time'],
  ['today', 'Today'],
  ['week', 'This week'],
  ['month', 'This month'],
]

export default function FeedbackFilters({ features, accountTypes }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function update(key, value) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  const selectClass = "text-[12px] font-semibold bg-linen border border-transparent rounded-md px-2.5 py-1.5 outline-none focus:border-wheat"

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <select className={selectClass} value={searchParams.get('status') || ''} onChange={e => update('status', e.target.value)}>
        <option value="">All statuses</option>
        {Object.entries(STATUS_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
      </select>
      <select className={selectClass} value={searchParams.get('category') || ''} onChange={e => update('category', e.target.value)}>
        <option value="">All categories</option>
        {Object.entries(CATEGORY_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
      </select>
      <select className={selectClass} value={searchParams.get('priority') || ''} onChange={e => update('priority', e.target.value)}>
        <option value="">All priorities</option>
        {Object.entries(PRIORITY_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
      </select>
      <select className={selectClass} value={searchParams.get('account_type') || ''} onChange={e => update('account_type', e.target.value)}>
        <option value="">All account types</option>
        {accountTypes.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <select className={selectClass} value={searchParams.get('business_kind') || ''} onChange={e => update('business_kind', e.target.value)}>
        <option value="">Farm + Restaurant</option>
        <option value="farm">Farm</option>
        <option value="restaurant">Restaurant</option>
      </select>
      <select className={selectClass} value={searchParams.get('feature') || ''} onChange={e => update('feature', e.target.value)}>
        <option value="">All features</option>
        {features.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
      <select className={selectClass} value={searchParams.get('since') || ''} onChange={e => update('since', e.target.value)}>
        {SINCE_OPTIONS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
      </select>
    </div>
  )
}
