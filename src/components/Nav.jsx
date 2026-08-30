'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Nav({ user, area = null }) {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const cityLabel = area?.city || 'Chicago'

  return (
    <nav className="sticky top-0 z-50 bg-paper border-b border-hair">
      <div className="px-4 sm:px-8 flex items-center gap-4 h-[60px] max-w-[1100px] mx-auto">
        <Link href="/" className="font-serif text-[24px] md:text-[26px] font-semibold tracking-tight text-soil whitespace-nowrap">
          grano<span className="text-brick">.</span>
        </Link>

        <div className="hidden md:flex items-center gap-5 ml-auto text-[13px]">
          <span className="text-stone">{cityLabel}</span>
          <Link
            href="/producers"
            className={path === '/producers' || path.startsWith('/producers/') ? 'text-ink font-medium' : 'text-stone hover:text-brick'}
          >
            Producers
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-stone hover:text-brick">
                {user.full_name?.split(' ')[0] || 'Dashboard'}
              </Link>
              <button onClick={handleSignOut} className="text-stone hover:text-brick">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="text-stone hover:text-brick">
              Sign in
            </Link>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2 ml-auto">
          {user ? (
            <Link href="/dashboard" className="text-[13px] text-soil px-2 py-1.5">
              {user.full_name?.split(' ')[0] || 'Dashboard'}
            </Link>
          ) : (
            <Link href="/login" className="text-[13px] text-soil px-2 py-1.5">
              Sign in
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-card"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>
              ) : (
                <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-hair bg-paper px-4 py-4 flex flex-col gap-3">
          <span className="text-[13px] text-stone px-3">{cityLabel}</span>
          <Link href="/producers" onClick={() => setMenuOpen(false)} className="text-[14px] text-soil px-3 py-2">
            Producers
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="text-[14px] text-soil px-3 py-2">
                Dashboard
              </Link>
              <button onClick={() => { setMenuOpen(false); handleSignOut() }} className="text-[14px] text-stone px-3 py-2 text-left">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} className="text-[14px] text-soil px-3 py-2">
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
