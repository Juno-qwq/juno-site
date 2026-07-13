"use client"

import { useEffect, useRef } from "react"
import { useAnimationFrame, useReducedMotion } from "motion/react"
import { SparkleCanvas } from "./SparkleCanvas"

// Mouse parallax is deliberately gentle — well under the hero's 26px. The background image is
// STATIC (so its side details aren't cropped); only the overlay + sparkles move.
const OVERLAY_MOUSE_MAX = 15
const HALO_MOUSE_MAX = 10
const HALO_SPIN = 3 // deg/s for the light-mode page halo
const EASE = 0.05

/**
 * The ambient background for every page. Layers (behind content): a STATIC backdrop image, a
 * theme-swapped foreground overlay (nebula/clouds) that gently drifts with subtle pointer
 * parallax, a light-mode-only halo ring that slowly spins, and a page-wide twinkling
 * starfield. Theme images/sparkle colors come from CSS variables (swapped pre-paint). Under
 * `prefers-reduced-motion` the overlay/halo are static and the sparkles don't render.
 */
export function SiteBackdrop() {
  const reduced = useReducedMotion()
  const overlayRef = useRef<HTMLDivElement>(null)
  const haloRef = useRef<HTMLDivElement>(null)
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

    // Overlay: gentle drift + pointer parallax (opposite direction for depth).
    if (overlayRef.current) {
      const dx = Math.sin(time * 0.16 + 1.5) * 9 - current.current.x * OVERLAY_MOUSE_MAX
      const dy = Math.cos(time * 0.13 + 1.5) * 7 - current.current.y * OVERLAY_MOUSE_MAX
      overlayRef.current.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(1.08)`
    }
    // Halo (light mode): slow spin around center + a touch of pointer parallax.
    if (haloRef.current) {
      const rot = (time * HALO_SPIN) % 360
      const dx = -current.current.x * HALO_MOUSE_MAX
      const dy = -current.current.y * HALO_MOUSE_MAX
      haloRef.current.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`
    }
  })

  return (
    <>
      <div className="site-backdrop" aria-hidden="true" />
      <div ref={overlayRef} className="site-overlay" aria-hidden="true" />
      <div ref={haloRef} className="site-halo" aria-hidden="true" />
      <SparkleCanvas count={64} color={["#e0b45f", "#d3a24a"]} speed={0.35} className="site-sparkles" />
    </>
  )
}
