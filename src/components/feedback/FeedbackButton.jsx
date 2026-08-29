'use client'
import { useState, useEffect, useRef } from 'react'
import FeedbackPanel from './FeedbackPanel'

// The persistent, floating entry point — mounted once from the root layout so it's
// present on every logged-in page, dashboard or public (a producer profile, the
// marketplace, anywhere). Only ever rendered when a user is signed in (see
// src/app/layout.jsx). Positioning/overlay chrome lives here; FeedbackPanel itself is
// presentation-only so it can be reused inline elsewhere (QuickPulse, Phase 5).
export default function FeedbackButton({ context }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={rootRef} className="fixed bottom-5 right-5 z-40">
      {open && (
        <div className="absolute bottom-14 right-0 w-[92vw] max-w-[380px] max-h-[80vh] overflow-y-auto bg-white border border-[#ECEAE4] rounded-2xl shadow-lg mb-1">
          <FeedbackPanel context={context} onClose={() => setOpen(false)} />
        </div>
      )}

      <button onClick={() => setOpen(o => !o)} aria-label="Help Improve Grano"
        className="flex items-center gap-2 bg-soil text-white pl-3.5 pr-3.5 sm:pr-4 py-3 sm:py-2.5 rounded-full shadow-lg hover:bg-[#3A3226] transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        <span className="hidden sm:inline text-[13px] font-semibold whitespace-nowrap">Help Improve Grano</span>
      </button>
    </div>
  )
}
