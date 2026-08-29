'use client'
import { useState } from 'react'

export default function ShareButton({ title, text, className }) {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <button onClick={handleClick} className={className}>
      {copied ? 'Link copied' : 'Share'}
    </button>
  )
}
