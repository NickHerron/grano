'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/initials'

export default function ImageUploadField({ farmId, farmName, field, currentUrl, label, shape = 'square', onSaved, table = 'farms' }) {
  const supabase = createClient()
  const [preview, setPreview] = useState(currentUrl || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    setPreview(URL.createObjectURL(file))

    const path = `${field}/${farmId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('product-photos').upload(path, file)
    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }
    const url = supabase.storage.from('product-photos').getPublicUrl(path).data.publicUrl

    const { error: dbError } = await supabase.from(table).update({ [field]: url }).eq('id', farmId)
    setUploading(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    onSaved?.(url)
  }

  const boxClass = shape === 'banner'
    ? 'w-full h-28 rounded-xl'
    : 'w-16 h-16 rounded-xl'

  return (
    <div className="flex items-center gap-4">
      <div className={`${boxClass} overflow-hidden flex items-center justify-center flex-shrink-0 bg-linen`}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        ) : shape === 'square' ? (
          <span className="font-serif text-lg font-semibold text-soil/30">{getInitials(farmName)}</span>
        ) : (
          <span className="text-[12px] text-stone">No {label.toLowerCase()}</span>
        )}
      </div>
      <div>
        <div className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-1.5">{label}</div>
        <label className="inline-block text-[13px] font-semibold text-soil bg-linen px-4 py-2 rounded-lg cursor-pointer hover:bg-[#E4E0D5] transition-colors">
          {uploading ? 'Uploading…' : preview ? `Change ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
        {error && <div className="text-[11px] text-rust mt-1.5">{error}</div>}
      </div>
    </div>
  )
}
