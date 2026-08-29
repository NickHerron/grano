'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Groups several setup sections (basic info, photos, locations, etc.) behind one
// page with internal tabs instead of a separate top-level nav item each — this is
// what keeps the dashboard nav from turning into a wall of links as a profile grows
// more sections over time. Reads/writes ?tab= so a link like
// /dashboard/profile?section=producer&tab=documents can jump straight to a section.
export default function SectionTabs({ tabs, paramName = 'tab' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requested = searchParams.get(paramName)
  const initial = tabs.some(t => t.key === requested) ? requested : tabs[0]?.key
  const [active, setActive] = useState(initial)

  function selectTab(key) {
    setActive(key)
    const params = new URLSearchParams(searchParams.toString())
    params.set(paramName, key)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const activeTab = tabs.find(t => t.key === active) || tabs[0]

  return (
    <div>
      <div className="flex gap-1 border-b border-[#ECEAE4] mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map(t => (
          <button key={t.key} type="button" onClick={() => selectTab(t.key)}
            className={`text-[13px] font-semibold px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${
              active === t.key ? 'text-rust border-rust' : 'text-stone border-transparent hover:text-soil'
            }`}>
            {t.label}
            {Boolean(t.badge) && (
              <span className="text-[10px] font-bold bg-rust text-white rounded-full w-4 h-4 flex items-center justify-center">{t.badge}</span>
            )}
          </button>
        ))}
      </div>
      {activeTab?.content}
    </div>
  )
}
