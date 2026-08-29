export default function LiveBanner({ products = [] }) {
  const items = products.length
    ? products.map(p => `${p.name} — ${p.farmName}`)
    : ['New producers joining every week — check back soon']
  const doubled = [...items, ...items]

  return (
    <div className="bg-soil text-white px-4 sm:px-8 py-2.5 flex items-center gap-3 sm:gap-4 overflow-hidden">
      <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-wheat whitespace-nowrap flex-shrink-0">
        <span className="w-1.5 h-1.5 bg-wheat rounded-full animate-pulse-dot inline-block" />
        Live Market
      </div>
      <div className="overflow-hidden flex-1">
        <div className="flex animate-banner whitespace-nowrap">
          {doubled.map((item, i) => (
            <span key={i} className="text-[13px] text-white/80 px-7 inline-flex items-center gap-7 after:content-['·'] after:text-wheat">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
