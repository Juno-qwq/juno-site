"use client"

import "@xyflow/react/dist/style.css"

import dagre from "@dagrejs/dagre"
import {
  Background, BackgroundVariant, Controls, Handle, MarkerType,
  Position, ReactFlow, ReactFlowProvider, useReactFlow,
  type Edge, type Node, type NodeProps,
} from "@xyflow/react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BookOpen, ChevronLeft, ChevronRight, Circle, ExternalLink, FileBox, FileText, Github,
  GraduationCap, MousePointerClick, Video, Waypoints, X,
} from "lucide-react"
import { GlassCard } from "@/components/GlassCard"
import { useTheme } from "@/components/ThemeProvider"
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

// Vivid hues that read on both light and dark glass, assigned per category by index.
const CAT_HUES = ["#6f86d6", "#2dd4bf", "#d3a24a", "#b483f0", "#e06c9f", "#5bb3e6", "#8bc34a", "#f0883e"]

const NODE_W = 210
const NODE_H = 64

// Pinch-zoom sensitivity for our custom handler. d3-zoom's built-in pinch is ~0.0139; higher =
// faster. React Flow exposes no pinch-speed prop, so we drive zoom ourselves (see Flow's wheel
// effect) to make the gesture feel responsive.
const ZOOM_SENSITIVITY = 0.032
const MIN_ZOOM = 0.25
const MAX_ZOOM = 2.6

// ---------------------------------------------------------------------------
// Custom node
// ---------------------------------------------------------------------------

type FlowNodeData = {
  node: RoadmapNode
  hue: string
}

// Focus/dim styling is applied IMPERATIVELY via CSS classes on the RF wrappers (see Flow's
// applyFocus), never through React state — so hovering to trace a thread never re-renders the
// graph (which is what made it flash). This component's props are therefore stable per filter.
const RoadmapFlowNode = memo(function RoadmapFlowNode({ data }: NodeProps) {
  const { node, hue } = data as unknown as FlowNodeData
  const Icon = KIND_ICON[node.resourceKind]
  return (
    <div
      className="rf-chip flex items-center gap-2 rounded-xl border border-card-border bg-[var(--card-strong)] px-2.5 py-2 shadow-glass backdrop-blur-glass"
      style={{ width: NODE_W, height: NODE_H, borderLeft: `3px solid ${hue}` }}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} style={{ opacity: 0 }} />
      <Icon size={16} className="shrink-0 text-text-muted" />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[0.8rem] font-medium leading-tight text-heading">{node.title}</span>
        <span className="mt-0.5 block truncate text-[0.58rem] uppercase tracking-wide text-text">
          {KIND_LABEL[node.resourceKind]}
        </span>
      </span>
      <MiniRing value={node.progress} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} style={{ opacity: 0 }} />
    </div>
  )
})

const GroupFlowNode = memo(function GroupFlowNode({ data }: NodeProps) {
  const { title } = data as unknown as { title: string }
  return (
    <div
      className="relative h-full w-full rounded-2xl border"
      style={{ borderColor: "var(--accent-2)", borderStyle: "dashed", borderWidth: 1.5, background: "rgba(111,134,214,0.07)", opacity: 0.9 }}
    >
      <span className="absolute -top-2.5 left-3 rounded-full border border-card-border bg-[var(--card-strong)] px-2 py-0.5 text-[0.58rem] font-medium uppercase tracking-wider text-text">
        {title}
      </span>
    </div>
  )
})

// NB: the type is "cluster", not "group" — React Flow ships a built-in "group" type whose
// default CSS (white fill, dark border) would override ours and look wrong in light mode.
const NODE_TYPES = { roadmap: RoadmapFlowNode, cluster: GroupFlowNode }

