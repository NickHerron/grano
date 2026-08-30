import Link from 'next/link'

export default function ForRestaurants({ hasSourcing = false }) {
  return (
    <section className="bg-paper border-t border-hair">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <p className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-gold mb-3">
          For restaurants
        </p>
        <h2 className="font-serif text-[28px] sm:text-[34px] font-medium text-ink mb-3">
          Find local producers and specialty suppliers.
        </h2>
        <p className="text-[15px] text-stone mb-6 max-w-[560px]">
          Need a bakery, farm, coffee roaster, specialty food producer, or local ingredient?
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/producers" className="text-[15px] font-semibold text-brick hover:underline">
            Find suppliers →
          </Link>
          {hasSourcing && (
            <Link href="/sourcing-requests" className="text-[15px] font-semibold text-brick hover:underline">
              What’s needed →
            </Link>
          )}
          <Link href="/signup?as=restaurant" className="text-[15px] font-semibold text-stone hover:text-brick">
            Create a restaurant profile
          </Link>
        </div>
      </div>
    </section>
  )
}
