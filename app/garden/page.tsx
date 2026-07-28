import type { Metadata } from "next"
import Link from "next/link"
import { getGarden } from "@/lib/garden"
import { GlassCard } from "@/components/GlassCard"
import { GardenExplorer } from "@/components/garden/GardenExplorer"
import { GardenSearch } from "@/components/garden/GardenSearch"

export const metadata: Metadata = {
  title: "Notes",
  description: "Juno's digital garden — interlinked notes on quant, AI/LLM systems, C++/systems, and EEG/BCI.",
  alternates: { canonical: "/garden/" },
}

export default function GardenIndexPage() {
  const { notes, tree, search } = getGarden()
  const recent = [...notes]
    .filter((n) => n.updated)
    .sort((a, b) => (a.updated < b.updated ? 1 : -1))
    .slice(0, 8)

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 pb-16 pt-14 lg:px-6 lg:pt-6">
      <GlassCard className="p-8 md:p-10" glow>
        <p className="text-xs uppercase tracking-[0.25em] text-accent-2">Notes</p>
        <h1 className="mt-2 text-4xl font-bold text-gradient md:text-5xl">Digital Garden</h1>
        <p className="mt-3 max-w-2xl text-text-muted">
          {notes.length} interlinked notes, grown from my vault. Wander via links, search, or the tree —
          most notes are seeds that grow over time.
        </p>
        <div className="mt-5 max-w-md">
          <GardenSearch index={search} className="w-full" />
        </div>
      </GlassCard>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <GlassCard className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">Browse</h2>
          <GardenExplorer tree={tree} />
        </GlassCard>

        <GlassCard className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">Recently updated</h2>
          <ul className="space-y-2">
            {recent.map((n) => (
              <li key={n.url}>
                <Link href={n.url} className="block rounded-lg border border-card-border bg-[var(--card)] px-3 py-2 transition-colors hover:border-accent-2/50">
                  <div className="text-sm font-medium text-heading">{n.title}</div>
                  <div className="line-clamp-1 text-xs text-text-muted">{n.preview}</div>
                </Link>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </main>
  )
}
