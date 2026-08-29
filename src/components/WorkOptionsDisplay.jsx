import { WORK_OPTION_DEFS } from '@/lib/workOptions'

// Read-only public display of a business's enabled Work With Us options — chips only
// for now (Phase 1). The actual "start an inquiry" flow is added in a later phase;
// until then this is purely informational, so it never renders a dead-end button.
export default function WorkOptionsDisplay({ options, heading }) {
  const enabled = (options || []).filter(o => o.enabled)
  if (!enabled.length) return null

  return (
    <section>
      <div className="flex items-center gap-4 mb-3">
        <h2 className="font-serif text-[13px] font-semibold tracking-[.15em] uppercase text-stone whitespace-nowrap">{heading}</h2>
        <div className="flex-1 h-px bg-[#ECEAE4]" />
      </div>
      <div className="flex flex-wrap gap-2">
        {enabled.map(o => (
          <div key={o.key} className="bg-white border border-[#ECEAE4] rounded-lg px-3.5 py-2">
            <div className="text-[13px] font-semibold text-soil">{WORK_OPTION_DEFS[o.key].label}</div>
            {o.headline && <div className="text-[11px] text-stone">{o.headline}</div>}
          </div>
        ))}
      </div>
    </section>
  )
}
