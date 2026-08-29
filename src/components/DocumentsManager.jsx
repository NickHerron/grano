'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_LABELS, CATEGORY_ORDER, STATUS_LABELS } from '@/lib/documentRequirements'

const STATUS_STYLES = {
  not_uploaded: 'bg-linen text-stone',
  uploaded: 'bg-[#EFF3F8] text-[#4A6FA5]',
  under_review: 'bg-[#FDF0E8] text-rust',
  verified: 'bg-[#EBF3EC] text-sage',
  needs_attention: 'bg-[#FBEAEA] text-[#B4453F]',
  expired: 'bg-[#FBEAEA] text-[#B4453F]',
}

function DocumentRow({ row, ownerType, ownerId, onUploaded }) {
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)
  const [file, setFile] = useState(null)
  const [issueDate, setIssueDate] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [signedUrl, setSignedUrl] = useState(null)

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) { setError('Choose a file first.'); return }
    setUploading(true)
    setError('')

    const path = `${ownerType}/${ownerId}/${row.type.key}-${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('business-documents').upload(path, file)
    if (uploadError) {
      setUploading(false)
      setError(uploadError.message)
      return
    }

    const payload = {
      owner_type: ownerType,
      [ownerType === 'farm' ? 'farm_id' : 'restaurant_id']: ownerId,
      document_type_id: row.type.id,
      storage_path: path,
      issue_date: issueDate || null,
      expiration_date: expirationDate || null,
      notes: notes || null,
    }
    const { error: dbError } = await supabase.from('documents').insert(payload)
    setUploading(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    setFile(null)
    setExpanded(false)
    onUploaded()
  }

  async function handleView() {
    if (!row.document) return
    const { data } = await supabase.storage.from('business-documents').createSignedUrl(row.document.storage_path, 120)
    if (data?.signedUrl) setSignedUrl(data.signedUrl)
  }

  return (
    <div className="bg-white border border-[#ECEAE4] rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[14px] font-semibold text-soil">{row.type.name}</span>
            {row.required && <span className="text-[10px] font-semibold uppercase tracking-wide text-rust">Required</span>}
          </div>
          {row.type.description && <div className="text-[12px] text-stone">{row.type.description}</div>}
        </div>
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded flex-shrink-0 ${STATUS_STYLES[row.effectiveStatus]}`}>
          {STATUS_LABELS[row.effectiveStatus]}
        </span>
      </div>

      {row.expiringWithinDays !== null && row.effectiveStatus !== 'expired' && (
        <div className="text-[12px] text-rust font-medium mt-2">⚠ Expires in {row.expiringWithinDays} day{row.expiringWithinDays === 1 ? '' : 's'}</div>
      )}

      {row.document?.admin_notes && (
        <div className="bg-[#FBEAEA] rounded-lg p-3 text-[12px] text-[#B4453F] mt-2">{row.document.admin_notes}</div>
      )}

      {row.document && (
        <div className="flex items-center gap-3 mt-3">
          <button onClick={handleView} className="text-[12px] font-semibold text-rust hover:underline">View file</button>
          {signedUrl && <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-stone hover:underline">Open →</a>}
          <span className="text-[11px] text-stone">
            {[row.document.issue_date && `Issued ${row.document.issue_date}`, row.document.expiration_date && `Expires ${row.document.expiration_date}`].filter(Boolean).join(' · ')}
          </span>
        </div>
      )}

      {!expanded ? (
        <button onClick={() => setExpanded(true)} className="text-[12px] font-semibold text-soil bg-linen px-3 py-1.5 rounded-lg mt-3 hover:bg-[#E4E0D5] transition-colors">
          {row.document ? 'Upload new version' : '+ Upload'}
        </button>
      ) : (
        <form onSubmit={handleUpload} className="flex flex-col gap-2 mt-3 bg-linen rounded-lg p-3">
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="text-[12px]" />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] text-stone flex flex-col gap-1">
              Issue date
              <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)}
                className="bg-white border border-[#ECEAE4] rounded-md px-2 py-1.5 text-[12px] text-soil outline-none focus:border-wheat" />
            </label>
            {row.type.typically_expires && (
              <label className="text-[11px] text-stone flex flex-col gap-1">
                Expiration date
                <input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)}
                  className="bg-white border border-[#ECEAE4] rounded-md px-2 py-1.5 text-[12px] text-soil outline-none focus:border-wheat" />
              </label>
            )}
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)"
            className="bg-white border border-[#ECEAE4] rounded-md px-2 py-1.5 text-[12px] text-soil outline-none focus:border-wheat resize-none h-14" />
          {error && <p className="text-[11px] text-rust">{error}</p>}
          <div className="flex items-center gap-2">
            <button type="submit" disabled={uploading} className="text-[12px] font-semibold text-white bg-rust px-3 py-1.5 rounded-lg hover:bg-[#A8521F] transition-colors disabled:opacity-60">
              {uploading ? 'Uploading…' : 'Save'}
            </button>
            <button type="button" onClick={() => setExpanded(false)} className="text-[11px] text-stone hover:text-soil transition-colors">Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function DocumentsManager({ ownerType, ownerId, rows }) {
  const router = useRouter()

  const byCategory = CATEGORY_ORDER.map(cat => ({
    category: cat,
    rows: rows.filter(r => r.type.category === cat),
  })).filter(g => g.rows.length > 0)

  return (
    <div className="flex flex-col gap-8">
      {byCategory.map(group => (
        <div key={group.category}>
          <h2 className="font-serif text-[16px] font-semibold text-soil mb-3">{CATEGORY_LABELS[group.category]}</h2>
          <div className="flex flex-col gap-3">
            {group.rows.map(row => (
              <DocumentRow key={row.type.id} row={row} ownerType={ownerType} ownerId={ownerId} onUploaded={() => router.refresh()} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
