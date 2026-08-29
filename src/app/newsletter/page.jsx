import { createClient } from '@/lib/supabase/server'
import { getInitials } from '@/lib/initials'
import NewsletterForm from '@/components/NewsletterForm'

export const metadata = {
  title: "The Grano Weekly | Grano",
  description: "What's happening in Chicago's local food system, every Monday morning.",
}

function nextMonday() {
  const d = new Date()
  const day = d.getDay() // 0 = Sun
  const daysUntilMonday = (8 - day) % 7 || 7
  d.setDate(d.getDate() + daysUntilMonday)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function NewsletterPage() {
  const supabase = createClient()
  const { data: recentProducts } = await supabase
    .from('products')
    .select('name, price, unit, badge, created_at, farm:farms(name, location)')
    .eq('for_sale', true)
    .order('created_at', { ascending: false })
    .limit(4)

  const preview = (recentProducts || []).map(p => ({
    name: p.name,
    detail: `${p.farm?.name || 'Chicago producer'} · $${p.price}/${p.unit}${p.farm?.location ? ` · ${p.farm.location}` : ''}`,
    badge: p.badge || 'New',
  }))

  return (
    <div className="bg-soil min-h-screen py-10 sm:py-16 px-4 sm:px-8">
      <div className="max-w-[640px] mx-auto">
        <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[.2em] uppercase text-wheat mb-5">
          <span className="w-7 h-px bg-wheat inline-block" />
          Every Monday morning
        </div>
        <h1 className="font-serif font-light text-[clamp(40px,6vw,72px)] text-white tracking-tight leading-[1.05] mb-5">
          The Grano <em className="italic text-wheat">Weekly</em>.
        </h1>
        <p className="text-[16px] font-light text-white/50 leading-relaxed mb-12">
          What's happening in Chicago's local food system — what was picked yesterday, what's about to go out of season, new producers joining, what restaurants are sourcing, and the stories behind who's making it.
        </p>

        {/* PREVIEW */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 mb-12">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-white/8">
            <div>
              <div className="text-[13px] font-semibold text-white/70">Grano · Chicago's Local Food Network</div>
              <div className="text-[12px] text-white/30">Next issue: {nextMonday()} · 6:00am</div>
            </div>
          </div>
          <div className="font-serif text-[26px] font-semibold text-white mb-5 tracking-tight leading-tight">
            {preview.length
              ? `${preview.length} product${preview.length === 1 ? '' : 's'} from Chicago-area producers, this week.`
              : 'Sign up to get notified as producers start listing.'}
          </div>
          {preview.length ? preview.map(item => (
            <div key={item.name} className="flex items-center gap-3 py-2.5 border-b border-white/6 last:border-0">
              <span className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0 font-serif text-[12px] font-semibold text-white/50">{getInitials(item.name)}</span>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-white/85">{item.name}</div>
                <div className="text-[12px] text-white/40">{item.detail}</div>
              </div>
              <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded flex-shrink-0 bg-[rgba(74,122,81,.3)] text-[#7EC985]">
                {item.badge}
              </span>
            </div>
          )) : (
            <p className="text-[13px] text-white/40">Nothing listed yet — this is where new products will show up as producers join.</p>
          )}
        </div>

        {/* FORM */}
        <NewsletterForm />
      </div>
    </div>
  )
}
