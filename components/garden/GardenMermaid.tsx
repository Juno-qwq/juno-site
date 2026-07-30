"use client"

import { useEffect } from "react"
import { useTheme } from "@/components/ThemeProvider"

/**
 * Renders ```mermaid diagrams (emitted as <pre class="mermaid"> by the extractor). Mermaid is
 * dynamically imported and only when a diagram is actually on the page, so note pages without one
 * pay nothing. Re-renders on theme change.
 */
export function GardenMermaid() {
  const { theme } = useTheme()
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("pre.mermaid"))
    if (els.length === 0) return
    let cancelled = false
    ;(async () => {
      const mermaid = (await import("mermaid")).default
      if (cancelled) return
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === "dark" ? "dark" : "default",
        securityLevel: "strict",
        fontFamily: "Inter, system-ui, sans-serif",
      })
      for (const el of els) {
        if (el.dataset.src === undefined) el.dataset.src = el.textContent || ""
        el.removeAttribute("data-processed")
        el.innerHTML = el.dataset.src ?? ""
      }
      try {
        await mermaid.run({ nodes: els })
      } catch {
        /* a malformed diagram shouldn't break the page */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [theme])
  return null
}
