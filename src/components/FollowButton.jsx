'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function FollowButton({ farmId, restaurantId, initialFollowing, className, followingClassName }) {
  const router = useRouter()
  const supabase = createClient()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const targetKey = farmId ? 'farm_id' : 'restaurant_id'
  const targetId = farmId || restaurantId

  async function handleClick() {
    if (loading) return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      setLoading(false)
      return
    }

    const { error: dbError } = following
      ? await supabase.from('follows').delete().eq('follower_id', user.id).eq(targetKey, targetId)
      : await supabase.from('follows').insert({ follower_id: user.id, [targetKey]: targetId })

    setLoading(false)
    if (dbError) {
      setError(dbError.message)
      setTimeout(() => setError(''), 3000)
      return
    }
    setFollowing(!following)
    router.refresh()
  }

  return (
    <button onClick={handleClick} disabled={loading} title={error || undefined}
      className={error ? 'flex-1 text-[13px] font-medium py-1.5 rounded-lg border-[1.5px] border-rust text-white bg-rust' : (following ? followingClassName : className)}>
      {loading ? '…' : error ? 'Error' : following ? '✓ Following' : '+ Follow'}
    </button>
  )
}
