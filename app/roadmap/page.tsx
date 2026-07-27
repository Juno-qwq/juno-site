import type { Metadata } from "next"
import { GlassCard } from "@/components/GlassCard"
import { SiteHeader } from "@/components/SiteHeader"
import { Footer } from "@/components/Footer"
import { RoadmapGraph } from "@/components/RoadmapGraph"
import { getRoadmap } from "@/lib/roadmap"

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "Interactive learning roadmaps — a prerequisite graph from foundations to frontiers, with live progress. Physics (through the Lorenz attractor) and a life-long mathematics ladder.",
  alternates: { canonical: "/roadmap/" },
}

export default function RoadmapPage() {
  const data = getRoadmap()

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-5 pb-24 pt-6">
        <GlassCard className="p-8 md:p-10" glow>
          <p className="text-xs uppercase tracking-[0.25em] text-accent-2">Learning</p>
          <h1 className="mt-2 text-4xl font-bold text-gradient md:text-5xl">Roadmap</h1>
          <p className="mt-4 max-w-2xl text-text-muted">
            Not a reading list — a prerequisite graph. Each node is a topic; the arrows are what you
            should learn first. Progress is authored in my vault and shown live. Filter by category to
            follow one thread, or click a node for the curated path through it.
          </p>
        </GlassCard>

        <div className="mt-6">
          <RoadmapGraph data={data} />
        </div>

        <Footer />
      </main>
    </>
  )
}
