import LocalNetworkCard from '@/components/LocalNetworkCard'
import { PUBLIC_NETWORK_SECTIONS } from '@/lib/businessNetwork'

// Public-facing view of a business's confirmed network — "these are the local
// businesses that make our business possible." Only ever fed accepted + public
// relationships (see getPublicNetwork in src/lib/networkQueries.js); pending or
// private relationships never reach this component at all.
export default function OurLocalNetworkSection({ network, businessName }) {
  // Derived from the vocabulary itself, not a hardcoded copy of its keys — a new
  // relationship type added to PUBLIC_NETWORK_SECTIONS shows up here automatically
  // instead of silently rendering nothing until this array is remembered too.
  const groups = Object.keys(PUBLIC_NETWORK_SECTIONS).map(key => ({
    key, ...PUBLIC_NETWORK_SECTIONS[key],
    entries: network.filter(e => e.perspective === key),
  }))
  const total = network.length

  if (total === 0) {
    return (
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h2 className="font-serif text-[13px] font-semibold tracking-[.15em] uppercase text-stone whitespace-nowrap">Our Local Network</h2>
          <div className="flex-1 h-px bg-[#ECEAE4]" />
        </div>
        <div className="bg-linen rounded-xl p-8 text-center">
          <p className="text-[14px] text-stone">{businessName} is building their local food network.</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center gap-4 mb-2">
        <h2 className="font-serif text-[13px] font-semibold tracking-[.15em] uppercase text-stone whitespace-nowrap">Our Local Network</h2>
        <div className="flex-1 h-px bg-[#ECEAE4]" />
      </div>
      <p className="text-[13px] text-stone mb-6">The local businesses that make {businessName} possible.</p>

      <div className="flex flex-col gap-9">
        {groups.map(group => group.entries.length > 0 && (
          <div key={group.key}>
            <div className="text-[12px] font-semibold uppercase tracking-widest text-rust mb-0.5">{group.title}</div>
            <p className="text-[12px] text-stone mb-3">{group.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.entries.map(entry => <LocalNetworkCard key={entry.id} entry={entry} showRelationshipLabel={false} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
