#!/usr/bin/env node
/**
 * garden-extract — every `publish: true` vault note → content/garden/garden.json.
 *
 * The native replacement for Quartz: the Next site renders the garden itself, in the same shell and
 * design system as the rest of the site. Runs in `prebuild`, reusing the shared vault-filter (the
 * same privacy firewall as the blog + roadmap).
 *
 * Supports Obsidian features: wikilinks, KaTeX math ($…$ / $$…$$), callouts (> [!note]), and note
 * transclusions (![[note]] embeds the target inline). For each note it emits rendered HTML plus the
 * outgoing links, backlinks, headings (ToC), a folder tree, and a search index.
 */
import { mkdir, rm, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { pathToFileURL, fileURLToPath } from "node:url"

import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeKatex from "rehype-katex"
import rehypeSlug from "rehype-slug"
import rehypeHighlight from "rehype-highlight"
import rehypeStringify from "rehype-stringify"
import rehypeCallouts from "./rehype-callouts.mjs"
import rehypeCodeFigures from "./rehype-code-figures.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SITE = path.resolve(__dirname, "..")
const VAULT = path.resolve(process.env.VAULT_PATH ?? path.join(SITE, "..", "juno-vault"))
const OUT = path.join(SITE, "content", "garden")

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true }) // trusted content (my own vault), like the blog
  .use(rehypeRaw) // parse the raw transclusion <div>s
  .use(rehypeCodeFigures) // mermaid/plotly fences → figure targets (before highlight)
  .use(rehypeCallouts)
  .use(rehypeKatex)
  .use(rehypeSlug)
  .use(rehypeHighlight, { detect: false, ignoreMissing: true })
  .use(rehypeStringify)

