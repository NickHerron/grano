// Structured "Find Us" schedules — every week, every other week, a specific list of
// dates, or free text — plus a human-readable line for the public profile.

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const SCHEDULE_TYPES = [
  ['weekly', 'Every week'],
  ['biweekly', 'Every other week'],
  ['specific_dates', 'Specific dates'],
  ['custom', 'Custom (free text)'],
]

function joinDayNames(days, names) {
  const sorted = [...days].sort((a, b) => a - b)
  return sorted.map(d => names[d]).join(' & ')
}

// Renders the line shown on the public profile. For weekly/biweekly schedules this is
// now the actual upcoming dates the pattern lands on — e.g. "Aug 10, Aug 17, Aug 24,
// Aug 31…" — not a generic "Every Sunday" description, so a producer who's skipped a
// date or set a start/end range never shows a day that isn't really happening. Falls
// back to the legacy free-text `days` field for locations added before structured
// schedules existed.
export function formatScheduleLine(loc) {
  const type = loc.schedule_type || 'custom'

  if (type === 'weekly' || type === 'biweekly') {
    const upcoming = upcomingOccurrences(loc, { count: 5 })
    if (!upcoming.length) return 'No upcoming dates'
    const shown = upcoming.slice(0, 4).map(d => formatShortDate(localDateStr(d)))
    return shown.join(', ') + (upcoming.length > 4 ? '…' : '')
  }
  if (type === 'specific_dates' && loc.schedule_dates?.length) {
    const upcoming = upcomingDates(loc.schedule_dates)
    if (!upcoming.length) return 'No upcoming dates'
    return upcoming.slice(0, 4).map(d => formatShortDate(d)).join(', ') + (upcoming.length > 4 ? '…' : '')
  }
  return loc.days || null
}

export function upcomingDates(dates) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return [...dates]
    .filter(d => new Date(d + 'T00:00:00') >= today)
    .sort((a, b) => a.localeCompare(b))
}

export function formatShortDate(dateString) {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })
}

// Plain local yyyy-mm-dd — matches what <input type="date"> already produces, and
// what the Find Us calendar picker's date cells key off of. Used only for the new
// schedule_exceptions column so "skip this date" always refers to the calendar date
// the producer actually clicked, not a UTC-shifted one.
export function localDateStr(date) {
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Does a weekly/biweekly pattern land on this date, ignoring exceptions? The one
// piece of matching logic every recurring-schedule feature (today badge, next
// occurrence, the Find Us calendar picker) builds on, so they can't drift apart.
export function matchesRecurringPattern(scheduleType, scheduleDays, scheduleAnchorDate, date) {
  const dow = date.getDay()
  if (!scheduleDays?.includes(dow)) return false
  if (scheduleType === 'weekly') return true
  if (scheduleType === 'biweekly') {
    if (!scheduleAnchorDate) return false
    const anchor = new Date(scheduleAnchorDate + 'T00:00:00')
    const cursor = new Date(date); cursor.setHours(0, 0, 0, 0)
    const diffDays = Math.round((cursor - anchor) / 86400000)
    if (diffDays < 0) return false
    return Math.floor(diffDays / 7) % 2 === 0
  }
  return false
}

// A recurring weekly/biweekly schedule defaults to "forever, no end date" — a
// starts_on/ends_on date (or, for locations set up before those existed, the legacy
// seasonal_start/seasonal_end month names) is how a producer says theirs isn't:
// outside that window it doesn't count as happening at all, not just a label next to
// a schedule that's technically active year-round regardless of what it says.
// starts_on/ends_on take priority whenever either is set — they're exact dates, so
// there's no reason to fall back to the coarser month check once a producer has set
// one.
export function inActiveRange(loc, date) {
  if (loc.starts_on || loc.ends_on) {
    const d = localDateStr(date)
    if (loc.starts_on && d < loc.starts_on) return false
    if (loc.ends_on && d > loc.ends_on) return false
    return true
  }

  if (!loc.seasonal_start || !loc.seasonal_end) return true
  const startIdx = MONTH_NAMES.indexOf(loc.seasonal_start) + 1
  const endIdx = MONTH_NAMES.indexOf(loc.seasonal_end) + 1
  if (!startIdx || !endIdx) return true // unrecognized text (legacy free-form) — don't gate on it
  const m = date.getMonth() + 1
  if (startIdx <= endIdx) return m >= startIdx && m <= endIdx
  return m >= startIdx || m <= endIdx // wraps across year end, e.g. Nov - Feb
}

// Same match logic as isScheduledToday, but for an arbitrary date — used to scan
// forward for the next occurrence instead of only checking "today".
function matchesDate(loc, date) {
  const type = loc.schedule_type || 'custom'

  if (type === 'weekly' || type === 'biweekly') {
    if (!inActiveRange(loc, date)) return false
    if (!matchesRecurringPattern(type, loc.schedule_days, loc.schedule_anchor_date, date)) return false
    return !loc.schedule_exceptions?.includes(localDateStr(date))
  }
  if (type === 'specific_dates') {
    const dateStr = date.toISOString().slice(0, 10)
    return Boolean(loc.schedule_dates?.includes(dateStr))
  }
  return false
}

// Scans forward for up to `count` actual dates a weekly/biweekly pattern lands on —
// the real, specific dates a customer would see on the calendar (start/end range and
// skipped exceptions already applied), not just the recurring rule itself.
export function upcomingOccurrences(loc, { count = 4, horizonDays = 180, now = new Date() } = {}) {
  const type = loc.schedule_type || 'custom'
  if (type !== 'weekly' && type !== 'biweekly') return []

  const out = []
  const cursor = new Date(now); cursor.setHours(0, 0, 0, 0)
  for (let i = 0; i <= horizonDays && out.length < count; i++) {
    if (matchesDate(loc, cursor)) out.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

// Is this location "active" today, per its structured schedule? Used to decide
// whether to show a small "Today" badge. Returns false for custom/free-text schedules
// (no way to know without parsing arbitrary text).
export function isScheduledToday(loc, now = new Date()) {
  return matchesDate(loc, now)
}

// Scans forward day-by-day (bounded by horizonDays) for the next date this location
// happens, inclusive of today. Returns null for custom/free-text schedules (nothing
// structured to scan) or if nothing falls within the horizon.
export function nextOccurrence(loc, { horizonDays = 60, now = new Date() } = {}) {
  const type = loc.schedule_type || 'custom'
  if (type === 'custom') return null

  const cursor = new Date(now); cursor.setHours(0, 0, 0, 0)
  for (let i = 0; i <= horizonDays; i++) {
    if (matchesDate(loc, cursor)) return new Date(cursor)
    cursor.setDate(cursor.getDate() + 1)
  }
  return null
}

export function daysUntil(date, now = new Date()) {
  const a = new Date(now); a.setHours(0, 0, 0, 0)
  const b = new Date(date); b.setHours(0, 0, 0, 0)
  return Math.round((b - a) / 86400000)
}
