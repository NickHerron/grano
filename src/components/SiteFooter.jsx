'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SiteFooter() {
  const path = usePathname() || ''
  const quiet = path.startsWith('/dashboard') || path.startsWith('/onboarding') || path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/share-profile')
  const espresso = path.startsWith('/share-profile')

  if (espresso) {
    return (
      <footer className="bg-espresso">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-6 flex items-center justify-between text-[12px] text-white/80">
          <Link href="/" className="font-serif text-[18px] font-semibold text-white">
            grano<span className="text-brick">.</span>
          </Link>
          <span>Chicago only</span>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-paper">
      {!quiet && (
        <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-14 sm:py-16 text-center">
          <p className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-gold mb-3">
            For producers
          </p>
          <h2 className="font-serif text-[26px] sm:text-[32px] font-medium text-ink mb-3">
            Are you a local food business?
          </h2>
          <p className="text-[15px] text-stone mb-5 max-w-[520px] mx-auto">
            Create your free Grano profile. Get discovered, showcase what you make, reach local customers, connect with restaurants, and promote events. Sell through Grano when you’re ready.
          </p>
          <p className="text-[13px] text-stone mb-6">
            Free profile. No subscription. No requirement to sell.
          </p>
          <Link href="/signup?as=producer" className="inline-block bg-transparent text-ink text-[15px] font-semibold px-6 py-3 rounded-btn border border-ink hover:bg-card transition-colors">
            Create free profile
          </Link>
        </div>
      )}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-8 flex items-center justify-between text-[12px] text-stone">
        <Link href="/" className="font-serif text-[18px] font-medium text-ink">
          grano<span className="text-brick">.</span>
        </Link>
        <span>Chicago only</span>
      </div>
    </footer>
  )
}
