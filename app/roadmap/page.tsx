import type { Metadata } from "next"
import { RoadmapGraph } from "@/components/RoadmapGraph"
import { getRoadmap } from "@/lib/roadmap"

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "Interactive learning roadmaps — a high-level prerequisite graph across Mathematics, Physics, Computer Science, Artificial Intelligence, Quantitative Finance, and Music Composition, with live progress.",
  alternates: { canonical: "/roadmap/" },
}

export default function RoadmapPage() {
  const data = getRoadmap()

  // Full-height, no preamble: the tabs + graph fill the viewport so the roadmap is visible
  // immediately — no scrolling past a header or filters first.
  return (
    <main id="main-content" className="flex h-[100dvh] flex-col px-4 pb-3 pt-14 lg:px-6 lg:pt-4">
      <RoadmapGraph data={data} />
    </main>
  )
}
