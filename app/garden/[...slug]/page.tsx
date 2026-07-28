import "katex/dist/katex.min.css"

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getGarden, getGardenNote, getGardenNotes, titleOf } from "@/lib/garden"
import { GlassCard } from "@/components/GlassCard"
import { GardenGraph, type GraphLink, type GraphNode } from "@/components/garden/GardenGraph"
import { GardenSearch } from "@/components/garden/GardenSearch"
import { GardenHoverPreviews } from "@/components/garden/GardenHoverPreviews"

export function generateStaticParams(): { slug: string[] }[] {
  return getGardenNotes().map((n) => ({ slug: n.route.split("/") }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params
  const note = getGardenNote(slug)
  if (!note) return {}
  return { title: note.title, description: note.preview, alternates: { canonical: note.url } }
}

export default async function GardenNotePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const note = getGardenNote(slug)
  if (!note) notFound()

  const { notes, search } = getGarden()
  const previews = Object.fromEntries(search.map((s) => [s.url, { title: s.title, preview: s.preview }]))

  // Local mindmap: this note + its direct neighbours, with neighbour↔neighbour edges for context.
  const neighborUrls = [...new Set([...note.outgoing, ...note.backlinks])]
  const nodeUrls = new Set([note.url, ...neighborUrls])
  const graphNodes: GraphNode[] = [...nodeUrls].map((u) => ({ id: u, label: titleOf(u), center: u === note.url }))
  const graphLinks: GraphLink[] = []
  const seen = new Set<string>()
  for (const n of notes) {
    if (!nodeUrls.has(n.url)) continue
    for (const t of n.outgoing) {
      if (!nodeUrls.has(t)) continue
      const key = [n.url, t].sort().join("|")
      if (seen.has(key)) continue
      seen.add(key)
      graphLinks.push({ source: n.url, target: t })
    }
  }

  const backlinkNotes = note.backlinks.map((u) => ({ url: u, title: titleOf(u) }))
  const crumbs = note.folder ? note.folder.split("/") : []

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 pb-16 pt-14 lg:px-6 lg:pt-6">
      <GardenHoverPreviews previews={previews} />
      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <GlassCard as="article" className="min-w-0 p-6 md:p-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted" aria-label="Breadcrumb">
            <Link href="/garden/" className="hover:text-accent-2">Garden</Link>
            {crumbs.map((c) => (
              <span key={c} className="flex items-center gap-1.5">
                <span aria-hidden="true">/</span>
                <span>{c}</span>
              </span>
            ))}
          </nav>

          <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-heading md:text-4xl">{note.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <span className="uppercase tracking-wider text-accent-2">{note.type}</span>
            {note.tags.map((t) => (
              <span key={t} className="rounded-full bg-[var(--track)] px-2 py-0.5 text-[0.6rem] text-text">{t}</span>
            ))}
          </div>

          <hr className="my-5 border-card-border" />
          <div className="post-body" dangerouslySetInnerHTML={{ __html: note.html }} />
        </GlassCard>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-6 xl:self-start">
          <GardenSearch index={search} className="w-full" />

          <GlassCard className="p-4">
            <h2 className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-text-muted">Graph</h2>
            <GardenGraph nodes={graphNodes} links={graphLinks} />
          </GlassCard>

          {note.headings.length > 0 && (
            <GlassCard className="p-4">
              <h2 className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-text-muted">On this page</h2>
              <ul className="space-y-1 text-sm">
                {note.headings.map((h) => (
                  <li key={h.id} style={{ paddingLeft: h.level === 3 ? 12 : 0 }}>
                    <a href={`#${h.id}`} className="text-text transition-colors hover:text-accent-2">{h.text}</a>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          {backlinkNotes.length > 0 && (
            <GlassCard className="p-4">
              <h2 className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-text-muted">
                Linked from ({backlinkNotes.length})
              </h2>
              <ul className="space-y-1 text-sm">
                {backlinkNotes.map((b) => (
                  <li key={b.url}>
                    <Link href={b.url} className="text-accent-2 hover:underline">{b.title}</Link>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}
        </aside>
      </div>
    </main>
  )
}
