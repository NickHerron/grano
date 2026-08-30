'use client'
import { useState } from 'react'

export default function ProfileShareMenu({ name, slug }) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.href : `https://grano.network/producers/${slug}`
  const text = `Find ${name} on Grano`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard unavailable */ }
  }

  const ig = `https://www.instagram.com/`
  const sms = `sms:?&body=${encodeURIComponent(`${text} ${url}`)}`
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} className="text-[13px] text-stone hover:text-soil">
        Share profile
      </button>
      {open && (
        <div className="absolute z-20 mt-2 right-0 bg-white border border-[#ECEAE4] rounded-xl shadow-md py-2 min-w-[160px]">
          <button type="button" onClick={copyLink} className="block w-full text-left px-4 py-2 text-[13px] text-soil hover:bg-linen">
            {copied ? 'Link copied' : 'Copy link'}
          </button>
          <a href={ig} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-[13px] text-soil hover:bg-linen">Instagram</a>
          <a href={sms} className="block px-4 py-2 text-[13px] text-soil hover:bg-linen">Text</a>
          <a href={fb} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-[13px] text-soil hover:bg-linen">Facebook</a>
        </div>
      )}
    </div>
  )
}
