import Link from 'next/link'

export default function ProducerRepliesContent({ replies }) {
  return (
    <div>
      <p className="text-[13px] text-stone mb-5">Replies from producers you've messaged or sent an open request to.</p>
      {!replies?.length ? (
        <div className="bg-white border border-[#ECEAE4] rounded-xl py-16 text-center">
          <p className="text-[14px] text-stone">No replies yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {replies.map(m => (
            <div key={m.id} className="bg-white border border-[#ECEAE4] rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-2.5">
                <Link href={`/producers/${m.farm?.slug}`} className="text-[14px] font-semibold text-soil hover:text-rust transition-colors">
                  {m.farm?.name || 'A producer'}
                </Link>
                <div className="text-[11px] text-stone flex-shrink-0">{new Date(m.created_at).toLocaleDateString()}</div>
              </div>
              <p className="text-[13px] text-stone leading-relaxed">{m.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
