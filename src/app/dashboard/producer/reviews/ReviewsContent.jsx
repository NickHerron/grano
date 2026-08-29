import ReviewInvites from './ReviewInvites'

export default function ReviewsContent({ farmId, slug, invites, reviews }) {
  return (
    <div>
      <p className="text-[13px] text-stone mb-5">
        Customers who order through Grano can review you automatically. Sold to someone at a market or wholesale?
        Send them a one-time review link below.
      </p>
      <ReviewInvites farmId={farmId} slug={slug} initialInvites={invites} />

      <div className="mt-10">
        <h2 className="font-serif text-[18px] font-semibold text-soil mb-3">All reviews ({(reviews || []).length})</h2>
        {reviews?.length ? (
          <div className="flex flex-col gap-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-white border border-[#ECEAE4] rounded-xl p-4">
                <div className="flex justify-between items-start mb-1.5">
                  <div className="text-[13px] font-semibold text-soil">{r.buyer?.restaurant_name || r.buyer?.full_name || 'A customer'}</div>
                  <div className="text-wheat text-[12px]">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                </div>
                {r.text && <p className="text-[13px] text-stone leading-relaxed">"{r.text}"</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-stone">No reviews yet.</p>
        )}
      </div>
    </div>
  )
}
