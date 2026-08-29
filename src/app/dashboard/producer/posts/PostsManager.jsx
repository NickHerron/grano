'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/formatDate'

export default function PostsManager({ farmId, initialPosts }) {
  const router = useRouter()
  const supabase = createClient()
  const [posts, setPosts] = useState(initialPosts)
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handlePost(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    setError('')

    let photo_url = null
    if (file) {
      const path = `farm-posts/${farmId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('product-photos').upload(path, file)
      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }
      photo_url = supabase.storage.from('product-photos').getPublicUrl(path).data.publicUrl
    }

    const { data: row, error: dbError } = await supabase
      .from('farm_posts')
      .insert({ farm_id: farmId, text: text.trim(), photo_url })
      .select()
      .single()

    setSaving(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    setPosts([row, ...posts])
    setText('')
    setFile(null)
    setPreview(null)
    router.refresh()
  }

  async function handleDelete(id) {
    setPosts(posts.filter(p => p.id !== id))
    await supabase.from('farm_posts').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div>
      <form onSubmit={handlePost} className="bg-white border border-[#ECEAE4] rounded-xl p-5 mb-6 flex flex-col gap-3">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="First tomatoes of the season are here…"
          className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors resize-none h-24"
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-32 h-32 rounded-lg object-cover" />
        )}
        <div className="flex items-center gap-3">
          <label className="text-[13px] font-semibold text-soil bg-linen px-4 py-2 rounded-lg cursor-pointer hover:bg-[#E4E0D5] transition-colors">
            {preview ? 'Change photo' : '+ Add photo'}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
          <button type="submit" disabled={saving || !text.trim()} className="bg-rust text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-60">
            {saving ? 'Posting…' : 'Post Update'}
          </button>
        </div>
        {error && <p className="text-[12px] text-rust">{error}</p>}
      </form>

      {posts.length ? (
        <div className="flex flex-col gap-3">
          {posts.map(post => (
            <div key={post.id} className="bg-white border border-[#ECEAE4] rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <span className="text-[11px] text-stone">{formatDate(post.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <button onClick={() => handleDelete(post.id)} className="text-[11px] text-[#C0A090] hover:text-rust transition-colors flex-shrink-0">Remove</button>
              </div>
              {post.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.photo_url} alt="" className="w-full max-w-xs rounded-lg object-cover mb-3" />
              )}
              <p className="text-[14px] text-soil whitespace-pre-line">{post.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
          <p className="text-[14px] text-stone">No updates yet — share what's new, what's in season, or where you'll be this week.</p>
        </div>
      )}
    </div>
  )
}
