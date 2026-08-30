export function is24Karat(farm = {}) {
  return `${farm.slug || ''} ${farm.name || ''}`.toLowerCase().includes('24 karat')
}

const FIELDS = [
  { test: /gigi/, bg: '#E8D3B0', ink: '#3D2A14', icon: 'ginger' },
  { test: /scratch|cookie/, bg: '#E6DCCB', ink: '#3A2C1E', icon: 'cookie' },
  { test: /molcajete/, bg: '#E8C9B4', ink: '#4A2614', icon: 'bowl', label: 'El Molcajete' },
  { test: /ivy/, bg: '#DDE4D4', ink: '#2C3A28', icon: 'herb' },
]

export function producerField(farm = {}) {
  const key = `${farm.slug || ''} ${farm.name || ''}`.toLowerCase()
  return FIELDS.find(f => f.test.test(key)) || { bg: '#E8DFD0', ink: '#6B6355', icon: 'shop' }
}

export function producerPlaceLine(farm = {}) {
  const place = farm.neighborhood || farm.city || (farm.location || '').split(',')[0]
  const type = farm.producerType || farm.producer_type
  return [place, type].filter(Boolean).join(' · ')
}

function Mark({ icon, ink }) {
  if (icon === 'ginger') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <path d="M18 6c2 4 3 8 3 12s-1 8-3 12c-2-4-3-8-3-12s1-8 3-12z" stroke={ink} strokeWidth="1.4" fill="none" />
        <ellipse cx="18" cy="18" rx="7" ry="11" stroke={ink} strokeWidth="1.4" fill="none" />
      </svg>
    )
  }
  if (icon === 'cookie') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <circle cx="18" cy="19" r="9" stroke={ink} strokeWidth="1.4" fill="none" />
        <circle cx="15" cy="16" r="1.2" fill={ink} />
        <circle cx="20" cy="18" r="1.2" fill={ink} />
        <circle cx="16" cy="22" r="1.2" fill={ink} />
      </svg>
    )
  }
  if (icon === 'bowl') {
    return (
      <svg width="40" height="28" viewBox="0 0 40 28" fill="none" aria-hidden="true">
        <ellipse cx="20" cy="18" rx="14" ry="7" stroke={ink} strokeWidth="1.4" fill="none" />
        <path d="M8 16c2-8 8-12 12-12 2 0 4 1 6 3" stroke={ink} strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </svg>
    )
  }
  if (icon === 'herb') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <path d="M18 30 V10" stroke={ink} strokeWidth="1.4" fill="none" />
        <path d="M18 22c-6-4-8-10-6-16 6 2 8 8 6 16z" stroke={ink} strokeWidth="1.3" fill="none" />
        <path d="M18 20c6-3 8-9 6-15-6 2-8 8-6 15z" stroke={ink} strokeWidth="1.3" fill="none" />
      </svg>
    )
  }
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path d="M8 16 V28 H28 V16" stroke={ink} strokeWidth="1.4" fill="none" />
      <path d="M6 16 L18 8 L30 16" stroke={ink} strokeWidth="1.4" strokeLinejoin="round" fill="none" />
      <rect x="15" y="20" width="6" height="8" stroke={ink} strokeWidth="1.4" fill="none" />
    </svg>
  )
}

export default function ProducerField({ farm, className = '', showLabel = false }) {
  const field = producerField(farm)
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${className}`} style={{ background: field.bg, color: field.ink }}>
      <Mark icon={field.icon} ink="#C4A35A" />
      {showLabel && field.label && (
        <div className="font-serif text-[22px] sm:text-[28px] font-medium" style={{ color: field.ink }}>{field.label}</div>
      )}
      <span className="sr-only">{farm.name}</span>
    </div>
  )
}
