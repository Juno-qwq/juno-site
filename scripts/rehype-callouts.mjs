/**
 * rehype-callouts — turn Obsidian-style callouts into styled boxes.
 *
 *   > [!note] Optional title
 *   > body…
 *
 * becomes `<div class="callout callout-note"><div class="callout-title">…</div>
 * <div class="callout-content">…</div></div>`. Styled in globals.css against the design tokens.
 * Dependency-free (manual tree walk) to keep the extractor light.
 */

const TITLES = {
  note: "Note", info: "Info", tip: "Tip", important: "Important", success: "Success",
  question: "Question", warning: "Warning", caution: "Caution", danger: "Danger",
  error: "Error", example: "Example", quote: "Quote", abstract: "Abstract", todo: "To-do",
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

function walk(node, fn) {
  if (!node || !node.children) return
  for (const child of node.children) {
    fn(child, node)
    walk(child, fn)
  }
}

export default function rehypeCallouts() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== "element" || node.tagName !== "blockquote") return
      const firstP = node.children.find((c) => c.type === "element" && c.tagName === "p")
      if (!firstP) return
      const firstText = firstP.children[0]
      if (!firstText || firstText.type !== "text") return

      const nl = firstText.value.indexOf("\n")
      const firstLine = nl === -1 ? firstText.value : firstText.value.slice(0, nl)
      const rest = nl === -1 ? "" : firstText.value.slice(nl + 1)
      const m = firstLine.match(/^\[!(\w+)\]([+-]?)\s*(.*)$/)
      if (!m) return

      const type = m[1].toLowerCase()
      const title = m[3].trim() || TITLES[type] || cap(type)

      // Drop the "[!type] title" line, keep the remaining body text.
      firstText.value = rest
      if (!rest && firstP.children.length === 1) {
        node.children = node.children.filter((c) => c !== firstP)
      }

      const titleEl = {
        type: "element",
        tagName: "div",
        properties: { className: ["callout-title"] },
        children: [{ type: "text", value: title }],
      }
      const contentEl = {
        type: "element",
        tagName: "div",
        properties: { className: ["callout-content"] },
        children: node.children,
      }
      node.tagName = "div"
      node.properties = { className: ["callout", `callout-${type}`], "data-callout": type }
      node.children = [titleEl, contentEl]
    })
  }
}
