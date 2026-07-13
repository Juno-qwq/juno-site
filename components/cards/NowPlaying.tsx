"use client"

import { useEffect, useState } from "react"
import { Pause, Play, SkipBack, SkipForward } from "lucide-react"
import { useReducedMotion } from "motion/react"
import { GlassCard } from "@/components/GlassCard"
import { useTheme } from "@/components/ThemeProvider"
import { nowPlaying, resolveArt } from "@/lib/nowPlaying"

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

const BARS = [0, 1, 2, 3, 4, 5]

export function NowPlaying() {
  const { theme } = useTheme()
  const reduced = useReducedMotion()
  const [playing, setPlaying] = useState(true)
  const [pos, setPos] = useState(nowPlaying.progressSec)

  useEffect(() => {
    if (!playing || reduced) return
    const id = setInterval(() => setPos((p) => (p + 1) % nowPlaying.durationSec), 1000)
    return () => clearInterval(id)
  }, [playing, reduced])

  const pct = (pos / nowPlaying.durationSec) * 100

  return (
    <GlassCard className="p-5">
      <div className="text-sm font-semibold uppercase tracking-wider text-heading">Now Playing</div>
      <div className="mt-3 flex gap-3">
        <div
          className="h-16 w-16 shrink-0 rounded-lg border border-card-border bg-cover bg-center"
          style={{ backgroundImage: `url(${resolveArt(nowPlaying.art, theme)})` }}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-text">{nowPlaying.title}</div>
          <div className="truncate text-xs text-text-muted">{nowPlaying.artist}</div>
          <div className="mt-2 flex h-5 items-end gap-0.5">
            {BARS.map((i) => (
              <span
                key={i}
                className={`eq-bar ${playing && !reduced ? "" : "eq-paused"}`}
                style={{ animationDelay: `${i * 0.14}s`, animationDuration: `${0.8 + i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--track)]">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--track-fill)" }} />
        </div>
        <div className="mt-1 flex justify-between text-[0.65rem] tabular-nums text-text-muted">
          <span>{fmt(pos)}</span>
          <span>{fmt(nowPlaying.durationSec)}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-5 text-text">
        <button type="button" aria-label="Previous track" className="hover:text-accent-2">
          <SkipBack size={18} />
        </button>
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => setPlaying((p) => !p)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[var(--accent-contrast)]"
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button type="button" aria-label="Next track" className="hover:text-accent-2">
          <SkipForward size={18} />
        </button>
      </div>
      {/* TODO(Phase 2): real Now Playing via Last.fm / Spotify behind lib/nowPlaying's interface. */}
    </GlassCard>
  )
}
