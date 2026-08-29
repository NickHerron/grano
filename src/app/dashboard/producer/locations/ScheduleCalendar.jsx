'use client'
import { useState } from 'react'
import { DAY_ABBR, localDateStr, matchesRecurringPattern, inActiveRange } from '@/lib/schedule'

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * A single-month calendar grid for toggling individual dates on/off.
 *
 * mode="pattern": dates are pre-highlighted by the weekly/biweekly rule (scheduleDays
 *   + scheduleAnchorDate). Clicking a highlighted date marks it as a one-off exception
 *   (skipped) instead of changing the rule itself — click again to un-skip it. Dates
 *   outside the pattern aren't clickable.
 * mode="dates": nothing is pre-highlighted; any date can be clicked to add or remove
 *   it from the explicit list (used for "Specific dates" schedules).
 */
export default function ScheduleCalendar({ mode, scheduleType, scheduleDays = [], scheduleAnchorDate, exceptions = [], dates = [], onToggle, startsOn, endsOn, seasonalStart, seasonalEnd }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const exceptionSet = new Set(exceptions)
  const dateSet = new Set(dates)
  const todayKey = localDateStr(today)

  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const total = daysInMonth(viewYear, viewMonth)
  const leadingBlanks = firstOfMonth.getDay()
  const cells = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: total }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ]

  function goPrev() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) } else { setViewMonth(m => m - 1) }
  }
  function goNext() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) } else { setViewMonth(m => m + 1) }
  }

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={goPrev} className="w-7 h-7 rounded-md text-stone hover:bg-linen transition-colors">‹</button>
        <div className="text-[12px] font-semibold text-soil">
          {firstOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <button type="button" onClick={goNext} className="w-7 h-7 rounded-md text-stone hover:bg-linen transition-colors">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_ABBR.map(d => <div key={d} className="text-center text-[10px] font-semibold text-stone">{d[0]}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} />
          const key = localDateStr(date)
          const isToday = key === todayKey

          if (mode === 'dates') {
            const on = dateSet.has(key)
            return (
              <button key={key} type="button" onClick={() => onToggle(key)}
                className={`h-8 rounded-md text-[11px] font-semibold transition-colors ${
                  on ? 'bg-rust text-white' : 'bg-linen text-soil hover:bg-[#E4E0D5]'
                } ${isToday ? 'ring-1 ring-rust' : ''}`}>
                {date.getDate()}
              </button>
            )
          }

          const inPattern = matchesRecurringPattern(scheduleType, scheduleDays, scheduleAnchorDate, date)
            && inActiveRange({ starts_on: startsOn, ends_on: endsOn, seasonal_start: seasonalStart, seasonal_end: seasonalEnd }, date)
          if (!inPattern) {
            return (
              <div key={key} className={`h-8 rounded-md text-[11px] flex items-center justify-center text-[#D9D2C5] ${isToday ? 'ring-1 ring-[#ECEAE4]' : ''}`}>
                {date.getDate()}
              </div>
            )
          }
          const skipped = exceptionSet.has(key)
          return (
            <button key={key} type="button" onClick={() => onToggle(key)}
              title={skipped ? 'Skipped — click to include again' : 'Click to skip this date'}
              className={`h-8 rounded-md text-[11px] font-semibold transition-colors ${
                skipped ? 'bg-white text-[#C0A090] line-through border border-dashed border-[#E4D9CE]' : 'bg-sage text-white'
              } ${isToday ? 'ring-1 ring-rust' : ''}`}>
              {date.getDate()}
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-stone mt-2">
        {mode === 'dates' ? 'Click a date to add or remove it.' : 'Highlighted dates match your schedule — click one to skip it.'}
      </p>
    </div>
  )
}