const stripLeadingH1 = (body) => body.replace(/^\s*#\s+.+\r?\n/, "").trimStart()
const asArray = (v) => (Array.isArray(v) ? v : v === undefined || v === null || v === "" ? [] : [v])
const stripTags = (s) => s.replace(/<[^>]+>/g, "").trim()
const escapeAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const unescapeAttr = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")

function extractHeadings(html) {
  const out = []
  const re = /<h([23])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g
  let m
  while ((m = re.exec(html))) out.push({ level: Number(m[1]), id: m[2], text: stripTags(m[3]) })
  return out
}

/** Outgoing garden links: resolved <a href> plus transclusion embed targets. */
function extractOutgoing(html, self) {
  const set = new Set()
  for (const re of [/href="(\/garden\/[^"#]+)/g, /data-embed="(\/garden\/[^"#]+)/g]) {
    let m
    while ((m = re.exec(html))) {
      const target = m[1].replace(/\/$/, "")
      if (target !== self) set.add(target)
    }
  }
  return [...set]
}

async function main() {
  const filter = path.join(VAULT, "_system", "scripts", "vault-filter.mjs")
  if (!existsSync(filter)) {
    console.error(`garden-extract: shared vault filter not found at ${filter}`)
    process.exit(1)
  }
  const { readNotes, isGardenPublished, buildPublishedIndex, resolveWikilinks } = await import(
    pathToFileURL(filter).href
  )

  const { notes } = await readNotes(VAULT)
  const index = buildPublishedIndex(notes)
  const published = notes.filter((n) => isGardenPublished(n.data))

  // url → title, so transclusions can label their target.
  const titleByUrl = new Map(published.map((n) => [`/garden/${n.route}`, n.data.title ?? n.basename]))

  // `![[target(#h)?(|label)?]]` → a raw transclusion div (rehype-raw turns it into a real element).
  // Unresolved targets (private/missing) are dropped — never leak their existence.
  const replaceEmbeds = (body) =>
    body.replace(/!\[\[([^\]]+)\]\]/g, (_full, inner) => {
      const target = inner.split("|")[0].split("#")[0].trim()
      const url = index.get(target.toLowerCase())
      if (!url) return ""
      const title = escapeAttr(titleByUrl.get(url) ?? target)
      return `\n\n<div class="transclusion" data-embed="${url}" data-title="${title}"></div>\n\n`
    })

  // Pass 1: render each note to HTML with transclusions still un-expanded (empty marker divs).
  const rawByUrl = new Map()
  const meta = []
  for (const n of published) {
    const url = `/garden/${n.route}`
    const md = resolveWikilinks(replaceEmbeds(stripLeadingH1(n.body)), index)
    const html = String(await processor.process(md)).replace(
      /(<input\b)([^>]*\btype="checkbox")/g,
      '$1 aria-hidden="true"$2',
    )
    rawByUrl.set(url, html)
    meta.push({
      url,
      route: n.route,
      title: n.data.title ?? n.basename,
      folder: path.dirname(n.route) === "." ? "" : path.dirname(n.route),
      type: n.data.type ?? "note",
      tags: asArray(n.data.tags).map(String),
      updated: n.data.updated ?? n.data.created ?? "",
      headings: extractHeadings(html),
      outgoing: extractOutgoing(html, url).filter((t) => titleByUrl.has(t)),
      preview: stripTags(html).replace(/\s+/g, " ").trim().split(" ").slice(0, 30).join(" "),
    })
  }

  // Pass 2: expand transclusions inline, recursively, with a depth cap + cycle guard.
  const expand = (html, depth, ancestors) => {
    if (depth <= 0) return html
    return html.replace(
      /<div class="transclusion" data-embed="([^"]*)" data-title="([^"]*)"><\/div>/g,
      (_m, url, title) => {
        const t = unescapeAttr(title)
        const target = rawByUrl.get(url)
        const head = `<a class="transclusion-title" href="${url}">${t}</a>`
        if (!target || ancestors.has(url)) {
          return `<aside class="transclusion">${head}<p class="transclusion-note">Embedded note — open to read.</p></aside>`
        }
        const inner = expand(target, depth - 1, new Set([...ancestors, url]))
        return `<aside class="transclusion">${head}<div class="transclusion-body">${inner}</div></aside>`
      },
    )
  }

  const byUrl = new Map()
  for (const m of meta) byUrl.set(m.url, { ...m, html: expand(rawByUrl.get(m.url), 3, new Set([m.url])) })

  // Backlinks = reverse of outgoing.
  const backlinks = new Map()
  for (const note of byUrl.values()) {
    for (const target of note.outgoing) {
      if (!byUrl.has(target)) continue
      if (!backlinks.has(target)) backlinks.set(target, [])
      backlinks.get(target).push(note.url)
    }
  }

  const notesOut = [...byUrl.values()].map((n) => ({ ...n, backlinks: [...new Set(backlinks.get(n.url) ?? [])] }))
  notesOut.sort((a, b) => a.route.localeCompare(b.route))

  // Folder tree for the explorer.
  const tree = { name: "", path: "", folders: new Map(), notes: [] }
  for (const n of notesOut) {
    const parts = n.route.split("/")
    let node = tree
    for (const seg of parts.slice(0, -1)) {
      if (!node.folders.has(seg)) {
        node.folders.set(seg, { name: seg, path: node.path ? `${node.path}/${seg}` : seg, folders: new Map(), notes: [] })
      }
      node = node.folders.get(seg)
    }
    node.notes.push({ url: n.url, title: n.title, base: parts[parts.length - 1] })
  }
  const serializeTree = (node) => ({
    name: node.name,
    path: node.path,
    notes: node.notes.sort((a, b) => a.base.localeCompare(b.base)),
    folders: [...node.folders.values()].sort((a, b) => a.name.localeCompare(b.name)).map(serializeTree),
  })

  const search = notesOut.map((n) => ({ url: n.url, title: n.title, tags: n.tags, preview: n.preview }))
  const out = { generatedAt: new Date().toISOString(), notes: notesOut, tree: serializeTree(tree), search }

  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })
  await writeFile(path.join(OUT, "garden.json"), `${JSON.stringify(out)}\n`, "utf8")

  const links = notesOut.reduce((s, n) => s + n.outgoing.length, 0)
  console.log(`garden-extract: ${notesOut.length} notes, ${links} internal links → content/garden/garden.json`)
  if (notesOut.length === 0) console.warn("garden-extract: no `publish: true` notes found.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
