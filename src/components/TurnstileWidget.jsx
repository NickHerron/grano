'use client'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Script from 'next/script'

// Shared by every auth form that calls a Supabase Auth endpoint covered by CAPTCHA
// protection (Authentication → Bot and Abuse Protection in the Supabase dashboard) —
// currently signUp, signInWithPassword, and resetPasswordForEmail all require a valid
// token once that setting is on, or Supabase rejects the request with "captcha
// protection: request disallowed (no captcha_token found)".
//
// Renders nothing if no site key is configured (safe default for local dev where
// CAPTCHA protection isn't set up) — pass `onToken` to receive the token, and call
// `ref.current.reset()` after a failed submit, since Turnstile tokens are single-use.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

const TurnstileWidget = forwardRef(function TurnstileWidget({ onToken }, ref) {
  const [scriptReady, setScriptReady] = useState(false)
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)

  useEffect(() => {
    if (!scriptReady || !containerRef.current || !TURNSTILE_SITE_KEY) return
    if (widgetIdRef.current !== null) return
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: token => onToken(token),
      'expired-callback': () => onToken(''),
      'error-callback': () => onToken(''),
    })
  }, [scriptReady]) // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current !== null) window.turnstile.reset(widgetIdRef.current)
    },
  }))

  if (!TURNSTILE_SITE_KEY) return null

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer onReady={() => setScriptReady(true)} />
      <div ref={containerRef} />
    </>
  )
})

export default TurnstileWidget
