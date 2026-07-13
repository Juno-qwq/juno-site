import { Quote } from "lucide-react"
import { GlassCard } from "@/components/GlassCard"
import { dailyReminder } from "@/lib/site"

export function DailyReminder() {
  return (
    <GlassCard className="p-5" glow>
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-heading">
        <Quote size={15} className="text-accent-2" />
        Daily Reminder
      </div>
      <p className="mt-3 font-display text-xl leading-snug text-heading">{dailyReminder.text}</p>
    </GlassCard>
  )
}
