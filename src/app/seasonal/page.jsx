import SeasonalCalendar from '@/components/SeasonalCalendar'
import { seasonalWindows } from '@/data'

export default function SeasonalPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 pb-20">
      <div className="mb-8">
        <h1 className="font-serif text-[32px] sm:text-[40px] font-semibold tracking-tight text-soil mb-2">
          Illinois <em className="italic text-rust">Seasonal Calendar</em>
        </h1>
        <p className="text-[15px] text-stone">Plan your menu around what's coming, month by month.</p>
      </div>
      <SeasonalCalendar windows={seasonalWindows} />
    </div>
  )
}
