'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { categories } from '@/components/CategoryBar'

// Admin override for a product's category — producers already set this themselves in
// ProductForm.jsx, but had no way to fix a miscategorized product short of asking the
// producer or deleting the row outright. Same inline-select-that-saves-on-change
// pattern as VerificationSelect.jsx, just targeting products.category instead.
export default function CategorySelect({ productId, category }) {
  const router = useRouter()
  const supabase = createClient()
  const [value, setValue] = useState(category)
  const [saving, setSaving] = useState(false)

  async function handleChange(e) {
    const next = e.target.value
    setValue(next)
    setSaving(true)
    await supabase.from('products').update({ category: next }).eq('id', productId)
    setSaving(false)
    router.refresh()
  }

  return (
    <select value={value || ''} onChange={handleChange} disabled={saving}
      className="text-[12px] font-semibold bg-linen border border-transparent rounded-md px-2.5 py-1.5 outline-none focus:border-wheat disabled:opacity-50">
      {categories.filter(c => c.key !== 'all').map(c => (
        <option key={c.key} value={c.key}>{c.label}</option>
      ))}
    </select>
  )
}
