"use client"

import { useEffect, useState } from "react"
import { GlassCard } from "@/components/GlassCard"
import { learning } from "@/lib/learning"

export function CurrentlyLearning() {
  // Bars animate from 0 → pct on mount via CSS width transition (reduced-motion-safe: the
  // transition is simply skipped by the browser under prefers-reduced-motion).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Show only the top few so this card matches the height of Recent Posts / Now Playing.
  const tracks = learning.slice(0, 3)

  return (
    <GlassCard className="p-5">
      <h2 className="text-lg font-semibold text-heading">Currently Learning</h2>
      <div className="mt-4 flex flex-col gap-3">
        {tracks.map((t) => (
          <a key={t.label} href={t.garden} className="group block">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text transition-colors group-hover:text-accent-2">{t.label}</span>
              <span className="text-text-muted">{t.pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--track)]">
              <div
                className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                style={{ width: mounted ? `${t.pct}%` : "0%", background: "var(--track-fill)" }}
              />
            </div>
          </a>
        ))}
      </div>
    </GlassCard>
  )
}
