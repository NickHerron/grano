'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { categories } from '@/components/CategoryBar'

const bgSwatches = ['#F7F5F1', '#FDF0F5', '#FDF0E8', '#EBF3EC', '#EEF2F0', '#FBF5E6', '#FDF0F0']
const badgeColors = ['green', 'yellow', 'red']

// Coffee and matcha get their own dedicated fields (roast/grade + origin) since
// buyers actually shop by those — stored in the flexible specialty_attributes
// JSON column so other niche categories can add their own fields later without
// a schema migration each time.
function buildSpecialtyAttributes(form) {
  if (form.category === 'coffee') {
    return { roast_level: form.roastLevel || undefined, origin: form.origin || undefined }
  }
  if (form.category === 'matcha') {
    return { grade: form.grade || undefined, origin: form.origin || undefined }
  }
  return {}
}

// onSaved is optional — when given (the onboarding wizard's Products step embeds
// this form inline), it's called instead of the hard redirect to /dashboard/producer,
// so saving a product advances the wizard rather than kicking the producer out of it.
// Every existing caller (the standalone new/edit pages) omits it and keeps today's
// redirect behavior exactly as-is. namePlaceholder is likewise optional — the wizard
// passes a category-specific example (src/lib/onboardingEmphasis.js) instead of the
// generic default.
export default function ProductForm({ farmId, product, onSaved, namePlaceholder = 'Illinois Strawberries' }) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = Boolean(product)

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || categories[1].key,
    price: product?.price ?? '',
    unit: product?.unit || '',
    unitDetail: product?.unit_detail || '',
    stock: product?.stock ?? '',
    stockUnit: product?.stock_unit || '',
    badge: product?.badge || '',
    badgeColor: product?.badge_color || 'green',
    imgBg: product?.img_bg || bgSwatches[0],
    harvestedAt: product?.harvested_at || '',
    seasonEnds: product?.season_ends || '',
    forSale: product?.for_sale ?? true,
    isAvailable: product?.is_available ?? true,
    isPreorder: product?.is_preorder ?? false,
    preorderNote: product?.preorder_note || '',
    seasonStartMonth: product?.season_start_month || '',
    seasonEndMonth: product?.season_end_month || '',
    wholesalePrice: product?.wholesale_price ?? '',
    wholesaleUnit: product?.wholesale_unit || '',
    wholesaleMinOrder: product?.wholesale_min_order || '',
    wholesaleCaseSize: product?.wholesale_case_size || '',
    wholesaleLeadTimeDays: product?.wholesale_lead_time_days ?? '',
    wholesaleNotes: product?.wholesale_notes || '',
    roastLevel: product?.specialty_attributes?.roast_level || '',
    origin: product?.specialty_attributes?.origin || '',
    grade: product?.specialty_attributes?.grade || '',
  })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(product?.image_url || null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function slugify(name) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    let imageUrl = product?.image_url || null
    if (file) {
      const path = `${farmId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('product-photos').upload(path, file)
      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }
      imageUrl = supabase.storage.from('product-photos').getPublicUrl(path).data.publicUrl
    }

    const payload = {
      farm_id: farmId,
      slug: isEdit ? product.slug : `${slugify(form.name)}-${Date.now().toString(36)}`,
      name: form.name,
      description: form.description || null,
      category: form.category,
      price: parseFloat(form.price) || 0,
      unit: form.unit,
      unit_detail: form.unitDetail || null,
      stock: form.stock === '' ? null : parseInt(form.stock, 10),
      stock_unit: form.stockUnit || null,
      badge: form.badge || null,
      badge_color: form.badgeColor,
      img_bg: form.imgBg,
      harvested_at: form.harvestedAt || null,
      season_ends: form.seasonEnds || null,
      image_url: imageUrl,
      for_sale: form.forSale,
      is_available: form.isAvailable,
      is_preorder: form.isPreorder,
      preorder_note: form.isPreorder ? (form.preorderNote || null) : null,
      season_start_month: form.seasonStartMonth ? parseInt(form.seasonStartMonth, 10) : null,
      season_end_month: form.seasonEndMonth ? parseInt(form.seasonEndMonth, 10) : null,
      wholesale_price: form.wholesalePrice === '' ? null : parseFloat(form.wholesalePrice),
      wholesale_unit: form.wholesaleUnit || null,
      wholesale_min_order: form.wholesaleMinOrder || null,
      wholesale_case_size: form.wholesaleCaseSize || null,
      wholesale_lead_time_days: form.wholesaleLeadTimeDays === '' ? null : parseInt(form.wholesaleLeadTimeDays, 10),
      wholesale_notes: form.wholesaleNotes || null,
      specialty_attributes: buildSpecialtyAttributes(form),
    }

    const { error: dbError } = isEdit
      ? await supabase.from('products').update(payload).eq('id', product.id)
      : await supabase.from('products').insert(payload)

    setLoading(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    if (onSaved) {
      onSaved()
    } else {
      router.push('/dashboard/producer')
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-[640px]">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: form.imgBg }}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[12px] text-stone">No photo</span>
          )}
        </div>
        <div>
          <label className="inline-block text-[13px] font-semibold text-soil bg-linen px-4 py-2 rounded-lg cursor-pointer hover:bg-[#E4E0D5] transition-colors">
            {preview ? 'Change photo' : 'Upload photo'}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
          <div className="text-[11px] text-stone mt-2">JPG or PNG, square photos look best.</div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Product name</label>
        <input required value={form.name} onChange={e => update('name', e.target.value)}
          placeholder={namePlaceholder}
          className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Description</label>
        <textarea value={form.description} onChange={e => update('description', e.target.value)}
          placeholder="Tell chefs what makes this special…" rows={3}
          className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors resize-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Category</label>
          <select value={form.category} onChange={e => update('category', e.target.value)}
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors">
            {categories.filter(c => c.key !== 'all').map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Card color</label>
          <div className="flex gap-2 items-center h-[46px]">
            {bgSwatches.map(c => (
              <button key={c} type="button" onClick={() => update('imgBg', c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${form.imgBg === c ? 'border-rust scale-110' : 'border-transparent'}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>

      {(form.category === 'coffee' || form.category === 'matcha') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-linen rounded-lg p-4">
          {form.category === 'coffee' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Roast level</label>
              <select value={form.roastLevel} onChange={e => update('roastLevel', e.target.value)}
                className="bg-white border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat transition-colors">
                <option value="">Not specified</option>
                {['Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Grade</label>
              <select value={form.grade} onChange={e => update('grade', e.target.value)}
                className="bg-white border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat transition-colors">
                <option value="">Not specified</option>
                {['Ceremonial', 'Premium', 'Culinary'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Origin</label>
            <input value={form.origin} onChange={e => update('origin', e.target.value)}
              placeholder={form.category === 'coffee' ? 'Ethiopia, Yirgacheffe' : 'Uji, Japan'}
              className="bg-white border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat transition-colors" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Price ($) {!form.forSale && '— optional'}</label>
          <input required={form.forSale} type="number" step="0.01" min="0" value={form.price} onChange={e => update('price', e.target.value)}
            placeholder="28"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Unit</label>
          <input required value={form.unit} onChange={e => update('unit', e.target.value)}
            placeholder="lb, flat, dozen…"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Unit detail</label>
          <input value={form.unitDetail} onChange={e => update('unitDetail', e.target.value)}
            placeholder="12 pints"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Stock quantity</label>
          <input type="number" min="0" value={form.stock} onChange={e => update('stock', e.target.value)}
            placeholder="Leave blank if unlimited"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Stock unit</label>
          <input value={form.stockUnit} onChange={e => update('stockUnit', e.target.value)}
            placeholder="flats, jars, birds…"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Badge text</label>
          <input value={form.badge} onChange={e => update('badge', e.target.value)}
            placeholder="Picked Yesterday"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Badge color</label>
          <select value={form.badgeColor} onChange={e => update('badgeColor', e.target.value)}
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors capitalize">
            {badgeColors.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Harvested / made</label>
          <input value={form.harvestedAt} onChange={e => update('harvestedAt', e.target.value)}
            placeholder="Yesterday, June 26"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Season ends (optional)</label>
          <input value={form.seasonEnds} onChange={e => update('seasonEnds', e.target.value)}
            placeholder="~3 weeks"
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
        </div>
      </div>

      <div className="border-t border-[#ECEAE4] pt-5">
        <div className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-1">Availability</div>
        <p className="text-[12px] text-stone mb-3">You can list something you make without selling it through Grano yet.</p>
        <button type="button" onClick={() => update('forSale', !form.forSale)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-[1.5px] transition-all mb-3 ${
            form.forSale ? 'bg-[#EBF3EC] border-sage' : 'bg-linen border-transparent'
          }`}>
          <span className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${form.forSale ? 'bg-sage' : 'bg-[#D9D2C5]'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${form.forSale ? 'left-[18px]' : 'left-0.5'}`} />
          </span>
          <span className={`text-[14px] font-semibold ${form.forSale ? 'text-sage' : 'text-stone'}`}>
            {form.forSale ? 'For sale through Grano' : 'Listed on profile only — not for sale on Grano'}
          </span>
        </button>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <label className="flex items-center gap-2 text-[13px] text-soil cursor-pointer bg-linen rounded-lg px-3 py-2.5 flex-1">
            <input type="checkbox" checked={form.isAvailable} onChange={e => update('isAvailable', e.target.checked)} className="w-4 h-4 accent-rust" />
            Currently available
          </label>
          <label className="flex items-center gap-2 text-[13px] text-soil cursor-pointer bg-linen rounded-lg px-3 py-2.5 flex-1">
            <input type="checkbox" checked={form.isPreorder} onChange={e => update('isPreorder', e.target.checked)} className="w-4 h-4 accent-rust" />
            Available for preorder
          </label>
        </div>

        {form.isPreorder && (
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Preorder note (optional)</label>
            <input value={form.preorderNote} onChange={e => update('preorderNote', e.target.value)}
              placeholder="Ships early September"
              className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Season starts</label>
            <select value={form.seasonStartMonth} onChange={e => update('seasonStartMonth', e.target.value)}
              className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors">
              <option value="">Not seasonal / year-round</option>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Season ends</label>
            <select value={form.seasonEndMonth} onChange={e => update('seasonEndMonth', e.target.value)}
              className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors">
              <option value="">Not seasonal / year-round</option>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-[#ECEAE4] pt-5">
        <div className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-1">Wholesale (optional)</div>
        <p className="text-[12px] text-stone mb-3">Fill this in to list this product on the Wholesale Marketplace, where restaurants can find it and send an inquiry.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Wholesale price ($)</label>
            <input type="number" step="0.01" min="0" value={form.wholesalePrice} onChange={e => update('wholesalePrice', e.target.value)}
              placeholder="18"
              className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Wholesale unit</label>
            <input value={form.wholesaleUnit} onChange={e => update('wholesaleUnit', e.target.value)}
              placeholder="case, flat, lb…"
              className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Minimum order</label>
            <input value={form.wholesaleMinOrder} onChange={e => update('wholesaleMinOrder', e.target.value)}
              placeholder="5 cases"
              className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Case size</label>
            <input value={form.wholesaleCaseSize} onChange={e => update('wholesaleCaseSize', e.target.value)}
              placeholder="24 units"
              className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Lead time (days)</label>
            <input type="number" min="0" value={form.wholesaleLeadTimeDays} onChange={e => update('wholesaleLeadTimeDays', e.target.value)}
              placeholder="3"
              className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold tracking-wide uppercase text-stone">Notes — delivery, payment terms, etc.</label>
          <textarea value={form.wholesaleNotes} onChange={e => update('wholesaleNotes', e.target.value)} rows={2}
            className="bg-linen border border-transparent rounded-lg px-4 py-3 text-[14px] text-soil outline-none focus:border-wheat focus:bg-white transition-colors resize-none" />
        </div>
      </div>

      {error && <p className="text-[13px] text-rust">{error}</p>}

      <div className="flex gap-3 mt-2">
        <button type="submit" disabled={loading}
          className="bg-rust text-white text-[15px] font-bold px-6 py-3.5 rounded-xl hover:bg-[#A8521F] transition-colors disabled:opacity-60">
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
        </button>
      </div>
    </form>
  )
}
