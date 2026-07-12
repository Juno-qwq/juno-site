import Link from "next/link"
import { GlassCard } from "@/components/GlassCard"
import { SiteHeader } from "@/components/SiteHeader"
import { Sparkline } from "@/components/Sparkline"

const PILLS = ["Next.js", "React", "TypeScript", "Tailwind", "Motion"]
const STATS = [
  { label: "Articles", value: "2" },
  { label: "Projects", value: "6" },
  { label: "Notes", value: "13" },
  { label: "Days", value: "612" },
]
const VISITS = [8, 12, 9, 15, 11, 18, 14, 22, 19, 26, 21, 30]

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-4">
        {/* Hero — the real 3-layer parallax Main Card arrives in Phase 4; this is the
            themed shell + content proving tokens, fonts, glass, and the toggle. */}
        <GlassCard as="section" glow className="overflow-hidden p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.25em] text-accent-2">Welcome back, Juno</p>
          <h1 className="mt-3 font-display text-5xl font-bold leading-none text-gradient md:text-7xl">
            Good Morning
          </h1>
          <p className="mt-4 max-w-xl text-lg text-text-muted">
            I&apos;m Juno — building a digital garden for quant, AI, systems, and research.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {PILLS.map((p) => (
              <span
                key={p}
                className="rounded-full border border-card-border bg-card px-3 py-1 text-xs text-text"
              >
                {p}
              </span>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/blog/"
              className="rounded-full px-5 py-2.5 text-sm font-medium text-[var(--accent-contrast)] transition-transform hover:scale-[1.02]"
              style={{ background: "var(--accent)", boxShadow: "0 0 24px var(--glow)" }}
            >
              Read Blog →
            </Link>
            <a
              href="/garden/"
              className="rounded-full border border-card-border bg-card px-5 py-2.5 text-sm font-medium text-heading transition-colors hover:text-accent-2"
            >
              Explore Notes
            </a>
          </div>

          {/* Stat tiles row */}
          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <GlassCard key={s.label} strong className="px-4 py-3">
                <div className="text-2xl font-semibold text-heading">{s.value}</div>
                <div className="text-xs uppercase tracking-wider text-text-muted">{s.label}</div>
              </GlassCard>
            ))}
          </div>
        </GlassCard>

        {/* Demo card row: proves GlassCard + Sparkline in both themes (real cards = Phase 5) */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-heading">Total Visits</h2>
            <div className="mt-2 text-3xl font-bold text-heading">128,946</div>
            <Sparkline data={VISITS} width={220} height={40} fill className="mt-3 w-full" />
            <p className="mt-2 text-xs text-text-muted">Simulated — real counter is Phase 2 backlog.</p>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-heading">Foundation</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-text-muted">
              <li>Static export → Cloudflare Pages</li>
              <li>Shared theme + tokens with the garden</li>
              <li>Self-hosted display serif + Inter</li>
              <li>Glass primitives, no-flash toggle</li>
            </ul>
          </GlassCard>

          <GlassCard className="p-6" glow>
            <h2 className="text-xl font-semibold text-heading">Try the toggle</h2>
            <p className="mt-2 text-sm text-text-muted">
              Use the moon/sun in the header. Tokens and backdrop flip instantly with no flash, and
              the choice carries into <a href="/garden/" className="text-accent-2">the garden</a>.
            </p>
          </GlassCard>
        </div>
      </main>
    </>
  )
}
