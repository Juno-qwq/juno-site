import Link from "next/link"
import { GlassCard } from "./GlassCard"
import { SiteHeader } from "./SiteHeader"

/**
 * Structural placeholder for routes whose full content lands in a later phase (dashboard =
 * Phase 5, blog pipeline = Phase 6). The route exists, is themed, and matches the shell —
 * enough to prove the skeleton and navigation.
 */
export function PagePlaceholder({
  title,
  kicker,
  children,
}: {
  title: string
  kicker: string
  children?: React.ReactNode
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-6">
        <GlassCard className="p-8 md:p-12" glow>
          <p className="text-xs uppercase tracking-[0.25em] text-accent-2">{kicker}</p>
          <h1 className="mt-2 text-4xl font-bold text-gradient md:text-5xl">{title}</h1>
          <div className="mt-4 max-w-2xl text-text-muted">
            {children ?? <p>This page is scaffolded. Its content arrives in a later build phase.</p>}
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <Link
              href="/"
              className="rounded-full border border-card-border bg-card px-4 py-2 text-heading transition-colors hover:text-accent-2"
            >
              ← Back home
            </Link>
            <a
              href="/garden/"
              className="rounded-full border border-card-border bg-card px-4 py-2 text-heading transition-colors hover:text-accent-2"
            >
              Explore Notes →
            </a>
          </div>
        </GlassCard>
      </main>
    </>
  )
}
