#!/usr/bin/env node
/**
 * garden-extract — every `publish: true` vault note → content/garden/garden.json.
 *
 * This is the native replacement for Quartz: the Next site renders the garden itself, in the same
 * shell and design system as the rest of the site. Runs in `prebuild`, reusing the shared
 * vault-filter (the same privacy firewall as the blog + roadmap) and the blog's markdown pipeline.
 *
 * For each note it emits rendered HTML (wikilinks already resolved to /garden/… URLs), the outgoing
 * garden links, headings (for a table of contents), and — computed across the set — backlinks. Plus
 * a folder tree for the explorer and a light search index.
 */
import { mkdir, rm, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { pathToFileURL, fileURLToPath } from "node:url"

import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeSlug from "rehype-slug"
import rehypeHighlight from "rehype-highlight"
import rehypeStringify from "rehype-stringify"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SITE = path.resolve(__dirname, "..")
const VAULT = path.resolve(process.env.VAULT_PATH ?? path.join(SITE, "..", "juno-vault"))
const OUT = path.join(SITE, "content", "garden")

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeHighlight, { detect: false, ignoreMissing: true })
  .use(rehypeStringify)

const stripLeadingH1 = (body) => body.replace(/^\s*#\s+.+\r?\n/, "").trimStart()
const asArray = (v) => (Array.isArray(v) ? v : v === undefined || v === null || v === "" ? [] : [v])
const stripTags = (s) => s.replace(/<[^>]+>/g, "").trim()

/** Headings (h2/h3) with their slug ids, for the table of contents. */
function extractHeadings(html) {
  const out = []
  const re = /<h([23])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g
  let m
  while ((m = re.exec(html))) out.push({ level: Number(m[1]), id: m[2], text: stripTags(m[3]) })
  return out
}

/** Outgoing garden links found in the rendered HTML (deduped, self excluded). */
function extractOutgoing(html, self) {
  const set = new Set()
  const re = /href="(\/garden\/[^"#]+)/g
  let m
  while ((m = re.exec(html))) {
    const target = m[1].replace(/\/$/, "")
    if (target !== self) set.add(target)
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

  const byId = new Map()
  for (const n of published) {
    const url = `/garden/${n.route}`
    const html = String(await processor.process(resolveWikilinks(stripLeadingH1(n.body), index)))
      // GFM task-list checkboxes are decorative disabled inputs — hide them from a11y (the item
      // text carries the meaning) so they don't trip the "every input needs a label" rule.
      .replace(/(<input\b)([^>]*\btype="checkbox")/g, '$1 aria-hidden="true"$2')
    byId.set(url, {
      url,
      route: n.route,
      title: n.data.title ?? n.basename,
      folder: path.dirname(n.route) === "." ? "" : path.dirname(n.route),
      type: n.data.type ?? "note",
      tags: asArray(n.data.tags).map(String),
      updated: n.data.updated ?? n.data.created ?? "",
      html,
      headings: extractHeadings(html),
      outgoing: extractOutgoing(html, url),
      // Plain-text preview for search (first ~30 words).
      preview: stripTags(html).replace(/\s+/g, " ").trim().split(" ").slice(0, 30).join(" "),
    })
  }

  // Backlinks = reverse of outgoing, restricted to notes that actually exist.
  const backlinks = new Map()
  for (const note of byId.values()) {
    for (const target of note.outgoing) {
      if (!byId.has(target)) continue
      if (!backlinks.has(target)) backlinks.set(target, [])
      backlinks.get(target).push(note.url)
    }
  }

  const notesOut = [...byId.values()].map((n) => ({
    ...n,
    outgoing: n.outgoing.filter((t) => byId.has(t)),
    backlinks: [...new Set(backlinks.get(n.url) ?? [])],
  }))
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
    // Index notes (`_Folder`) sort first, like the vault.
    notes: node.notes.sort((a, b) => a.base.localeCompare(b.base)),
    folders: [...node.folders.values()].sort((a, b) => a.name.localeCompare(b.name)).map(serializeTree),
  })

  const searchIndex = notesOut.map((n) => ({ url: n.url, title: n.title, tags: n.tags, preview: n.preview }))

  const out = { generatedAt: new Date().toISOString(), notes: notesOut, tree: serializeTree(tree), search: searchIndex }

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
