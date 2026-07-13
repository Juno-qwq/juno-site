import { GlassCard } from "@/components/GlassCard"
import { HeroMainCard } from "@/components/HeroMainCard"
import { SiteHeader } from "@/components/SiteHeader"
import { Sparkline } from "@/components/Sparkline"

const VISITS = [8, 12, 9, 15, 11, 18, 14, 22, 19, 26, 21, 30]

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-4">
        {/* The animated 3-layer parallax Main Card (Phase 4). */}
        <HeroMainCard />

        {/* Secondary demo row — real dashboard cards arrive in Phase 5. */}
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
              <li>3-layer parallax + sparkle canvas</li>
              <li>Idle drift, spring mouse parallax</li>
              <li>Reduced-motion → static poster</li>
              <li>Shared theme + tokens with the garden</li>
            </ul>
          </GlassCard>

          <GlassCard className="p-6" glow>
            <h2 className="text-xl font-semibold text-heading">Try it</h2>
            <p className="mt-2 text-sm text-text-muted">
              Move your cursor across the hero — layers shift by depth. Toggle the theme (header) to
              swap the whole scene, and the choice carries into{" "}
              <a href="/garden/" className="text-accent-2">
                the garden
              </a>
              .
            </p>
          </GlassCard>
        </div>
      </main>
    </>
  )
}
