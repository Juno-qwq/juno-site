"use client"

import Link from "next/link"
import { HeroParallax, type HeroLayer } from "./HeroParallax"

// Theme swapping is entirely CSS-driven (image sources come from CSS variables in
// tokens.css that flip on [data-theme], which the pre-hydration script sets before first
// paint). That means NO flash of the wrong-theme art on a dark refresh, and no dependency
// on React theme state here.
const LAYERS: HeroLayer[] = [
  { src: "var(--hero-layer-0)", depth: 0.16 }, // sky+water / void (far)
  { src: "var(--hero-layer-1)", depth: 0.45, rotate: true }, // moon-ring / orbital rings (mid)
  { src: "var(--hero-layer-2)", depth: 0.95 }, // city+lamppost / wireframe globe (near)
]

// SparkleCanvas reads its actual colors from --sparkle-a/--sparkle-b (theme-swapped); the
// `color` prop is only a fallback if those vars are missing.
const SPARKLE = { count: 50, color: ["#e0b45f", "#d3a24a"], speed: 0.55 } as const

const PILLS = ["Next.js", "React", "TypeScript", "Tailwind", "Motion"]
const STATS = [
  { label: "Articles", value: "2" },
  { label: "Projects", value: "6" },
  { label: "Notes", value: "13" },
  { label: "Days", value: "612" },
]

export function HeroMainCard() {
  return (
    <HeroParallax
      layers={LAYERS}
      sparkle={SPARKLE}
      poster="var(--hero-poster)"
      scrimClassName="hero-scrim"
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
