'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SiteFooter() {
  const path = usePathname() || ''
  const quiet = path.startsWith('/dashboard') || path.startsWith('/onboarding') || path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/share-profile')
  const espresso = path.startsWith('/share-profile')

  if (espresso) {
    return (
      <footer className="bg-soil">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-6 flex items-center justify-between text-[12px] text-white/80">
          <Link href="/" className="font-serif text-[18px] font-semibold text-white">
            grano<span className="text-rust">.</span>
          </Link>
          <span>Chicago only</span>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-linen border-t border-[#ECEAE4]">
      {!quiet && (
        <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-14 text-center">
          <h2 className="font-serif text-[26px] sm:text-[32px] font-semibold text-soil mb-3">
            Your business deserves to be easier to find.
          </h2>
          <p className="text-[15px] text-stone mb-6 max-w-[480px] mx-auto">
            Create a free profile. No subscription. No need to sell on Grano or post.
          </p>
          <Link href="/signup?as=producer" className="inline-block bg-rust text-white text-[14px] font-semibold px-6 py-3 rounded-full hover:bg-[#A8521F] transition-colors">
            Create free profile
          </Link>
        </div>
      )}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-8 flex items-center justify-between text-[12px] text-stone">
        <Link href="/" className="font-serif text-[18px] font-semibold text-soil">
          grano<span className="text-rust">.</span>
        </Link>
        <span>Chicago only</span>
      </div>
    </footer>
  )
}
