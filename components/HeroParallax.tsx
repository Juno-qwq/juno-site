"use client"

import { useEffect, useRef } from "react"
import { useAnimationFrame, useReducedMotion } from "motion/react"
import { SparkleCanvas } from "./SparkleCanvas"

export type HeroLayer = {
  src: string
  /** 0 (far, least movement) → 1 (near, most movement). */
  depth: number
  /** Very slow continuous rotation (moon-ring / orbital rings). */
  rotate?: boolean
}

type HeroParallaxProps = {
  layers: HeroLayer[]
  sparkle: { count: number; color: string | readonly string[]; speed: number }
  /** Reduced-motion fallback composite (from design/, exported to public/hero/). */
  poster: string
  /** Tailwind classes for the theme-aware contrast scrim over the art. */
  scrimClassName?: string
  className?: string
  children?: React.ReactNode
}

const MOUSE_MAX = 26 // px of pointer parallax at depth = 1
const EASE = 0.06 // pointer smoothing per frame

/**
 * The animated Main Card (Phase 4): depth-layered art with idle drift + spring-eased mouse
 * parallax, a very slow rotation on flagged layers, and a SparkleCanvas overlay. All motion
 * is GPU translate3d only (no layout thrash). Touch pointers skip parallax; under
 * `prefers-reduced-motion` it renders the static poster with no rAF loops.
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
    // Spring-ease the pointer toward its target (smooth reset on leave).
    current.current.x += (target.current.x - current.current.x) * EASE
    current.current.y += (target.current.y - current.current.y) * EASE
    const time = t / 1000
    for (let i = 0; i < layers.length; i++) {
      const node = layerRefs.current[i]
      if (!node) continue
      const { depth, rotate } = layers[i]
      const amp = 2 + depth * 12 // ~2–4px far → ~14px near
      const phase = i * 1.7
      const idleX = Math.sin(time * 0.5 + phase) * amp
      const idleY = Math.cos(time * 0.38 + phase) * amp * 0.7
      const mx = current.current.x * depth * MOUSE_MAX
      const my = current.current.y * depth * MOUSE_MAX
      const rot = rotate ? (time * 1.2) % 360 : 0 // ~1.2°/s = full turn every 5 min
      const scale = rotate ? " scale(1.5)" : "" // extra cover so rotation never reveals corners
      node.style.transform = `translate3d(${(idleX + mx).toFixed(2)}px, ${(idleY + my).toFixed(2)}px, 0)${rot ? ` rotate(${rot.toFixed(2)}deg)` : ""}${scale}`
    }
  })

  if (reduced) {
    return (
      <div className={`relative overflow-hidden rounded-card ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
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
            className="absolute will-change-transform"
            style={{
              inset: "-6%",
              backgroundImage: `url(${layer.src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
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
