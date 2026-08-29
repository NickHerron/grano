// A small "why this matters" box — the spec's core rule is that every step explains
// its value in plain language instead of just presenting a form. Wheat-tinted rather
// than an alert color since this is guidance, not a warning.
export default function EducationalCallout({ children }) {
  return (
    <div className="bg-[#FBF7EE] border-l-[3px] border-wheat rounded-r-lg px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-stone mb-1">Why this matters</div>
      <p className="text-[13px] text-soil leading-relaxed">{children}</p>
    </div>
  )
}
