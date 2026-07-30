"use client"

import { useEffect } from "react"
import { useTheme } from "@/components/ThemeProvider"

/**
 * Renders ```plotly charts. The extractor emits <figure class="plotly-figure"><script
 * type="application/json">{data,layout}</script></figure>; here we parse that spec and draw it with
 * Plotly, themed transparent so it reads on both palettes. Plotly (~heavy) is dynamically imported
 * and only when a chart is present, so most note pages never load it.
 */
export function GardenPlotly() {
  const { theme } = useTheme()
  useEffect(() => {
    const figs = Array.from(document.querySelectorAll<HTMLElement>("figure.plotly-figure"))
    if (figs.length === 0) return
    let cancelled = false
    ;(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Plotly: any = ((await import("plotly.js-dist-min")) as any).default
      if (cancelled) return
      const font = theme === "dark" ? "#c7d3e6" : "#33415c"
      const grid = theme === "dark" ? "rgba(124,138,168,0.22)" : "rgba(111,134,214,0.22)"
      for (const fig of figs) {
        const script = fig.querySelector<HTMLScriptElement>("script.plotly-spec")
        if (!script) continue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let spec: any
        try {
          spec = JSON.parse(script.textContent || "{}")
        } catch {
          continue
        }
        let target = fig.querySelector<HTMLElement>(".plotly-target")
        if (!target) {
          target = document.createElement("div")
          target.className = "plotly-target"
          fig.appendChild(target)
        }
        const layout = {
          autosize: true,
          margin: { l: 52, r: 18, t: 24, b: 42 },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          font: { color: font, family: "Inter, system-ui, sans-serif", size: 12 },
          colorway: ["#6f86d6", "#2dd4bf", "#d3a24a", "#b483f0", "#e06c9f"],
          ...(spec.layout || {}),
          xaxis: { gridcolor: grid, zerolinecolor: grid, ...(spec.layout?.xaxis || {}) },
          yaxis: { gridcolor: grid, zerolinecolor: grid, ...(spec.layout?.yaxis || {}) },
        }
        Plotly.react(target, spec.data || [], layout, { responsive: true, displaylogo: false, displayModeBar: false })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [theme])
  return null
}
