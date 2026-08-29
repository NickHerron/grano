'use server'
import { cookies } from 'next/headers'
import { locationCookieName } from '@/lib/resolveLocation'

// A user-initiated preference ("I'm actually in Brooklyn, not wherever my IP says"),
// not tracking — stores nothing but a chosen city/state, read only by the server.
export async function setLocationCookie(state, city) {
  cookies().set(locationCookieName(), `${state}|${city}`, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: true,
  })
}

export async function clearLocationCookie() {
  cookies().delete(locationCookieName())
}
