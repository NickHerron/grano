import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/feedbackLabels'
import { formatDate } from '@/lib/formatDate'

// Read-only history — feedback_submissions has no owner-update RLS policy at all (see
// schema_feedback.sql), so there's nothing here to edit, only to review. `admin_response`
// shows if an admin has written one; `admin_notes` is deliberately never selected/shown
// (private, per the spec: "Do not expose internal notes").
const STATUS_COLORS = {
  received: 'bg-linen text-stone',
  reviewing: 'bg-[#FDF0E8] text-rust',
  planned: 'bg-[#FDF0E8] text-rust',
  in_development: 'bg-[#EBF3EC] text-sage',
  completed: 'bg-[#EBF3EC] text-sage',
}

export default function FeedbackHistory({ submissions }) {
  if (!submissions.length) {
    return <p className="text-[13px] text-stone">Nothing sent yet — look for the "Help Improve Grano" button anywhere on the site.</p>
  }

  return (
    <div className="flex flex-col gap-2.5">
      {submissions.map(s => (
        <div key={s.id} className="bg-white border border-[#ECEAE4] rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-linen text-stone">
                {CATEGORY_LABELS[s.category] || s.category}
              </span>
              {s.feature && <span className="text-[11px] text-stone">{s.feature}</span>}
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded flex-shrink-0 ${STATUS_COLORS[s.status] || 'bg-linen text-stone'}`}>
              {STATUS_LABELS[s.status] || s.status}
            </span>
          </div>
          <p className="text-[13px] text-soil leading-relaxed">{s.message}</p>
          <div className="text-[11px] text-stone mt-1.5">{formatDate(s.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          {s.admin_response && (
            <div className="mt-3 bg-linen rounded-lg p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-stone mb-1">From the Grano team</div>
              <p className="text-[13px] text-soil leading-relaxed">{s.admin_response}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
