'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function formatTimeLabel(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const displayHour = h % 12 === 0 ? 12 : h % 12
  return `${displayHour}:${String(m).padStart(2, '0')} ${period}`
}

// Turns an accepted event-booking inquiry into a real public "Find Us" entry — same
// farm_locations table and insert shape LocationsManager.jsx already uses (location_
// type='event', schedule_type='specific_dates'), just pre-filled from the inquiry's
// own event fields instead of a blank form. Only offered to the business being
// booked (farms are the only side with a Find Us list), and only once — farm_
// location_id being already set means it's done.
export default function AddToFindUsPrompt({ inquiryId, farmId, inquiry }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState(inquiry.subject || inquiry.event_type || 'Event')
  const [address, setAddress] = useState(inquiry.event_location || '')
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!inquiry.desired_date) {
      setError('This inquiry has no event date to add.')
      return
    }
    setSaving(true)
    setError('')

    const hours = (inquiry.event_start_time && inquiry.event_end_time)
      ? `${formatTimeLabel(inquiry.event_start_time)} – ${formatTimeLabel(inquiry.event_end_time)}`
      : null

    const { data: location, error: insertError } = await supabase.from('farm_locations').insert({
      farm_id: farmId,
      name: name.trim() || 'Event',
      location_type: 'event',
      address: address.trim() || null,
      hours,
      schedule_type: 'specific_dates',
      schedule_dates: [inquiry.desired_date],
    }).select().single()

    if (insertError) {
      setSaving(false)
      setError(insertError.message)
      return
    }

    await supabase.from('work_inquiries').update({ farm_location_id: location.id }).eq('id', inquiryId)

    setSaving(false)
    setDone(true)
    router.refresh()
  }

  if (done || inquiry.farm_location_id) {
    return (
      <div className="bg-[#EBF3EC] border border-sage/30 rounded-xl p-4">
        <p className="text-[13px] font-semibold text-sage">Added to Where to Find Us.</p>
      </div>
    )
  }

  return (
    <div className="bg-linen rounded-xl p-5">
      {!open ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[14px] font-semibold text-soil mb-0.5">Add this event to Where to Find Us?</div>
            <p className="text-[12px] text-stone">Let customers know they can find you here.</p>
          </div>
          <button type="button" onClick={() => setOpen(true)}
            className="flex-shrink-0 bg-rust text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-[#A8521F] transition-colors whitespace-nowrap">
            Add to Find Us
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Event name"
            className="bg-white border border-transparent rounded-lg px-3 py-2.5 text-[13px] text-soil outline-none focus:border-wheat transition-colors" />
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address (optional)"
            className="bg-white border border-transparent rounded-lg px-3 py-2.5 text-[13px] text-soil outline-none focus:border-wheat transition-colors" />
          {error && <p className="text-[12px] text-rust">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="bg-rust text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-50">
              {saving ? 'Adding…' : 'Add to Find Us'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-[12px] text-stone hover:text-soil transition-colors">Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}
