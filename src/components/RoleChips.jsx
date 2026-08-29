import { roleLabel } from '@/lib/businessRoles'

// The one place additional (non-primary) business_roles tags render — shared by all
// three public profile components so a farm/restaurant/organization tagged with
// several roles ("Bakery" + "Producer", "Cafe" + "Pickup Location") shows it the same
// way everywhere. The primary role is never repeated here — it's already shown as the
// entity's main type label in the header above this.
export default function RoleChips({ roles = [] }) {
  const additional = roles.filter(r => !r.is_primary)
  if (!additional.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {additional.map(r => (
        <span key={r.role_key} className="text-[10px] font-semibold uppercase tracking-wide text-stone bg-linen px-2 py-0.5 rounded">
          {roleLabel(r.role_key)}
        </span>
      ))}
    </div>
  )
}