function MiniRing({ value, size = 26 }: { value: number; size?: number }) {
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
      <text x="50%" y="53%" dominantBaseline="middle" textAnchor="middle" fontSize={size * 0.3} fill="var(--text)" fontWeight="600">
        {value}
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Layout (dagre) — deterministic top-down DAG.
// ---------------------------------------------------------------------------

type Positioned = { id: string; x: number; y: number }
type GroupBox = Positioned & { title: string; w: number; h: number }
type Layout = { positions: Map<string, Positioned>; groups: GroupBox[] }

function computeLayout(nodes: RoadmapNode[], edges: { from: string; to: string }[]): Layout {
  const ids = new Set(nodes.map((n) => n.id))
  const groupIds = new Set(nodes.map((n) => n.group).filter((g): g is string => !!g && ids.has(g)))
  const chips = nodes.filter((n) => !groupIds.has(n.id))
  const byId = new Map(nodes.map((n) => [n.id, n]))

  const g = new dagre.graphlib.Graph({ compound: true })
  g.setGraph({ rankdir: "TB", nodesep: 34, ranksep: 78, marginx: 28, marginy: 28 })
  g.setDefaultEdgeLabel(() => ({}))
  for (const gid of groupIds) g.setNode(gid, { label: gid })
  for (const n of chips) {
    g.setNode(n.id, { width: NODE_W, height: NODE_H })
    if (n.group && groupIds.has(n.group)) g.setParent(n.id, n.group)
  }
  for (const e of edges) {
    if (g.hasNode(e.from) && g.hasNode(e.to) && !groupIds.has(e.from) && !groupIds.has(e.to)) g.setEdge(e.from, e.to)
  }
  dagre.layout(g)

  const positions = new Map<string, Positioned>()
  for (const n of chips) {
    const p = g.node(n.id)
    positions.set(n.id, { id: n.id, x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 })
  }
  const groups: GroupBox[] = [...groupIds].map((gid) => {
    const p = g.node(gid)
    return { id: gid, title: byId.get(gid)?.title ?? gid, x: p.x - p.width / 2, y: p.y - p.height / 2, w: p.width, h: p.height }
  })
  return { positions, groups }
}

// ---------------------------------------------------------------------------
// Inner flow (needs ReactFlowProvider for fitView)
// ---------------------------------------------------------------------------

function Flow({
  visibleNodes, edges, layout, hue, selected, onSelect, colorMode, panelOpen,
}: {
  visibleNodes: RoadmapNode[]
  edges: { from: string; to: string }[]
  layout: Layout
  hue: (n: RoadmapNode) => string
  selected: string | null
  onSelect: (id: string | null) => void
  colorMode: "light" | "dark"
  panelOpen: boolean
}) {
  const { fitView, getViewport, setViewport } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<string | null>(selected)
  selectedRef.current = selected
  const signature = visibleNodes.map((n) => n.id).join(",")
  const groupIds = useMemo(() => new Set(layout.groups.map((g) => g.id)), [layout])

  const neighborsOf = useCallback(
    (id: string) => {
      const set = new Set<string>([id])
      for (const e of edges) {
        if (e.from === id) set.add(e.to)
        if (e.to === id) set.add(e.from)
      }
      return set
    },
    [edges],
  )

  // Dim/highlight the graph WITHOUT touching React state — toggle classes on the already-mounted
  // React Flow wrappers. This is what keeps hover flash-free: no re-render, no node remount.
  const applyFocus = useCallback(
    (focusId: string | null) => {
      const root = wrapperRef.current
      if (!root) return
      const nb = focusId ? neighborsOf(focusId) : null
      root.querySelectorAll<HTMLElement>(".react-flow__node").forEach((el) => {
        const id = el.getAttribute("data-id") ?? ""
        if (groupIds.has(id)) return
        el.classList.toggle("rf-dim", !!nb && !nb.has(id))
      })
      root.querySelectorAll<HTMLElement>(".react-flow__edge").forEach((el) => {
        const [f, t] = (el.getAttribute("data-id") ?? "").split("->")
        const lit = !!nb && nb.has(f) && nb.has(t)
        el.classList.toggle("rf-edge-lit", lit)
        el.classList.toggle("rf-edge-dim", !!nb && !lit)
      })
    },
    [neighborsOf, groupIds],
  )

  const markSelected = useCallback((id: string | null) => {
    const root = wrapperRef.current
    if (!root) return
    root.querySelectorAll<HTMLElement>(".react-flow__node").forEach((el) => {
      el.classList.toggle("rf-selected", el.getAttribute("data-id") === id)
    })
  }, [])

  const rfNodes: Node[] = useMemo(() => {
    const groupNodes: Node[] = layout.groups.map((grp) => ({
      id: grp.id,
      type: "cluster",
      position: { x: grp.x, y: grp.y },
      data: { title: grp.title },
      draggable: false,
      selectable: false,
      zIndex: 0,
      style: { width: grp.w, height: grp.h },
    }))
    const chipNodes: Node[] = visibleNodes
      .filter((n) => layout.positions.has(n.id))
      .map((n) => {
        const pos = layout.positions.get(n.id)!
        return {
          id: n.id,
          type: "roadmap",
          position: { x: pos.x, y: pos.y },
          data: { node: n, hue: hue(n) },
          draggable: false,
          zIndex: 10,
        }
      })
    return [...groupNodes, ...chipNodes]
  }, [visibleNodes, layout, hue])

  const rfEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => ({
        id: `${e.from}->${e.to}`,
        source: e.from,
        target: e.to,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "var(--accent-2)" },
        style: { stroke: "var(--accent-2)", strokeWidth: 1.5, opacity: 0.45 },
      })),
    [edges],
  )

  // Refit only when the visible set changes (NOT on every render — `fitView`'s identity churns).
  // Refit when the visible set changes, and when the panel opens/closes (the graph's width shifts).
  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.16, duration: 300 }), 80)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, panelOpen])

  // Custom pinch zoom. A trackpad pinch arrives as ctrl+wheel; React Flow's built-in pinch speed
  // isn't configurable and feels slow, so we intercept ctrl+wheel and zoom (centered on the
  // cursor) at ZOOM_SENSITIVITY. Plain two-finger scroll (no ctrl) falls through to RF's panning.
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      e.stopImmediatePropagation()
      const { x, y, zoom } = getViewport()
      const rect = el.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * Math.exp(-e.deltaY * ZOOM_SENSITIVITY)))
      const k = next / zoom
      setViewport({ x: px - (px - x) * k, y: py - (py - y) * k, zoom: next })
    }
    el.addEventListener("wheel", onWheel, { passive: false, capture: true })
    return () => el.removeEventListener("wheel", onWheel, { capture: true } as EventListenerOptions)
  }, [getViewport, setViewport])

  // Reapply selection highlight after the node set renders (also covers deep-linked selection).
  useEffect(() => {
    const r = requestAnimationFrame(() => {
      markSelected(selected)
      applyFocus(selected)
    })
    return () => cancelAnimationFrame(r)
  }, [selected, signature, markSelected, applyFocus])

  return (
    <div ref={wrapperRef} className="h-full w-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={NODE_TYPES}
        colorMode={colorMode}
        fitView
        fitViewOptions={{ padding: 0.16 }}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        // Trackpad-native navigation: two-finger scroll pans (any direction); pinch (ctrl+wheel)
        // is handled by our own faster listener above, so RF's built-in pinch is disabled.
        panOnScroll
        panOnScrollSpeed={1.6}
        zoomOnScroll={false}
        zoomOnPinch={false}
        panOnDrag
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, n) => n.type === "roadmap" && onSelect(n.id)}
        onNodeMouseEnter={(_, n) => n.type === "roadmap" && applyFocus(n.id)}
        onNodeMouseLeave={() => applyFocus(selectedRef.current)}
        onPaneClick={() => onSelect(null)}
      >
        <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="rgba(130,144,176,0.35)" />
        <Controls showInteractive={false} className="!bottom-3 !left-3" />
      </ReactFlow>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RoadmapGraph({ data }: { data: RoadmapData }) {
  const { theme } = useTheme()
  const roadmapIds = data.roadmaps.map((r) => r.id)
  const [roadmap, setRoadmap] = useState(roadmapIds.includes("ai") ? "ai" : roadmapIds[0] ?? "")
  const [selected, setSelected] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

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

  const meta = data.roadmaps.find((r) => r.id === roadmap)
  // Kept for consistent per-category node colours (no filter UI at this altitude).
  const allCats = meta?.categories ?? []

  const visibleNodes = useMemo(
    () => data.nodes.filter((n) => n.roadmaps.includes(roadmap)),
    [data.nodes, roadmap],
  )
  const visibleEdges = useMemo(() => {
    const ids = new Set(visibleNodes.map((n) => n.id))
    return data.edges.filter((e) => ids.has(e.from) && ids.has(e.to))
  }, [visibleNodes, data.edges])

  useEffect(() => {
    if (selected && !visibleNodes.some((n) => n.id === selected)) setSelected(null)
  }, [visibleNodes, selected])

  const layout = useMemo(() => computeLayout(visibleNodes, visibleEdges), [visibleNodes, visibleEdges])

  const ordered = useMemo(
    () =>
      [...visibleNodes]
        .filter((n) => layout.positions.has(n.id))
        .sort((a, b) => {
          const pa = layout.positions.get(a.id)!
          const pb = layout.positions.get(b.id)!
          return pa.y - pb.y || pa.x - pb.x
        }),
    [visibleNodes, layout],
  )

  const selectedNode = selected ? data.nodes.find((n) => n.id === selected) ?? null : null
  const catColor = useCallback(
    (cat: string) => CAT_HUES[Math.max(0, allCats.indexOf(cat)) % CAT_HUES.length],
    [allCats],
  )
  const hue = useCallback(
    (n: RoadmapNode) => (n.categories.length ? catColor(n.categories[0]) : "var(--accent-2)"),
    [catColor],
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Domain tabs — a small high-level set (Mathematics · Physics · AI · Quant). No preamble, no
          filters: the graph is the point, and it fills the space below. */}
      <div className="shrink-0">
        <div className="inline-flex flex-wrap rounded-xl border border-card-border bg-[var(--card)] p-1">
          {[...data.roadmaps]
            .sort((a, b) => a.order - b.order)
            .map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRoadmap(r.id)
                  setSelected(null)
                }}
                className={`rounded-lg px-3.5 py-1.5 text-sm transition-colors ${
                  roadmap === r.id ? "bg-[var(--card-strong)] font-medium text-heading shadow-glass" : "text-text hover:text-accent-2"
                }`}
              >
                {r.label} <span className="text-text-muted">· {r.count}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Graph fills the remaining height; a node opens a panel beside it (below it on mobile). */}
      <div
        className={`min-h-0 flex-1 ${
          selectedNode
            ? "grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 lg:grid-cols-[1fr_360px] lg:grid-rows-1"
            : ""
        }`}
      >
        <GlassCard strong className="roadmap-flow relative h-full overflow-hidden p-0">
          {mounted ? (
            <ReactFlowProvider>
              <Flow
                visibleNodes={visibleNodes}
                edges={visibleEdges}
                layout={layout}
                hue={hue}
                selected={selected}
                onSelect={setSelected}
                colorMode={theme}
                panelOpen={!!selectedNode}
              />
            </ReactFlowProvider>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-text-muted">Loading graph…</div>
          )}
          <p className="pointer-events-none absolute left-3 top-3 z-10 text-[0.65rem] text-text-muted">
            Two-finger scroll to pan · pinch to zoom · click a node
          </p>
        </GlassCard>

        {selectedNode && (
          <div className="min-h-0 min-w-0">
            <NodePanel key={selectedNode.id} node={selectedNode} allNodes={data.nodes} onSelect={setSelected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>

      {/* Accessible fallback: the same graph as a keyboard-navigable prerequisite list. */}
      <details className="group shrink-0">
        <summary className="cursor-pointer text-sm text-accent-2">List view (accessible)</summary>
        <nav aria-label={`${roadmap} roadmap, ordered by prerequisite`} className="mt-3">
          <ol className="space-y-2">
            {ordered.map((n) => (
              <li key={n.id} className="text-sm">
                <a href={n.route} className="font-medium text-heading hover:text-accent-2">{n.title}</a>
                <span className="text-text">
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

  // Page the (sometimes very long) body inside a fixed-height region instead of stretching the
  // page. "Pages" = scroll-by-viewport; Prev/Next jump one page, the wheel still works, and the
  // indicator tracks manual scrolling.
  const bodyRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  const measure = useCallback(() => {
    const el = bodyRef.current
    if (!el) return
    const count = Math.max(1, Math.ceil((el.scrollHeight - 1) / el.clientHeight))
    setPageCount(count)
    setPage(Math.min(Math.round(el.scrollTop / el.clientHeight), count - 1))
  }, [])

  useEffect(() => {
    const r = requestAnimationFrame(measure)
    window.addEventListener("resize", measure)
    return () => {
      cancelAnimationFrame(r)
      window.removeEventListener("resize", measure)
    }
  }, [measure])

  const turn = (dir: number) => {
    const el = bodyRef.current
    if (!el) return
    const next = Math.min(pageCount - 1, Math.max(0, page + dir))
    el.scrollTo({ top: next * el.clientHeight, behavior: "smooth" })
    setPage(next)
  }

  return (
    <GlassCard glow className="flex h-full flex-col overflow-hidden p-0">
      {/* Fixed header */}
      <div className="shrink-0 border-b border-card-border p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
            <Icon size={14} /> {KIND_LABEL[node.resourceKind]}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-text-muted hover:text-accent-2">
            <X size={16} />
          </button>
        </div>
        <h2 className="mt-1 font-display text-lg font-bold leading-tight text-heading">{node.title}</h2>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--track)]">
            <div className="h-full rounded-full" style={{ width: `${node.progress}%`, background: "var(--track-fill)" }} />
          </div>
          <span className="text-xs text-text-muted">{node.progress}%</span>
        </div>
      </div>

      {/* Paged body */}
      <div ref={bodyRef} onScroll={measure} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {node.categories.map((c) => (
            <span key={c} className="rounded-full bg-[var(--track)] px-2 py-0.5 text-[0.6rem] capitalize text-text">
              {c.replace(/-/g, " ")}
            </span>
          ))}
        </div>

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

        <div className="post-body mt-3 text-sm" dangerouslySetInnerHTML={{ __html: node.html }} />
      </div>

      {/* Fixed footer: actions + page turner */}
      <div className="shrink-0 space-y-2 border-t border-card-border p-3">
        {node.conceptMapUrl && (
          <a
            href={node.conceptMapUrl}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-accent-2/50 bg-[var(--card-strong)] px-3 py-1.5 text-sm font-medium text-heading transition-colors hover:text-accent-2"
          >
            <Waypoints size={15} className="text-accent-2" /> Explore concept map →
          </a>
        )}
        <div className="flex items-center gap-2 text-sm">
          {node.resourceUrl && (
            <a
              href={node.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium text-[var(--accent-contrast)]"
              style={{ background: "var(--accent)" }}
            >
              Resource <ExternalLink size={13} />
            </a>
          )}
          <a
            href={node.route}
            className="inline-flex items-center gap-1 rounded-lg border border-card-border bg-card px-3 py-1.5 text-heading transition-colors hover:text-accent-2"
          >
            Open note →
          </a>
          {pageCount > 1 && (
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous page"
                onClick={() => turn(-1)}
                disabled={page === 0}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-card-border text-heading transition-colors hover:text-accent-2 disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="min-w-[2.5rem] text-center text-xs tabular-nums text-text-muted">
                {page + 1} / {pageCount}
              </span>
              <button
                type="button"
                aria-label="Next page"
                onClick={() => turn(1)}
                disabled={page === pageCount - 1}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-card-border text-heading transition-colors hover:text-accent-2 disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
