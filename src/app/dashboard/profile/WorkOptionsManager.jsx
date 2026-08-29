'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WORK_OPTION_DEFS } from '@/lib/workOptions'

// Lets a business turn Work With Us options on/off and add an optional headline shown
// under that option in the visitor-facing picker. Un-set options aren't "off" here —
// resolveWorkOptions() in src/lib/workOptions.js falls back to a sensible default
// computed from the business's existing category data, so this only ever needs to
// write a row once a business actually changes something.
export default function WorkOptionsManager({ businessType, businessId, options: initialOptions }) {
  const router = useRouter()
  const supabase = createClient()
  const [options, setOptions] = useState(initialOptions)
  const [savingKey, setSavingKey] = useState(null)

  async function toggle(key) {
    const current = options.find(o => o.key === key)
    const nextEnabled = !current.enabled
    setSavingKey(key)
    setOptions(options.map(o => o.key === key ? { ...o, enabled: nextEnabled } : o))
    await supabase.from('business_work_options').upsert(
      { business_type: businessType, business_id: businessId, option_key: key, enabled: nextEnabled },
      { onConflict: 'business_type,business_id,option_key' },
    )
    setSavingKey(null)
    router.refresh()
  }

  async function saveHeadline(key, headline) {
    setOptions(options.map(o => o.key === key ? { ...o, headline } : o))
    await supabase.from('business_work_options').upsert(
      { business_type: businessType, business_id: businessId, option_key: key, enabled: options.find(o => o.key === key).enabled, headline: headline || null },
      { onConflict: 'business_type,business_id,option_key' },
    )
    router.refresh()
  }

  return (
    <div>
      <p className="text-[13px] text-stone mb-5">
        Choose the ways people can work with you — these show as options on your public profile. Anything left off here still uses a sensible default based on what you've told Grano about your business.
      </p>
      <div className="flex flex-col gap-2.5">
        {options.map(o => (
          <div key={o.key} className={`rounded-xl border-[1.5px] transition-colors p-4 ${
            o.enabled ? 'bg-[#FDF0E8] border-rust' : 'bg-linen border-transparent'
          }`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={o.enabled} disabled={savingKey === o.key}
                onChange={() => toggle(o.key)} className="w-4 h-4 accent-rust flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-soil">{WORK_OPTION_DEFS[o.key].label}</div>
                <div className="text-[12px] text-stone">{WORK_OPTION_DEFS[o.key].prompt}</div>
                {(o.key === 'wholesale' || o.key === 'supplier_pitch') && (
                  <div className="text-[11px] text-stone mt-0.5">Defaults from your Wholesale settings — the checkbox here always wins if you change it.</div>
                )}
              </div>
            </label>
            {o.enabled && (
              <input
                defaultValue={o.headline || ''}
                onBlur={e => e.target.value !== (o.headline || '') && saveHeadline(o.key, e.target.value.trim())}
                placeholder="Optional note shown to visitors — e.g. &quot;25lb minimum&quot;"
                className="mt-2.5 bg-white border border-[#ECEAE4] rounded-lg px-3 py-2 text-[12px] text-soil outline-none focus:border-wheat transition-colors w-full"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
