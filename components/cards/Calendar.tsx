"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { GlassCard } from "@/components/GlassCard"

const DOW = ["M", "T", "W", "T", "F", "S", "S"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function Calendar() {
  // Resolve "today" on the client only, so the static export doesn't bake a build-time month
  // that mismatches the viewer's date on hydration.
  const [state, setState] = useState<{ today: Date; y: number; m: number } | null>(null)
  useEffect(() => {
    const t = new Date()
    setState({ today: t, y: t.getFullYear(), m: t.getMonth() })
  }, [])

  if (!state) return <GlassCard className="min-h-[292px] p-5" />

  const { today, y, m } = state
  const startDow = (new Date(y, m, 1).getDay() + 6) % 7 // Monday-first
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array<null>(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const isToday = (d: number | null) =>
    d !== null && y === today.getFullYear() && m === today.getMonth() && d === today.getDate()

  const step = (delta: number) =>
    setState((s) => {
      if (!s) return s
      const next = new Date(s.y, s.m + delta, 1)
      return { ...s, y: next.getFullYear(), m: next.getMonth() }
    })

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wider text-heading">
          {MONTHS[m]} {y}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-card-border text-text-muted hover:text-accent-2"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next month"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-card-border text-text-muted hover:text-accent-2"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.65rem] uppercase text-text-muted">
        {DOW.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1 text-center text-xs">
        {cells.map((d, i) => (
          <div
            key={i}
            className={`flex aspect-square items-center justify-center rounded-md ${
              isToday(d)
                ? "bg-accent font-semibold text-[var(--accent-contrast)] shadow-glow"
                : d
                  ? "text-text"
                  : ""
            }`}
          >
            {d ?? ""}
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
