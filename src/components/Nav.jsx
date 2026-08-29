'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Nav({ user, cartCount = 0, area = null }) {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links = [
    { href: '/',            label: 'Market' },
    { href: '/producers',   label: 'Producers' },
    { href: '/restaurants', label: 'Restaurants' },
    { href: '/markets',     label: 'Markets' },
    { href: '/seasonal',    label: 'Seasonal' },
    { href: '/group-buys',  label: 'Group Buys' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#ECEAE4]">
      <div className="px-4 sm:px-8 flex items-center gap-3 md:gap-6 h-[60px]">
        <Link href="/" className="font-serif text-[24px] md:text-[26px] font-semibold tracking-tight text-soil whitespace-nowrap">
          grano<span className="text-rust">.</span>
        </Link>

        {/* Plain GET form to /search — a real navigation, not client state, so it
            works even if this component's JS hasn't hydrated yet. */}
        <form action="/search" className="hidden md:block flex-1 max-w-md relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A09880] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            name="q"
            placeholder="Search produce, farms, ingredients…"
            className="w-full bg-[#F7F5F1] border border-transparent rounded-lg py-2 pl-9 pr-4 text-sm text-soil outline-none focus:border-wheat focus:bg-white transition-colors placeholder:text-[#A09880]"
          />
        </form>

        <ul className="hidden md:flex gap-1 list-none ml-auto">
          {links.map(l => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`text-[13px] font-medium px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  path === l.href ? 'bg-[#F7F5F1] text-soil' : 'text-stone hover:bg-[#F7F5F1] hover:text-soil'
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-2">
          {area && (
            <Link href="/locations" className="text-[13px] font-medium text-stone hover:text-soil px-2 py-1.5 whitespace-nowrap" title="Change location">
              📍 {area.city}
            </Link>
          )}
          <Link href="/cart" className="relative text-[13px] font-medium bg-[#F7F5F1] text-soil px-3 py-1.5 rounded-md hover:bg-[#E8E4DC] transition-colors whitespace-nowrap">
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rust text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-[13px] font-medium bg-[#F7F5F1] text-soil px-3 py-1.5 rounded-md hover:bg-[#E8E4DC] transition-colors whitespace-nowrap">
                {user.full_name?.split(' ')[0] || 'Dashboard'}
              </Link>
              <button onClick={handleSignOut} className="text-[13px] font-medium text-stone hover:text-soil px-2 py-1.5 transition-colors whitespace-nowrap">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="text-[13px] font-semibold text-white bg-rust px-4 py-1.5 rounded-md hover:bg-[#A8521F] transition-colors whitespace-nowrap">
              Sign In
            </Link>
          )}
        </div>

        {/* MOBILE: cart + hamburger only */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          <Link href="/cart" className="relative text-[13px] font-medium bg-[#F7F5F1] text-soil px-3 py-1.5 rounded-md whitespace-nowrap">
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rust text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-[#F7F5F1] transition-colors flex-shrink-0"
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

      {/* MOBILE MENU PANEL */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#ECEAE4] bg-white px-4 py-4 flex flex-col gap-4">
          <form action="/search" className="relative" onSubmit={() => setMenuOpen(false)}>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A09880] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              name="q"
              placeholder="Search produce, farms, ingredients…"
              className="w-full bg-[#F7F5F1] border border-transparent rounded-lg py-2.5 pl-9 pr-4 text-sm text-soil outline-none focus:border-wheat focus:bg-white transition-colors placeholder:text-[#A09880]"
            />
          </form>

          {area && (
            <Link href="/locations" onClick={() => setMenuOpen(false)}
              className="text-[13px] font-medium text-stone px-3 py-1.5">
              📍 {area.city} · Change location
            </Link>
          )}

          <ul className="flex flex-col gap-1 list-none">
            {links.map(l => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block text-[14px] font-medium px-3 py-2.5 rounded-md transition-colors ${
                    path === l.href ? 'bg-[#F7F5F1] text-soil' : 'text-stone hover:bg-[#F7F5F1] hover:text-soil'
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 pt-2 border-t border-[#F0EDE7]">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                  className="text-[14px] font-medium bg-[#F7F5F1] text-soil px-3 py-2.5 rounded-md text-center">
                  {user.full_name?.split(' ')[0] || 'Dashboard'}
                </Link>
                <button onClick={() => { setMenuOpen(false); handleSignOut() }}
                  className="text-[14px] font-medium text-stone px-3 py-2.5 text-center">
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)}
                className="text-[14px] font-semibold text-white bg-rust px-4 py-2.5 rounded-md text-center">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
