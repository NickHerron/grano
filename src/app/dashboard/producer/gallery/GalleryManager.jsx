'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function GalleryManager({ farmId, initialPhotos }) {
  const router = useRouter()
  const supabase = createClient()
  const [photos, setPhotos] = useState(initialPhotos)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)

    const path = `farm-gallery/${farmId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('product-photos').upload(path, file)
    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }
    const url = supabase.storage.from('product-photos').getPublicUrl(path).data.publicUrl

    const { data: row, error: dbError } = await supabase
      .from('farm_photos')
      .insert({ farm_id: farmId, url, caption: caption || null, sort_order: photos.length })
      .select()
      .single()

    setUploading(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    setPhotos([...photos, row])
    setCaption('')
    router.refresh()
  }

  async function handleDelete(id) {
    setPhotos(photos.filter(p => p.id !== id))
    await supabase.from('farm_photos').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div>
      <div className="bg-white border border-[#ECEAE4] rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder={'Caption (optional) — e.g. "Morning harvest"'}
          className="bg-linen border border-transparent rounded-lg px-4 py-2.5 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors flex-1 w-full"
        />
        <label className="inline-block text-[13px] font-semibold text-white bg-rust px-5 py-2.5 rounded-lg cursor-pointer hover:bg-[#A8521F] transition-colors whitespace-nowrap">
          {uploading ? 'Uploading…' : '+ Add Photo'}
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
      </div>
      {error && <p className="text-[13px] text-rust mb-4">{error}</p>}

      {photos.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.caption || ''} className="w-full h-36 object-cover" />
              <div className="p-3 flex items-center justify-between gap-2">
                <span className="text-[12px] text-stone truncate">{photo.caption || 'Untitled'}</span>
                <button onClick={() => handleDelete(photo.id)} className="text-[11px] text-[#C0A090] hover:text-rust transition-colors flex-shrink-0">Remove</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
          <p className="text-[14px] text-stone">No photos yet — add a few from your farm, kitchen, or market booth.</p>
        </div>
      )}
    </div>
  )
}
