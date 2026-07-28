"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/ThemeProvider"

// Client-only: force graph touches canvas/window.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false }) as any

export type GraphNode = { id: string; label: string; center?: boolean }
export type GraphLink = { source: string; target: string }

/**
 * A note's local mindmap — the note plus its linked/back-linked neighbors, force-directed. This is
 * the in-house replacement for Quartz's Graph View: same idea, but themed like the rest of the site
 * and it navigates within the native garden.
 */
export function GardenGraph({ nodes, links, height = 240 }: { nodes: GraphNode[]; links: GraphLink[]; height?: number }) {
  const { theme } = useTheme()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<string | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Fresh copies — the sim mutates node/link objects.
  const data = useMemo(
    () => ({ nodes: nodes.map((n) => ({ ...n })), links: links.map((l) => ({ ...l })) }),
    [nodes, links],
  )

  const colors =
    theme === "dark"
      ? { node: "#7c8aa8", center: "#2dd4bf", link: "rgba(124,138,168,0.35)", text: "#c7d3e6" }
      : { node: "#8aa0c0", center: "#6f86d6", link: "rgba(111,134,214,0.4)", text: "#33415c" }

  const paintNode = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any, ctx: CanvasRenderingContext2D, scale: number) => {
      const r = node.center ? 5 : 3.5
      const isHover = hover === node.id
      ctx.globalAlpha = isHover || !hover ? 1 : 0.5
      ctx.beginPath()
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
      ctx.fillStyle = node.center ? colors.center : colors.node
      ctx.fill()
      const fontSize = 10 / scale
      ctx.font = `${node.center ? 600 : 400} ${fontSize}px Inter, system-ui, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillStyle = colors.text
      ctx.fillText(node.label, node.x, node.y + r + 1)
      ctx.globalAlpha = 1
    },
    [hover, colors.center, colors.node, colors.text],
  )

  if (nodes.length <= 1) {
    return <p className="text-xs text-text-muted">No links yet — add wikilinks to grow the graph.</p>
  }

  return (
    <div ref={containerRef} className="w-full" style={{ height, cursor: hover ? "pointer" : "grab" }}>
      {width > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={width}
          height={height}
          graphData={data}
          backgroundColor="rgba(0,0,0,0)"
          linkColor={() => colors.link}
          linkWidth={1}
          enableZoomInteraction={false}
          warmupTicks={40}
          cooldownTicks={80}
          d3VelocityDecay={0.35}
          nodeRelSize={4}
          nodeCanvasObject={paintNode}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(node.x, node.y, (node.center ? 5 : 3.5) + 4, 0, 2 * Math.PI)
            ctx.fill()
          }}
          onEngineStop={() => fgRef.current?.zoomToFit?.(300, 20)}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onNodeHover={(node: any) => setHover(node ? node.id : null)}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onNodeClick={(node: any) => node?.id && router.push(node.id)}
        />
      )}
    </div>
  )
}
