"use client"

import { useEffect, useRef } from "react"
import { useAnimationFrame, useReducedMotion } from "motion/react"
import { SparkleCanvas } from "./SparkleCanvas"

// Mouse parallax is deliberately gentle here — well under the hero's 26px — so the whole
// page doesn't feel busy. The overlay (nearer) moves a little more than the backdrop.
const BG_MOUSE_MAX = 8
const OVERLAY_MOUSE_MAX = 15
const EASE = 0.05

/**
 * The animated ambient background for every page: a fixed backdrop image and a foreground
 * overlay image that each drift on their own and shift slightly with the pointer (opposite
 * directions for depth), plus a page-wide twinkling starfield. Theme images/sparkle colors
 * come from CSS variables (swapped pre-paint). Under `prefers-reduced-motion` everything is
 * static and the sparkles don't render.
 */
export function SiteBackdrop() {
  const reduced = useReducedMotion()
  const bgRef = useRef<HTMLDivElement>(null)
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
    if (reduced) return
    current.current.x += (target.current.x - current.current.x) * EASE
    current.current.y += (target.current.y - current.current.y) * EASE
    const time = t / 1000

    if (bgRef.current) {
      const dx = Math.sin(time * 0.12) * 6 + current.current.x * BG_MOUSE_MAX
      const dy = Math.cos(time * 0.1) * 5 + current.current.y * BG_MOUSE_MAX
      bgRef.current.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(1.06)`
    }
    if (overlayRef.current) {
      // Opposite pointer direction + a touch more travel → parallax depth vs. the backdrop.
      const dx = Math.sin(time * 0.16 + 1.5) * 9 - current.current.x * OVERLAY_MOUSE_MAX
      const dy = Math.cos(time * 0.13 + 1.5) * 7 - current.current.y * OVERLAY_MOUSE_MAX
      overlayRef.current.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(1.08)`
    }
  })

  return (
    <>
      <div ref={bgRef} className="site-backdrop" aria-hidden="true" />
      <SparkleCanvas count={64} color={["#e0b45f", "#d3a24a"]} speed={0.35} className="site-sparkles" />
      <div ref={overlayRef} className="site-overlay" aria-hidden="true" />
    </>
  )
}
