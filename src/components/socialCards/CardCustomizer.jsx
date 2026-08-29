'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const FORMATS = [
  ['square', 'Square'],
  ['portrait', 'Portrait'],
  ['story', 'Story'],
]

// The live preview is literally an <img> pointed at the same endpoint that produces
// the final download/share — same params in, same bytes out, so preview and export
// can never drift into two different code paths. Debounced ~300ms so rapid toggle-
// flipping doesn't flood the endpoint or flash between in-flight responses.
export default function CardCustomizer({ business, businessType, card, productsWithSources, onBack }) {
  const supabase = createClient()
  const [format, setFormat] = useState('square')
  const [showQr, setShowQr] = useState(true)
  const [productId, setProductId] = useState(productsWithSources?.[0]?.id || '')
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const loggedGenerated = useRef(false)

  const isProductStory = card.key === 'product_story'

  const url = useMemo(() => {
    const params = new URLSearchParams({
      type: card.key, format, businessType, businessId: business.id, showQr: String(showQr),
    })
    if (isProductStory && productId) params.set('productId', productId)
    return `/api/social-card?${params.toString()}`
  }, [card.key, format, businessType, business.id, showQr, isProductStory, productId])

  useEffect(() => {
    if (isProductStory && !productId) return
    setLoading(true)
    const t = setTimeout(() => setPreviewUrl(url), 300)
    return () => clearTimeout(t)
  }, [url, isProductStory, productId])

  async function logEvent(eventType) {
    await supabase.from('social_card_events').insert({
      business_type: businessType, business_id: business.id, card_type: card.key,
      format, event_type: eventType, product_id: isProductStory ? productId : null,
    })
  }

  function handlePreviewLoaded() {
    setLoading(false)
    // Only the first successful render of a card-selection session counts as
    // "generated" — every toggle re-render would otherwise spam duplicate rows for
    // what's really one browsing session.
    if (!loggedGenerated.current) {
      loggedGenerated.current = true
      logEvent('generated')
    }
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(previewUrl)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${business.slug}-${card.key}-${format}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      logEvent('downloaded')
    } finally {
      setDownloading(false)
    }
  }

  async function handleShare() {
    setSharing(true)
    try {
      const res = await fetch(previewUrl)
      const blob = await res.blob()
      const file = new File([blob], `${business.slug}-${card.key}.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: business.name })
        logEvent('shared')
      } else {
        await handleDownload()
      }
    } catch {
      // user cancelled the native share sheet — no-op
    } finally {
      setSharing(false)
    }
  }

  async function handleCopyLink() {
    const path = businessType === 'farm' ? `/producers/${business.slug}` : `/restaurants/${business.slug}`
    await navigator.clipboard.writeText(`${window.location.origin}${path}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div>
      <button onClick={onBack} className="text-[13px] font-semibold text-stone hover:text-soil mb-6">← Back to Your Stories</button>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-8">
        <div className="flex justify-center">
          <div className="bg-linen rounded-xl overflow-hidden w-full flex items-center justify-center" style={{ maxWidth: 360 }}>
            {isProductStory && !productId ? (
              <div className="py-24 text-center text-[13px] text-stone px-6">Pick a product to preview its card.</div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={previewUrl} src={previewUrl} alt="" className="w-full h-auto block"
                style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s' }}
                onLoad={handlePreviewLoaded} />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <div className="font-serif text-[18px] font-semibold text-soil mb-1">{card.label}</div>
            <div className="text-[13px] text-stone">{card.why}</div>
          </div>

          {isProductStory && (
            <div>
              <label className="text-[12px] font-semibold tracking-wide uppercase text-stone block mb-1.5">Product</label>
              <select value={productId} onChange={e => { loggedGenerated.current = false; setProductId(e.target.value) }}
                className="bg-linen border border-transparent rounded-lg px-3 py-2.5 text-[13px] text-soil outline-none focus:border-wheat w-full">
                {productsWithSources.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone block mb-1.5">Format</label>
            <div className="flex gap-2">
              {FORMATS.map(([key, label]) => (
                <button key={key} onClick={() => setFormat(key)}
                  className={`text-[13px] font-semibold px-3.5 py-2 rounded-lg transition-colors ${
                    format === key ? 'bg-rust text-white' : 'bg-linen text-stone hover:text-soil'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[13px] text-soil cursor-pointer">
              <input type="checkbox" checked={showQr} onChange={e => setShowQr(e.target.checked)} className="w-4 h-4 accent-rust" />
              Show QR code
            </label>
          </div>

          <div className="flex flex-col gap-2.5 mt-2">
            <button onClick={handleDownload} disabled={downloading || !previewUrl}
              className="bg-rust text-white text-[14px] font-bold px-5 py-3 rounded-xl hover:bg-[#A8521F] transition-colors disabled:opacity-60">
              {downloading ? 'Preparing…' : 'Download Image'}
            </button>
            <button onClick={handleShare} disabled={sharing || !previewUrl}
              className="bg-soil text-white text-[14px] font-semibold px-5 py-3 rounded-xl hover:bg-[#3A3226] transition-colors disabled:opacity-60">
              {sharing ? 'Sharing…' : 'Share'}
            </button>
            <button onClick={handleCopyLink} className="text-[13px] font-semibold text-stone hover:text-soil transition-colors">
              {copied ? 'Link copied' : 'Copy Profile Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
