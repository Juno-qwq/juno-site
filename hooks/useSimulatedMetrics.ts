"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"

export type SystemMetrics = {
  cpu: number // %
  mem: number // %
  net: number // KB/s
  uptime: string
}

// TODO(Phase 2 backlog): replace with a real metrics source behind this same interface.
// Deterministic initial values (match the mockup) so SSR and first client render agree.
const INITIAL: SystemMetrics = { cpu: 18, mem: 42, net: 1.2, uptime: "7d 14h 32m" }
const UPTIME_START_SEC = 7 * 86400 + 14 * 3600 + 32 * 60

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const jitter = (base: number, spread: number) => base + (Math.random() - 0.5) * spread

/** Eases plausible CPU/MEM/NET values and ticks uptime. Static under reduced motion. */
export function useSimulatedMetrics(): SystemMetrics {
  const reduced = useReducedMotion()
  const [metrics, setMetrics] = useState<SystemMetrics>(INITIAL)
  const mountedAt = useRef(Date.now())

  useEffect(() => {
    if (reduced) return
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - mountedAt.current) / 1000)
      const sec = UPTIME_START_SEC + elapsed
      const d = Math.floor(sec / 86400)
      const h = Math.floor((sec % 86400) / 3600)
      const m = Math.floor((sec % 3600) / 60)
      setMetrics((prev) => ({
        cpu: Math.round(clamp(prev.cpu + jitter(0, 10), 6, 62)),
        mem: Math.round(clamp(prev.mem + jitter(0, 7), 24, 82)),
        net: Math.round(clamp(prev.net + jitter(0, 2.2), 0.2, 9) * 10) / 10,
        uptime: `${d}d ${h}h ${m}m`,
      }))
    }, 2000)
    return () => clearInterval(tick)
  }, [reduced])

  return metrics
}
