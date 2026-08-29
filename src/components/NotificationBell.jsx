'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NotificationBell({ userId, initialNotifications }) {
  const router = useRouter()
  const supabase = createClient()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.read_at).length

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => setNotifications(current => [payload.new, ...current])
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleOpenNotification(n) {
    setOpen(false)
    if (!n.read_at) {
      setNotifications(current => current.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id)
    }
    if (n.link) router.push(n.link)
  }

  async function markAllRead() {
    const now = new Date().toISOString()
    setNotifications(current => current.map(n => ({ ...n, read_at: n.read_at || now })))
    await supabase.from('notifications').update({ read_at: now }).is('read_at', null).eq('user_id', userId)
  }

  return (
    <div className="relative" ref={rootRef}>
      <button onClick={() => setOpen(o => !o)} aria-label="Notifications"
        className="relative w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rust text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[340px] max-h-[420px] overflow-y-auto bg-white border border-[#ECEAE4] rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EDE7]">
            <span className="text-[13px] font-semibold text-soil">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[11px] font-semibold text-rust hover:underline">Mark all read</button>
            )}
          </div>
          {notifications.length ? (
            <div>
              {notifications.map(n => (
                <button key={n.id} onClick={() => handleOpenNotification(n)}
                  className={`w-full text-left px-4 py-3 border-b border-[#F5F3EE] last:border-b-0 hover:bg-[#FAFAF8] transition-colors ${!n.read_at ? 'bg-[#FDF8F3]' : ''}`}>
                  <div className="flex items-start gap-2">
                    {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-rust mt-1.5 flex-shrink-0" />}
                    <div className="min-w-0">
                      <div className={`text-[13px] ${!n.read_at ? 'font-semibold text-soil' : 'text-stone'}`}>{n.title}</div>
                      {n.body && <div className="text-[12px] text-stone truncate mt-0.5">{n.body}</div>}
                      <div className="text-[10px] text-stone/70 mt-1">{timeAgo(n.created_at)}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-[13px] text-stone">Nothing yet.</div>
          )}
        </div>
      )}
    </div>
  )
}
