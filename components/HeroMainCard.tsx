"use client"

import Link from "next/link"
import { useTheme } from "./ThemeProvider"
import { HeroParallax, type HeroLayer } from "./HeroParallax"

// Light: sky+water (far) / moon-ring (mid, rotating) / city+lamppost (near).
// Dark:  void (far) / orbital rings (mid, rotating) / wireframe globe (near).
const CONFIG = {
  light: {
    layers: [
      { src: "/hero/light/layer_0.png", depth: 0.16 },
      { src: "/hero/light/layer_1.png", depth: 0.45, rotate: true },
      { src: "/hero/light/layer_2.png", depth: 0.95 },
    ] as HeroLayer[],
    sparkle: { count: 42, color: "#e0b45f", speed: 0.5 }, // warm gold
    poster: "/hero/poster_light.png",
    scrim: "bg-gradient-to-r from-white/75 via-white/35 to-transparent",
  },
  dark: {
    layers: [
      { src: "/hero/dark/layer_0.png", depth: 0.16 },
      { src: "/hero/dark/layer_1.png", depth: 0.45, rotate: true },
      { src: "/hero/dark/layer_2.png", depth: 0.95 },
    ] as HeroLayer[],
    sparkle: { count: 56, color: ["#2dd4bf", "#b483f0"], speed: 0.6 }, // cyan/violet
    poster: "/hero/poster_dark.png",
    scrim: "bg-gradient-to-r from-[#0a0e1a]/85 via-[#0a0e1a]/45 to-transparent",
  },
} as const

const PILLS = ["Next.js", "React", "TypeScript", "Tailwind", "Motion"]
const STATS = [
  { label: "Articles", value: "2" },
  { label: "Projects", value: "6" },
  { label: "Notes", value: "13" },
  { label: "Days", value: "612" },
]

export function HeroMainCard() {
  const { theme } = useTheme()
  const cfg = CONFIG[theme]

  return (
    <HeroParallax
      layers={cfg.layers}
      sparkle={cfg.sparkle}
      poster={cfg.poster}
      scrimClassName={cfg.scrim}
      className="min-h-[460px] border border-card-border shadow-glass md:min-h-[520px]"
    >
      <div className="px-7 py-9 md:px-12 md:py-12">
        <p className="text-xs uppercase tracking-[0.28em] text-accent-2">Welcome back, Juno</p>
        <h1 className="mt-3 font-display text-6xl font-bold leading-[0.95] text-gradient md:text-8xl">
          Good Morning
        </h1>
        <p className="mt-4 max-w-xl text-lg text-text">
          I&apos;m Juno — building a digital garden for quant, AI, systems, and research.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {PILLS.map((p) => (
            <span
              key={p}
              className="rounded-full border border-card-border bg-card px-3 py-1 text-xs text-text backdrop-blur-glass"
            >
              {p}
            </span>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/blog/"
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] transition-transform hover:scale-[1.03]"
            style={{ background: "var(--accent)", boxShadow: "0 0 24px var(--glow)" }}
          >
            Read Blog →
          </Link>
          <a
            href="/garden/"
            className="rounded-full border border-card-border bg-card px-5 py-2.5 text-sm font-semibold text-heading backdrop-blur-glass transition-colors hover:text-accent-2"
          >
            Explore Notes
          </a>
        </div>

        <div className="mt-9 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-card-border bg-[var(--card-strong)] px-4 py-3 backdrop-blur-glass"
            >
              <div className="text-2xl font-semibold text-heading">{s.value}</div>
              <div className="text-[0.7rem] uppercase tracking-wider text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </HeroParallax>
  )
}
