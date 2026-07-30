/**
 * rehype-code-figures — turn ```mermaid and ```plotly fenced code blocks into figure targets that
 * client components render (GardenMermaid / GardenPlotly). Runs BEFORE rehype-highlight so those
 * blocks keep their raw text/JSON instead of being syntax-highlighted.
 *
 *   ```mermaid …           → <pre class="mermaid">…</pre>
 *   ```plotly {json}       → <figure class="plotly-figure"><script type="application/json">…</script></figure>
 *
 * Dependency-free (manual tree walk).
 */
function rawText(node) {
  if (!node) return ""
  if (node.type === "text") return node.value
  return (node.children || []).map(rawText).join("")
}

export default function rehypeCodeFigures() {
  return (tree) => {
    const walk = (node) => {
      if (!node || !node.children) return
      node.children = node.children.map((child) => {
        if (child.type === "element" && child.tagName === "pre") {
          const code = (child.children || []).find((c) => c.type === "element" && c.tagName === "code")
          const cls = code?.properties?.className || []
          const lang = (Array.isArray(cls) ? cls : [cls]).find((c) => typeof c === "string" && c.startsWith("language-"))
          const text = rawText(code)
          if (lang === "language-mermaid") {
            return { type: "element", tagName: "pre", properties: { className: ["mermaid"] }, children: [{ type: "text", value: text }] }
          }
          if (lang === "language-plotly") {
            return {
              type: "element",
              tagName: "figure",
              properties: { className: ["plotly-figure"] },
              children: [
                {
                  type: "element",
                  tagName: "script",
                  properties: { type: "application/json", className: ["plotly-spec"] },
                  children: [{ type: "text", value: text }],
                },
              ],
            }
          }
        }
        walk(child)
        return child
      })
    }
    walk(tree)
  }
}
