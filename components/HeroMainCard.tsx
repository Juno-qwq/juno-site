"use client"

import Link from "next/link"
import { HeroParallax, type HeroLayer } from "./HeroParallax"

// Both theme layer sets are rendered and gated by CSS on [data-theme] (set pre-paint), so
// the correct art shows on the first frame — no flash on a dark refresh — while allowing
// per-theme behavior (light halo twinkles; dark orb/orbit live on the right).
//
// Dark orb + orbit share this box: a square anchored to the right of the card, so the orbit
// (transform-origin: center) spins around the orb's center. Same depth + phase keeps them
// locked together as they drift.
const ORB_BOX: React.CSSProperties = {
  top: "50%",
  right: "2%",
  left: "auto",
  bottom: "auto",
  // A square a bit taller than the card (overflow clipped) so the orb/orbit read large;
  // `cover` scales the centered art up to fill it. Tune size via `height`, position via
  // `right`, zoom via `backgroundSize`.
  height: "128%",
  width: "auto",
  aspectRatio: "1 / 1",
  backgroundSize: "cover",
  backgroundPosition: "center",
  transformOrigin: "center center",
}
const ORB_DEPTH = 0.8
const ORB_PHASE = 2.0
// Shared spin speed for the dark orbit + light halo (deg/s). Bumped up from the old 1.2.
const ORBIT_SPEED = 5

// The light halo ring sits on the right of its image; keep the layer full-bleed but pivot
// rotation on the ring's center so it spins in place (not around the card center). Tune the
// origin if the ring drifts as it spins.
const HALO_BOX: React.CSSProperties = {
  inset: "-6%",
  backgroundSize: "cover",
  backgroundPosition: "center",
  transformOrigin: "68% 46%",
}

const LAYERS: HeroLayer[] = [
  // Dark: void (far) / orbit (spins around orb, right) / orb (drifts, right).
  { src: "/hero/dark/layer_0.png", depth: 0.16, theme: "dark", phase: 0 },
  {
    src: "/hero/dark/layer_1.png",
    depth: ORB_DEPTH,
    theme: "dark",
    rotate: true,
    rotateSpeed: ORBIT_SPEED,
    box: ORB_BOX,
    baseTransform: "translateY(-50%)",
    phase: ORB_PHASE,
  },
  {
    src: "/hero/dark/layer_2.png",
    depth: ORB_DEPTH,
    theme: "dark",
    box: ORB_BOX,
    baseTransform: "translateY(-50%)",
    phase: ORB_PHASE,
  },
  // Light: sky+water (far) / halo (twinkles) / city+lamppost (near).
  { src: "/hero/light/layer_0.png", depth: 0.16, theme: "light", phase: 0 },
  {
    src: "/hero/light/layer_1.png",
    depth: 0.45,
    theme: "light",
    rotate: true,
    rotateSpeed: ORBIT_SPEED,
    box: HALO_BOX,
    phase: 1.2,
  },
  { src: "/hero/light/layer_2.png", depth: 0.95, theme: "light", phase: 2.4 },
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
