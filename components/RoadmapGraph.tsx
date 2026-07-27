"use client"

import dagre from "@dagrejs/dagre"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BookOpen, Circle, ExternalLink, FileBox, FileText, Github,
  GraduationCap, MousePointerClick, Video, X,
} from "lucide-react"
import { GlassCard } from "@/components/GlassCard"
import type { RoadmapData, RoadmapNode, ResourceKind } from "@/lib/roadmap-types"

// ---------------------------------------------------------------------------
// Static maps
// ---------------------------------------------------------------------------

const KIND_ICON: Record<ResourceKind, React.ComponentType<{ size?: number; className?: string }>> = {
  course: GraduationCap, book: BookOpen, paper: FileText, repo: Github,
  video: Video, interactive: MousePointerClick, pdf: FileBox, topic: Circle,
}
const KIND_LABEL: Record<ResourceKind, string> = {
  course: "Course", book: "Book", paper: "Paper", repo: "Repo",
  video: "Video", interactive: "Interactive", pdf: "PDF (local)", topic: "Topic",
}

// Vivid hues that read on both light and dark glass. Assigned per category, stably by index.
const CAT_HUES = ["#6f86d6", "#2dd4bf", "#d3a24a", "#b483f0", "#e06c9f", "#5bb3e6", "#8bc34a", "#f0883e"]

const NODE_W = 212
const NODE_H = 68

// ---------------------------------------------------------------------------
// Layout (dagre) — deterministic, so it's SSR-safe and hydrates without mismatch.
// ---------------------------------------------------------------------------

type Placed = { node: RoadmapNode; x: number; y: number }
type GroupBox = { id: string; title: string; x: number; y: number; w: number; h: number }
type Layout = {
  placed: Placed[]
  groups: GroupBox[]
  edges: { id: string; d: string }[]
  width: number
  height: number
}

