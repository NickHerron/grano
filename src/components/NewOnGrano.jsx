import ProducerCard from '@/components/ProducerCard'

export default function NewOnGrano({ producers }) {
  if (!producers?.length) return null

  return (
    <section className="bg-paper border-b border-hair">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <p className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-gold mb-3">
          New on Grano
        </p>
        <h2 className="font-serif text-[28px] sm:text-[34px] font-medium text-ink mb-2">
          Meet the newest food businesses joining your community.
        </h2>
        <p className="text-[15px] text-stone mb-8 max-w-[640px]">
          A free profile works even if they’re not selling on Grano yet.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {producers.map(f => <ProducerCard key={f.slug} farm={f} />)}
        </div>
      </div>
    </section>
  )
}
