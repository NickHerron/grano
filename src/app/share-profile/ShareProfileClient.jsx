'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ShareProfileClient({ name, slug, neighborhood }) {
  const [copied, setCopied] = useState(false)
  const url = `https://grano.network/producers/${slug}`
  const text = `Find us on Grano. ${name} is on Chicago’s local food network.`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard unavailable */ }
  }

  const sms = `sms:?&body=${encodeURIComponent(`${text} ${url}`)}`
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  const ghost = 'text-center text-[15px] font-semibold text-stone border border-hair px-4 py-2.5 rounded-btn hover:text-ink'
  const outline = 'text-center text-[15px] font-semibold text-ink border border-ink px-4 py-2.5 rounded-btn hover:bg-paper'

  return (
    <div className="max-w-[560px] mx-auto px-4 py-16 sm:py-24">
      <div className="bg-card border border-hair rounded-panel p-8 sm:p-10">
        <h1 className="font-serif text-[32px] font-medium text-ink mb-3">Share your Grano profile</h1>
        <p className="text-[15px] text-stone leading-relaxed mb-4">
          Find us on Grano. Your page is live — send the link to customers, markets, and buyers.
        </p>
        <p className="text-[12px] text-stone mb-3">{[name, neighborhood].filter(Boolean).join(' · ')}</p>
        <div className="flex gap-2 mb-5">
          <input readOnly value={url} className="flex-1 bg-card rounded-btn border border-hair px-3 py-2.5 text-[13px] text-ink" />
          <button type="button" onClick={copyLink} className="bg-forest text-paper text-[15px] font-semibold px-4 py-2.5 rounded-btn whitespace-nowrap hover:bg-forest-hover">
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={outline}>Instagram</a>
          <a href={sms} className={outline}>Text</a>
          <a href={fb} target="_blank" rel="noopener noreferrer" className={ghost}>Facebook</a>
          <Link href={`/producers/${slug}`} className={ghost}>View profile</Link>
        </div>
      </div>
    </div>
  )
}