function computeLayout(nodes: RoadmapNode[], edges: { from: string; to: string }[]): Layout {
  const ids = new Set(nodes.map((n) => n.id))
  // A node used as someone's `group` renders as a container box, not a chip.
  const groupIds = new Set(nodes.map((n) => n.group).filter((g): g is string => !!g && ids.has(g)))
  const chips = nodes.filter((n) => !groupIds.has(n.id))
  const byId = new Map(nodes.map((n) => [n.id, n]))

  const g = new dagre.graphlib.Graph({ compound: true })
  g.setGraph({ rankdir: "TB", nodesep: 26, ranksep: 62, marginx: 24, marginy: 24 })
  g.setDefaultEdgeLabel(() => ({}))

  for (const gid of groupIds) g.setNode(gid, { label: gid })
  for (const n of chips) {
    g.setNode(n.id, { width: NODE_W, height: NODE_H })
    if (n.group && groupIds.has(n.group)) g.setParent(n.id, n.group)
  }
  for (const e of edges) {
    if (g.hasNode(e.from) && g.hasNode(e.to) && !groupIds.has(e.from) && !groupIds.has(e.to)) {
      g.setEdge(e.from, e.to)
    }
  }
  dagre.layout(g)

  const placed: Placed[] = chips.map((n) => {
    const p = g.node(n.id)
    return { node: n, x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 }
  })

  const groups: GroupBox[] = [...groupIds].map((gid) => {
    const p = g.node(gid)
    return { id: gid, title: byId.get(gid)?.title ?? gid, x: p.x - p.width / 2, y: p.y - p.height / 2, w: p.width, h: p.height }
  })

  const edgePaths = g.edges().map((e) => {
    const pts = g.edge(e).points as { x: number; y: number }[]
    const d = pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x},${pt.y}`).join(" ")
    return { id: `${e.v}->${e.w}`, d }
  })

  const graph = g.graph()
  return { placed, groups, edges: edgePaths, width: graph.width ?? 0, height: graph.height ?? 0 }
}

// ---------------------------------------------------------------------------
// Progress ring
// ---------------------------------------------------------------------------

function ProgressRing({ value, size = 26 }: { value: number; size?: number }) {
  const r = (size - 4) / 2
  const c = 2 * Math.PI * r
  const done = value >= 100
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={3} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={done ? "var(--accent)" : "var(--accent-2)"} strokeWidth={3} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle"
        fontSize={size * 0.3} fill="var(--text)" fontWeight="600">
        {value}
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RoadmapGraph({ data }: { data: RoadmapData }) {
  const roadmapIds = data.roadmaps.map((r) => r.id)
  // Physics is the headline roadmap (foundations → Lorenz); lead with it when present.
  const [roadmap, setRoadmap] = useState(roadmapIds.includes("physics") ? "physics" : roadmapIds[0] ?? "")
  const [category, setCategory] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })

  // Deep-link a node (and its roadmap) from ?node=<id> so panels are shareable.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("node")
    if (!id) return
    const target = data.nodes.find((n) => n.id === id)
    if (!target) return
    if (!target.roadmaps.includes(roadmap)) setRoadmap(target.roadmaps[0])
    setSelected(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const viewportRef = useRef<HTMLDivElement>(null)
  const pan = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)

  const meta = data.roadmaps.find((r) => r.id === roadmap)
  const allCats = meta?.categories ?? []

  // Reset the category when switching roadmaps if it no longer applies.
  useEffect(() => {
    if (category && !allCats.includes(category)) setCategory(null)
  }, [roadmap, category, allCats])

  const visibleNodes = useMemo(
    () =>
      data.nodes.filter(
        (n) => n.roadmaps.includes(roadmap) && (!category || n.categories.includes(category)),
      ),
    [data.nodes, roadmap, category],
  )

  // Drop the panel if a filter hides the selected node.
  useEffect(() => {
    if (selected && !visibleNodes.some((n) => n.id === selected)) setSelected(null)
  }, [visibleNodes, selected])

  const layout = useMemo(() => {
    const ids = new Set(visibleNodes.map((n) => n.id))
    const edges = data.edges.filter((e) => ids.has(e.from) && ids.has(e.to))
    return computeLayout(visibleNodes, edges)
  }, [visibleNodes, data.edges])

  // Tab/reading order: top-to-bottom, left-to-right — foundations first.
  const ordered = useMemo(
    () => [...layout.placed].sort((a, b) => a.y - b.y || a.x - b.x).map((p) => p.node),
    [layout],
  )

  const selectedNode = selected ? data.nodes.find((n) => n.id === selected) ?? null : null

  // Fit the graph to the viewport whenever the visible set changes.
  const fit = useCallback(() => {
    const el = viewportRef.current
    if (!el || !layout.width || !layout.height) return
    const pad = 32
    const k = Math.min(
      (el.clientWidth - pad) / layout.width,
      (el.clientHeight - pad) / layout.height,
      1.1,
    )
    setView({
      k,
      x: (el.clientWidth - layout.width * k) / 2,
      y: Math.max(pad / 2, (el.clientHeight - layout.height * k) / 2),
    })
  }, [layout])

  useEffect(() => {
    fit()
  }, [fit])

  // Non-passive wheel zoom (React onWheel is passive → can't preventDefault).
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      setView((v) => {
        const k = Math.min(2.2, Math.max(0.3, v.k * (e.deltaY < 0 ? 1.12 : 0.89)))
        const ratio = k / v.k
        return { k, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio }
      })
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return // let node clicks through
    pan.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pan.current) return
    setView((v) => ({ ...v, x: pan.current!.vx + (e.clientX - pan.current!.x), y: pan.current!.vy + (e.clientY - pan.current!.y) }))
  }
  const endPan = () => {
    pan.current = null
  }

  const catColor = (cat: string) => CAT_HUES[Math.max(0, allCats.indexOf(cat)) % CAT_HUES.length]
  const primaryHue = (n: RoadmapNode) => (n.categories.length ? catColor(n.categories[0]) : "var(--accent-2)")

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-card-border bg-[var(--card)] p-1">
          {data.roadmaps.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setRoadmap(r.id)
                setSelected(null)
              }}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
                roadmap === r.id ? "bg-[var(--card-strong)] font-medium text-heading shadow-glass" : "text-text hover:text-accent-2"
              }`}
            >
              {r.id} <span className="text-text-muted">· {r.count}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-text-muted">
          {meta ? `${meta.avgProgress}% average progress` : ""}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={category === null} onClick={() => setCategory(null)} label="All" />
        {allCats.map((c) => (
          <FilterChip
            key={c}
            active={category === c}
            onClick={() => setCategory((cur) => (cur === c ? null : c))}
            label={c}
            color={catColor(c)}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Graph viewport */}
        <GlassCard className="relative overflow-hidden p-0" style={{ height: 560 }}>
          <div
            ref={viewportRef}
            className="h-full w-full touch-none select-none"
            style={{ cursor: pan.current ? "grabbing" : "grab" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPan}
            onPointerCancel={endPan}
          >
            <div
              className="relative origin-top-left"
              style={{
                width: layout.width,
                height: layout.height,
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
              }}
            >
              {/* Group boxes (behind) */}
              {layout.groups.map((grp) => (
                <button
                  key={grp.id}
                  data-node
                  type="button"
                  onClick={() => setSelected(grp.id)}
                  className="absolute rounded-2xl border border-dashed border-card-border bg-[var(--card)]/40 text-left"
                  style={{ left: grp.x, top: grp.y, width: grp.w, height: grp.h }}
                >
                  <span className="absolute -top-2.5 left-3 rounded-full border border-card-border bg-[var(--card-strong)] px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wider text-text-muted">
                    {grp.title}
                  </span>
                </button>
              ))}

              {/* Edges */}
              <svg
                className="pointer-events-none absolute inset-0"
                width={layout.width}
                height={layout.height}
                style={{ overflow: "visible" }}
                aria-hidden="true"
              >
                <defs>
                  <marker id="rm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M0,0 L10,5 L0,10 z" fill="var(--accent-2)" opacity="0.55" />
                  </marker>
                </defs>
                {layout.edges.map((e) => (
                  <path
                    key={e.id}
                    d={e.d}
                    fill="none"
                    stroke="var(--accent-2)"
                    strokeOpacity={0.4}
                    strokeWidth={1.5}
                    markerEnd="url(#rm-arrow)"
                  />
                ))}
              </svg>

              {/* Node chips (topological DOM order for sane tabbing) */}
              {ordered.map((n) => {
                const p = layout.placed.find((pl) => pl.node.id === n.id)!
                const Icon = KIND_ICON[n.resourceKind]
                const isSel = selected === n.id
                return (
                  <button
                    key={n.id}
                    data-node
                    type="button"
                    onClick={() => setSelected(n.id)}
                    title={n.title}
                    className={`absolute flex items-center gap-2 rounded-xl border bg-[var(--card-strong)] px-2.5 py-2 text-left shadow-glass backdrop-blur-glass transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-2 ${
                      isSel ? "border-accent-2" : "border-card-border"
                    }`}
                    style={{ left: p.x, top: p.y, width: NODE_W, height: NODE_H, borderLeftColor: primaryHue(n), borderLeftWidth: 3 }}
                  >
                    <Icon size={16} className="shrink-0 text-text-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[0.8rem] font-medium leading-tight text-heading">{n.title}</span>
                      <span className="mt-0.5 block truncate text-[0.6rem] uppercase tracking-wide text-text-muted">
                        {KIND_LABEL[n.resourceKind]}
                      </span>
                    </span>
                    <ProgressRing value={n.progress} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-3 right-3 flex gap-1">
            <ZoomBtn label="Zoom out" onClick={() => setView((v) => ({ ...v, k: Math.max(0.3, v.k * 0.85) }))}>−</ZoomBtn>
            <ZoomBtn label="Fit" onClick={fit}>⤢</ZoomBtn>
            <ZoomBtn label="Zoom in" onClick={() => setView((v) => ({ ...v, k: Math.min(2.2, v.k * 1.15) }))}>＋</ZoomBtn>
          </div>
        </GlassCard>

        {/* Detail panel */}
        <div className="min-w-0">
          {selectedNode ? (
            <NodePanel node={selectedNode} allNodes={data.nodes} onSelect={setSelected} onClose={() => setSelected(null)} />
          ) : (
            <GlassCard className="p-5 text-sm text-text-muted">
              <p>Select a node to see the path, resources, and what it unlocks.</p>
              <p className="mt-2">Arrows point from a <span className="text-text">prerequisite</span> to what it unlocks. Filter by category to focus one thread.</p>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Accessible fallback: the same graph as a keyboard-navigable prerequisite list. */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-accent-2">List view (accessible)</summary>
        <nav aria-label={`${roadmap} roadmap, ordered by prerequisite`} className="mt-3">
          <ol className="space-y-2">
            {ordered.map((n) => (
              <li key={n.id} className="text-sm">
                <a href={n.route} className="font-medium text-heading hover:text-accent-2">{n.title}</a>
                <span className="text-text-muted">
                  {" "}— {KIND_LABEL[n.resourceKind]}, {n.progress}% done
                  {n.prerequisites.length > 0 && (
                    <> · needs {n.prerequisites.map((p) => data.nodes.find((x) => x.id === p)?.title ?? p).join(", ")}</>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </details>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bits
// ---------------------------------------------------------------------------

function FilterChip({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[28px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${
        active ? "border-accent-2 bg-[var(--card-strong)] text-heading" : "border-card-border bg-[var(--card)] text-text-muted hover:text-accent-2"
      }`}
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
      {label.replace(/-/g, " ")}
    </button>
  )
}

function ZoomBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-card-border bg-[var(--card-strong)] text-heading backdrop-blur-glass hover:text-accent-2"
    >
      {children}
    </button>
  )
}

function NodePanel({
  node, allNodes, onSelect, onClose,
}: {
  node: RoadmapNode
  allNodes: RoadmapNode[]
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const Icon = KIND_ICON[node.resourceKind]
  const prereqNodes = node.prerequisites.map((p) => allNodes.find((n) => n.id === p)).filter(Boolean) as RoadmapNode[]
  return (
    <GlassCard className="p-5" glow>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
          <Icon size={14} /> {KIND_LABEL[node.resourceKind]}
        </div>
        <button type="button" aria-label="Close" onClick={onClose} className="text-text-muted hover:text-accent-2">
          <X size={16} />
        </button>
      </div>
      <h2 className="mt-1 font-display text-xl font-bold leading-tight text-heading">{node.title}</h2>

      {/* Progress */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Progress</span>
          <span className="text-text">{node.progress}%</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--track)]">
          <div className="h-full rounded-full" style={{ width: `${node.progress}%`, background: "var(--track-fill)" }} />
        </div>
      </div>

      {/* Categories */}
      <div className="mt-3 flex flex-wrap gap-1">
        {node.categories.map((c) => (
          <span key={c} className="rounded-full bg-[var(--track)] px-2 py-0.5 text-[0.6rem] capitalize text-text">
            {c.replace(/-/g, " ")}
          </span>
        ))}
      </div>

      {/* Prerequisites */}
      {prereqNodes.length > 0 && (
        <div className="mt-3 text-xs">
          <div className="text-text-muted">Prerequisites</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {prereqNodes.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p.id)}
                className="rounded-md border border-card-border bg-[var(--card)] px-2 py-0.5 text-text transition-colors hover:text-accent-2"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="post-body mt-4 text-sm" dangerouslySetInnerHTML={{ __html: node.html }} />

      {/* Links */}
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {node.resourceUrl && (
          <a
            href={node.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium text-[var(--accent-contrast)]"
            style={{ background: "var(--accent)" }}
          >
            Open resource <ExternalLink size={13} />
          </a>
        )}
        <a
          href={node.route}
          className="inline-flex items-center gap-1 rounded-lg border border-card-border bg-card px-3 py-1.5 text-heading transition-colors hover:text-accent-2"
        >
          Open note →
        </a>
      </div>
    </GlassCard>
  )
}
