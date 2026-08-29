import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { computeRoles } from '@/lib/accountRoles'

export async function middleware(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if ((path.startsWith('/dashboard') || path.startsWith('/onboarding')) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  if (path.startsWith('/dashboard/admin') || path.startsWith('/dashboard/producer') || path.startsWith('/dashboard/restaurant')) {
    // account_roles is what lets a user hold multiple roles at once (e.g. producer AND
    // restaurant), so gate on role membership there rather than the single legacy
    // profiles.role column — a secondary producer role wouldn't show up in the latter.
    // profiles.role is still folded in unconditionally (alwaysIncludeProfileRole): it's
    // also what every is_admin() RLS check and the documented one-time SQL admin
    // promotion actually key off, so an admin promoted that way (with no matching
    // account_roles row) must still pass here. See src/lib/accountRoles.js for why this
    // differs from every other roles-computation call site in the app.
    const [{ data: roleRows }, { data: profile }] = await Promise.all([
      supabase.from('account_roles').select('role').eq('user_id', user.id),
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    ])
    const roles = computeRoles(roleRows, profile?.role, { alwaysIncludeProfileRole: true })

    if (path.startsWith('/dashboard/admin') && !roles.has('admin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (path.startsWith('/dashboard/producer') && !roles.has('producer') && !roles.has('admin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (path.startsWith('/dashboard/restaurant') && !roles.has('restaurant') && !roles.has('admin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
}
