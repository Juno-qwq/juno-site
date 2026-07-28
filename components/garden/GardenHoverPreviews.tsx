"use client"

import { useEffect, useRef, useState } from "react"

type Preview = { title: string; preview: string }

/**
 * Hover previews for internal garden links. Delegated listeners on the page surface a small card
 * with the target note's title + snippet — the site-native version of Quartz's link popovers.
 */
export function GardenHoverPreviews({ previews }: { previews: Record<string, Preview> }) {
  const [card, setCard] = useState<{ x: number; y: number; data: Preview } | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    const norm = (href: string) => {
      try {
        const u = new URL(href, window.location.origin)
        return u.pathname.replace(/\/$/, "")
      } catch {
        return href.replace(/\/$/, "")
      }
    }
    const clear = () => {
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = null
      setCard(null)
    }
    const onOver = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.("a[href^='/garden/']") as HTMLAnchorElement | null
      if (!a) return
      const data = previews[norm(a.getAttribute("href") || "")]
      if (!data) return
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        const r = a.getBoundingClientRect()
        const x = Math.min(r.left, window.innerWidth - 360)
        const y = r.bottom + 8
        setCard({ x: Math.max(8, x), y, data })
      }, 220)
    }
    const onOut = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.("a[href^='/garden/']")
      if (a) clear()
    }
    document.addEventListener("mouseover", onOver)
    document.addEventListener("mouseout", onOut)
    window.addEventListener("scroll", clear, true)
    return () => {
      document.removeEventListener("mouseover", onOver)
      document.removeEventListener("mouseout", onOut)
      window.removeEventListener("scroll", clear, true)
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [previews])

  if (!card) return null
  return (
    <div className="garden-preview" style={{ left: card.x, top: card.y }}>
      <div className="text-sm font-semibold text-heading">{card.data.title}</div>
      <div className="mt-1 line-clamp-3 text-xs text-text-muted">{card.data.preview}</div>
    </div>
  )
}
