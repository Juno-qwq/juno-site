"use client"

import { useEffect, useRef } from "react"
import { useAnimationFrame, useReducedMotion } from "motion/react"
import { SparkleCanvas } from "./SparkleCanvas"

export type HeroLayer = {
  src: string
  /** 0 (far, least movement) → 1 (near, most movement). */
  depth: number
  /** Very slow continuous rotation around the layer's transform-origin. */
  rotate?: boolean
  /** Star-like opacity pulse (instead of/alongside drift). */
  twinkle?: boolean
  /** Only render for this theme (gated via CSS data-theme; flash-free). */
  theme?: "light" | "dark"
  /** Per-layer box style. Defaults to full-bleed cover; pass a box to make a positioned
   *  "sprite" (e.g. the orb/orbit anchored right, with transform-origin at its center). */
  box?: React.CSSProperties
  /** Transform kept beneath the animated transform (e.g. "translateY(-50%)" for centering). */
  baseTransform?: string
  /** Idle-drift phase; defaults to index-based stagger. Give two layers the same phase +
   *  depth to keep them locked together (e.g. orbit spinning around a drifting orb). */
  phase?: number
}

type HeroParallaxProps = {
  layers: HeroLayer[]
  sparkle: { count: number; color: string | readonly string[]; speed: number }
  /** Reduced-motion fallback composite (may be a CSS var, e.g. var(--hero-poster)). */
  poster: string
  scrimClassName?: string
  className?: string
  children?: React.ReactNode
}

const MOUSE_MAX = 26 // px of pointer parallax at depth = 1
const EASE = 0.06 // pointer smoothing per frame

const DEFAULT_BOX: React.CSSProperties = {
  inset: "-6%",
  backgroundSize: "cover",
  backgroundPosition: "center",
}

// Accepts a plain path, a full url()/gradient, or a CSS variable.
const asImage = (v: string) =>
  /^(var|url|linear-gradient|radial-gradient|image-set)\(/.test(v.trim()) ? v : `url("${v}")`

/**
 * The animated Main Card (Phase 4): depth-layered art with idle drift + spring-eased mouse
 * parallax, optional slow rotation / star-twinkle per layer, and a SparkleCanvas overlay.
 * Both theme layer sets are rendered and gated by CSS `data-theme` (set pre-paint) so the
 * correct art shows on the first frame with no flash. Motion is GPU transform/opacity only.
 * Under `prefers-reduced-motion` it renders the static poster with no rAF loops.
 */
export function HeroParallax({
  layers,
  sparkle,
  poster,
  scrimClassName = "",
  className = "",
  children,
}: HeroParallaxProps) {
  const reduced = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el || reduced) return
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return // disabled on touch
      const r = el.getBoundingClientRect()
      target.current.x = ((e.clientX - r.left) / r.width) * 2 - 1
      target.current.y = ((e.clientY - r.top) / r.height) * 2 - 1
    }
    const onLeave = () => {
      target.current.x = 0
      target.current.y = 0
    }
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerleave", onLeave)
    return () => {
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerleave", onLeave)
    }
  }, [reduced])

  useAnimationFrame((t) => {
    if (reduced) return
    current.current.x += (target.current.x - current.current.x) * EASE
    current.current.y += (target.current.y - current.current.y) * EASE
    const time = t / 1000
    for (let i = 0; i < layers.length; i++) {
      const node = layerRefs.current[i]
      if (!node) continue
      const layer = layers[i]
      const { depth } = layer
      const amp = 2 + depth * 12 // ~2–4px far → ~14px near
      const phase = layer.phase ?? i * 1.7
      const idleX = Math.sin(time * 0.5 + phase) * amp
      const idleY = Math.cos(time * 0.38 + phase) * amp * 0.7
      const mx = current.current.x * depth * MOUSE_MAX
      const my = current.current.y * depth * MOUSE_MAX
      const rot = layer.rotate ? (time * 1.2) % 360 : 0 // ~1.2°/s = full turn every 5 min
      const scale = layer.rotate && !layer.box ? " scale(1.5)" : "" // cover corners on fill-mode spin
      const base = layer.baseTransform ? `${layer.baseTransform} ` : ""
      node.style.transform = `${base}translate3d(${(idleX + mx).toFixed(2)}px, ${(idleY + my).toFixed(2)}px, 0)${rot ? ` rotate(${rot.toFixed(2)}deg)` : ""}${scale}`
      if (layer.twinkle) {
        // Star-like pulse: a slow base wave plus a faster flicker.
        const tw =
          0.5 + 0.32 * Math.sin(time * 1.7 + phase) + 0.14 * Math.sin(time * 4.3 + phase * 2)
        node.style.opacity = Math.max(0.35, Math.min(1, tw)).toFixed(3)
      }
    }
  })

  if (reduced) {
    return (
      <div className={`relative overflow-hidden rounded-card ${className}`}>
        <div
          className="absolute inset-0"
          style={{ backgroundImage: asImage(poster), backgroundSize: "cover", backgroundPosition: "center" }}
          aria-hidden="true"
        />
        <div className={`absolute inset-0 ${scrimClassName}`} aria-hidden="true" />
        <div className="relative">{children}</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden rounded-card ${className}`}>
      <div className="absolute inset-0" aria-hidden="true">
        {layers.map((layer, i) => (
          <div
            key={layer.src}
            ref={(n) => {
              layerRefs.current[i] = n
            }}
            className={`absolute will-change-transform ${layer.theme ? `hero-layer--${layer.theme}` : ""}`}
            style={{
              ...(layer.box ?? DEFAULT_BOX),
              backgroundImage: asImage(layer.src),
              backgroundRepeat: "no-repeat",
              transform: layer.baseTransform,
            }}
          />
        ))}
      </div>
      <SparkleCanvas count={sparkle.count} color={sparkle.color} speed={sparkle.speed} />
      <div className={`absolute inset-0 ${scrimClassName}`} aria-hidden="true" />
      <div className="relative">{children}</div>
    </div>
  )
}
