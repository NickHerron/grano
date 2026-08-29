'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { slugify } from '@/lib/slugify'

const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31]
const daysBeforeMonth = daysInMonth.reduce((acc, d, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + daysInMonth[i - 1])
  return acc
}, [])

function dateToFraction({ month, day }) {
  return (daysBeforeMonth[month - 1] + (day - 1)) / 365
}

const barColors = ['bg-sage', 'bg-wheat', 'bg-rust', 'bg-[#8A6B1C]', 'bg-[#6B8F8F]', 'bg-[#A0708C]']

/**
 * @param windows       full list of { name, start:{month,day}, end:{month,day} }
 * @param monthRange    contiguous array of month indices (0-11) to display; defaults to all 12
 * @param compact       smaller rows/text, and caps how many bars show (rest are just left off)
 * @param maxRows       hard cap on visible rows in compact mode
 */
export default function SeasonalCalendar({ windows, monthRange, compact = false, maxRows = 7 }) {
  const now = new Date()
  const months = monthRange || monthLabels.map((_, i) => i)
  const widthPx = compact ? 420 : 720

  // The label-fits-in-bar math below needs real pixel widths, but the row div only
  // has a *minimum* width (it stretches to fill whatever container it's in) — on a
  // wide desktop screen that's much wider than this assumed constant, so bars appear
  // to have more room than the math accounts for and labels get positioned as if the
  // bar were still 720px wide. Measure the actual rendered width post-mount (SSR-safe:
  // starts equal to widthPx so server and client agree on the first paint, matching
  // the pattern used elsewhere in the app for other post-mount-only measurements) and
  // keep it in sync with a ResizeObserver so window resizes stay correct too.
  const containerRef = useRef(null)
  const [measuredWidth, setMeasuredWidth] = useState(widthPx)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setMeasuredWidth(el.offsetWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const rangeStart = dateToFraction({ month: months[0] + 1, day: 1 })
  const lastMonth = months[months.length - 1]
  const rangeEnd = dateToFraction({ month: lastMonth + 1, day: 1 }) + daysInMonth[lastMonth] / 365
  const span = rangeEnd - rangeStart

  const todayFraction = dateToFraction({ month: now.getMonth() + 1, day: now.getDate() })
  const todayInRange = todayFraction >= rangeStart && todayFraction <= rangeEnd

  const visibleWindows = windows
    .map((w, i) => ({ ...w, colorIndex: i }))
    .filter(w => dateToFraction(w.start) < rangeEnd && dateToFraction(w.end) + 1 / 365 > rangeStart)

  const ordered = compact
    ? [...visibleWindows].sort((a, b) => {
        const aActive = todayFraction >= dateToFraction(a.start) && todayFraction <= dateToFraction(a.end) + 1 / 365
        const bActive = todayFraction >= dateToFraction(b.start) && todayFraction <= dateToFraction(b.end) + 1 / 365
        if (aActive !== bActive) return aActive ? -1 : 1
        return dateToFraction(a.start) - dateToFraction(b.start)
      }).slice(0, maxRows)
    : visibleWindows

  const rowHeight = compact ? 'h-7' : 'h-9'
  const barHeight = compact ? 'h-5' : 'h-6'
  const textSize = compact ? 'text-[10px]' : 'text-[11px]'

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <div ref={containerRef} style={{ minWidth: widthPx }}>

          {/* MONTH HEADER */}
          <div className="grid border-b border-[#ECEAE4]" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0,1fr))` }}>
            {months.map(mi => (
              <div key={mi}
                className={`px-2 py-2 text-center font-mono text-[10px] tracking-widest uppercase border-l border-[#F0EDE7] first:border-l-0 ${
                  mi === now.getMonth() ? 'text-rust font-semibold' : 'text-stone'
                }`}>
                {monthLabels[mi]}
              </div>
            ))}
          </div>

          {/* ROWS */}
          <div className="relative">
            {/* month gridlines */}
            <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0,1fr))` }}>
              {months.map(mi => (
                <div key={mi} className="border-l border-[#F5F3EE] first:border-l-0" />
              ))}
            </div>

            {/* today marker */}
            {todayInRange && (
              <div
                className="absolute top-0 bottom-0 w-px bg-rust z-10 pointer-events-none"
                style={{ left: `${((todayFraction - rangeStart) / span) * 100}%` }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rust absolute -top-0.5 -translate-x-1/2" />
              </div>
            )}

            {ordered.length === 0 && (
              <div className="px-4 py-6 text-[13px] text-stone">Nothing in season this window.</div>
            )}

            {ordered.map(w => {
              const rawStart = dateToFraction(w.start)
              const rawEnd = dateToFraction(w.end) + 1 / 365
              const start = Math.max(rawStart, rangeStart)
              const end = Math.min(rawEnd, rangeEnd)
              const left = ((start - rangeStart) / span) * 100
              const width = ((end - start) / span) * 100
              const isActive = todayFraction >= rawStart && todayFraction <= rawEnd
              const color = barColors[w.colorIndex % barColors.length]
              const barPx = (width / 100) * measuredWidth
              const leftPx = (left / 100) * measuredWidth
              const labelPx = w.name.length * (compact ? 5.8 : 6.5) + 6
              const labelFits = barPx >= labelPx + 18

              // when the pill's too small for its own label, put the label outside it —
              // to the right if there's room, otherwise flip to the left so it never runs off the edge
              const roomOnRight = measuredWidth - (leftPx + barPx) >= labelPx + 8
              const side = roomOnRight ? 'right' : 'left'

              return (
                <Link key={w.name} href={`/seasonal/${slugify(w.name)}`}
                  className={`relative ${rowHeight} border-b border-[#F5F3EE] last:border-b-0 flex items-center hover:bg-[#FAFAF8] transition-colors`}>
                  <div
                    className={`absolute ${barHeight} rounded-full flex items-center ${labelFits ? 'px-2.5 overflow-hidden' : 'justify-center'} ${color} ${isActive ? 'ring-2 ring-offset-1 ring-rust/50' : ''}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={w.name}
                  >
                    {labelFits && <span className={`${textSize} font-semibold text-white truncate whitespace-nowrap`}>{w.name}</span>}
                  </div>
                  {!labelFits && (
                    <span
                      className={`absolute ${textSize} font-semibold text-soil whitespace-nowrap ${side === 'left' ? 'text-right' : ''}`}
                      style={
                        side === 'right'
                          ? { left: `calc(${left}% + ${barPx}px + 8px)` }
                          : { right: `calc(100% - ${left}% + 8px)` }
                      }
                    >
                      {w.name}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
