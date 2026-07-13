"use client"

import { useEffect, useRef } from "react"
import { useAnimationFrame, useReducedMotion } from "motion/react"
import { SparkleCanvas } from "./SparkleCanvas"

// Mouse parallax is deliberately gentle — well under the hero's 26px — so the page doesn't
// feel busy. Only the overlay + sparkles move; the background image is kept STATIC so its
// side details aren't cropped by drift/scale.
const OVERLAY_MOUSE_MAX = 15
const EASE = 0.05

/**
 * The ambient background for every page: a STATIC fixed backdrop image, a drifting foreground
 * overlay that shifts slightly with the pointer, and a page-wide twinkling starfield. Theme
 * images/sparkle colors come from CSS variables (swapped pre-paint). Under
 * `prefers-reduced-motion` the overlay is static too and the sparkles don't render.
 */
export function SiteBackdrop() {
  const reduced = useReducedMotion()
  const overlayRef = useRef<HTMLDivElement>(null)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (reduced) return
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener("pointermove", onMove)
    return () => window.removeEventListener("pointermove", onMove)
  }, [reduced])

  useAnimationFrame((t) => {
    if (reduced || !overlayRef.current) return
    current.current.x += (target.current.x - current.current.x) * EASE
    current.current.y += (target.current.y - current.current.y) * EASE
    const time = t / 1000
    const dx = Math.sin(time * 0.16 + 1.5) * 9 - current.current.x * OVERLAY_MOUSE_MAX
    const dy = Math.cos(time * 0.13 + 1.5) * 7 - current.current.y * OVERLAY_MOUSE_MAX
    overlayRef.current.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(1.08)`
  })

  return (
    <>
      <div className="site-backdrop" aria-hidden="true" />
      <SparkleCanvas count={64} color={["#e0b45f", "#d3a24a"]} speed={0.35} className="site-sparkles" />
      <div ref={overlayRef} className="site-overlay" aria-hidden="true" />
    </>
  )
}
