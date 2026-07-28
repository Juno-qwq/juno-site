/**
 * Shared roadmap types — safe on both the server (page) and client (graph). The filesystem
 * reader lives in lib/roadmap.ts (server-only); this file carries only the shapes so the client
 * component can import them as types without pulling node:fs into the browser bundle.
 */

export type ResourceKind =
  | "course" | "book" | "paper" | "repo" | "video" | "interactive" | "pdf" | "topic"

export type RoadmapNode = {
  id: string
  title: string
  roadmaps: string[]
  categories: string[]
  progress: number
  resourceKind: ResourceKind
  /** Public http(s) link, or "" — the extractor strips local/PDF/pirated URLs. */
  resourceUrl: string
  /** id of the course node this belongs to, or null. */
  group: string | null
  level: number
  prerequisites: string[]
  /** The node's own garden page (always present — nodes are publish:true). */
  route: string
  /** Garden URL of the milestone's concept cluster (hub/MOC), or "" if none/unpublished. */
  conceptMapUrl: string
  /** Rendered note body (wikilinks already resolved). */
  html: string
}

export type RoadmapEdge = { from: string; to: string }

export type RoadmapMeta = {
  id: string
  count: number
  categories: string[]
  avgProgress: number
}

export type RoadmapData = {
  generatedAt: string
  roadmaps: RoadmapMeta[]
  nodes: RoadmapNode[]
  edges: RoadmapEdge[]
}
