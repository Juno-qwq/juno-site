"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { GlassCard } from "@/components/GlassCard"
import { useTheme } from "@/components/ThemeProvider"
import { graphLinks, graphNodes } from "@/lib/graph"

// Client-only: the force graph touches canvas/window, so never SSR it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false }) as any

const HEIGHT = 260

export function TopicsGraph() {
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<string | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Fresh copies — the force sim mutates node/link objects with x/y/vx/vy.
  const data = useMemo(
    () => ({ nodes: graphNodes.map((n) => ({ ...n })), links: graphLinks.map((l) => ({ ...l })) }),
    [],
  )

  const colors =
    theme === "dark"
      ? { node: "#2dd4bf", central: "#b483f0", link: "rgba(124,138,168,0.35)", text: "#eaf2ff" }
      : { node: "#6f86d6", central: "#c2913f", link: "rgba(111,134,214,0.4)", text: "#26314f" }

  const paintNode = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any, ctx: CanvasRenderingContext2D, scale: number) => {
      const r = Math.sqrt(node.val) * 3.2
      const isHover = hover === node.id
      ctx.globalAlpha = isHover || !hover ? 1 : 0.55
      ctx.beginPath()
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
      ctx.fillStyle = node.central ? colors.central : colors.node
      ctx.fill()
      if (isHover) {
        ctx.lineWidth = 2 / scale
        ctx.strokeStyle = colors.text
        ctx.stroke()
      }
      const fontSize = 11 / scale
      ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillStyle = colors.text
      ctx.fillText(node.label, node.x, node.y + r + 1)
      ctx.globalAlpha = 1
    },
    [hover, colors.central, colors.node, colors.text],
  )

  return (
    <GlassCard className="overflow-hidden p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-heading">Topics in My Garden</h2>
      <div
        ref={containerRef}
        className="mt-2 w-full"
        style={{ height: HEIGHT, cursor: hover ? "pointer" : "default" }}
      >
        {width > 0 && (
          <ForceGraph2D
            ref={fgRef}
            width={width}
            height={HEIGHT}
            graphData={data}
            backgroundColor="rgba(0,0,0,0)"
            linkColor={() => colors.link}
            linkWidth={1}
            enableZoomInteraction={false}
            enablePanInteraction={false}
            warmupTicks={40}
            cooldownTicks={120}
            d3VelocityDecay={0.35}
            onEngineStop={() => fgRef.current?.zoomToFit?.(400, 24)}
            nodeCanvasObject={paintNode}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
              ctx.fillStyle = color
              ctx.beginPath()
              ctx.arc(node.x, node.y, Math.sqrt(node.val) * 3.2 + 4, 0, 2 * Math.PI)
              ctx.fill()
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onNodeHover={(node: any) => setHover(node ? node.id : null)}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onNodeClick={(node: any) => {
              if (node?.garden) window.location.href = node.garden
            }}
          />
        )}
      </div>
      <p className="mt-1 text-[0.65rem] text-text-muted">Click a node to open its garden index.</p>
    </GlassCard>
  )
}
