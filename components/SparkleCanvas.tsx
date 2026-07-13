"use client"

import { useEffect, useRef } from "react"
import { useReducedMotion } from "motion/react"

type SparkleCanvasProps = {
  count: number
  /** Single color, or a set to distribute across particles (dark = cyan/violet). */
  color: string | readonly string[]
  /** Twinkle + drift rate multiplier. */
  speed: number
  className?: string
}

type Particle = {
  x: number
  y: number
  r: number
  a: number
  tw: number
  twSpeed: number
  vx: number
  vy: number
  c: string
}

/**
 * rAF starfield overlay for the hero (Phase 4.5): particles twinkle and drift, wrapping at
 * edges. Paused when scrolled offscreen (IntersectionObserver) and fully disabled under
 * `prefers-reduced-motion`. GPU-cheap 2D canvas, DPR-aware.
 */
export function SparkleCanvas({ count, color, speed, className = "" }: SparkleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Prefer theme-swapped CSS variables (so the palette is correct on the very first paint,
    // even before React theme state settles — no flash); fall back to the `color` prop.
    const fallback = Array.isArray(color) ? [...color] : [color]
    const readColors = (): string[] => {
      const cs = getComputedStyle(canvas)
      const fromVars = [cs.getPropertyValue("--sparkle-a"), cs.getPropertyValue("--sparkle-b")]
        .map((c) => c.trim())
        .filter(Boolean)
      return fromVars.length ? fromVars : fallback
    }
    let colors = readColors()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let parts: Particle[] = []
    let raf = 0
    let visible = true
    let last = performance.now()

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const seed = () => {
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 0.4,
        a: Math.random() * 0.5 + 0.35,
        tw: Math.random() * Math.PI * 2,
        twSpeed: Math.random() * 0.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.25 * speed,
        vy: (Math.random() - 0.5) * 0.25 * speed,
        c: colors[Math.floor(Math.random() * colors.length)],
      }))
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (!visible) {
        last = now
        return
      }
      const dt = Math.min((now - last) / 16.67, 3)
      last = now
      ctx.clearRect(0, 0, w, h)
      for (const p of parts) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        if (p.x < -2) p.x = w + 2
        else if (p.x > w + 2) p.x = -2
        if (p.y < -2) p.y = h + 2
        else if (p.y > h + 2) p.y = -2
        p.tw += 0.05 * p.twSpeed * speed * dt
        const alpha = p.a * (0.5 + 0.5 * Math.sin(p.tw))
        ctx.fillStyle = p.c
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
        // soft halo
        ctx.globalAlpha = alpha * 0.3
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    resize()
    seed()
    raf = requestAnimationFrame(tick)

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), {
      threshold: 0,
    })
    io.observe(canvas)

    // Re-tint existing particles when the theme flips (colors come from CSS vars).
    const themeObserver = new MutationObserver(() => {
      colors = readColors()
      for (const p of parts) p.c = colors[Math.floor(Math.random() * colors.length)]
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })

    const onResize = () => {
      resize()
      seed()
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      themeObserver.disconnect()
      window.removeEventListener("resize", onResize)
    }
  }, [count, color, speed, reduced])

  if (reduced) return null
  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  )
}
