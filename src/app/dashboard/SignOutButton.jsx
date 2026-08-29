'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button onClick={handleSignOut}
      className="text-[13px] font-medium text-white/60 hover:text-white border border-white/20 rounded-lg px-4 py-2 transition-colors">
      Sign out
    </button>
  )
}
