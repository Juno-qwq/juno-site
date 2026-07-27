#!/usr/bin/env node
/**
 * roadmap-extract — vault Roadmap/ nodes → juno-site/content/roadmap/roadmap.json.
 *
 * Twin of scripts/extract-blog.mjs. Runs before `next build` (prebuild). It reads every
 * `type: roadmap-node` note with `publish: true`, turns `prerequisites` wikilinks into graph
 * edges, resolves body wikilinks against the garden, and emits one JSON the /roadmap page reads.
 *
 * Two invariants it must hold:
 *
 *   1. Schema violations fail the build. A bad `progress`, an unknown `resource_kind`, or a
 *      `roadmaps: []` node is an authoring bug — shipping it silently mangled is worse than red.
 *      A `prerequisites` entry that doesn't resolve to a published node is warned and the edge is
 *      dropped (never dangled), because a private prerequisite must not leak even as a stub.
 *   2. The privacy firewall. `resource_url` is emitted ONLY when it is a plain public http(s) link.
 *      Local paths, PDF links, and libgen/sci-hub/baidu-style sources are stripped — a roadmap node
 *      may stand in for a copyrighted PDF, but its filename/link never reaches the artifact.
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
import rehypeStringify from "rehype-stringify"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SITE = path.resolve(__dirname, "..")
const VAULT = path.resolve(process.env.VAULT_PATH ?? path.join(SITE, "..", "juno-vault"))
const OUT = path.join(SITE, "content", "roadmap")

const RESOURCE_KINDS = new Set([
  "course", "book", "paper", "repo", "video", "interactive", "pdf", "topic",
])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const asArray = (v) => (Array.isArray(v) ? v : v === undefined || v === null || v === "" ? [] : [v])

/** First wikilink target inside a string like `[[slug|label]]` / `[[slug#h]]` → `slug`. */
const linkTarget = (s) => {
  const m = String(s).match(/\[\[([^\]|#]+)/)
  return m ? m[1].trim() : String(s).trim()
}

/**
 * The privacy firewall for links. Only plain public http(s) URLs survive; anything that could
 * be a local file, a PDF, or a paywalled/pirated source is dropped to "".
 */
function safeUrl(u) {
  if (!u) return ""
  const s = String(u).trim()
  if (!/^https?:\/\//i.test(s)) return "" // local paths / obsidian:// / bare filenames
  if (/\.pdf($|[?#])/i.test(s)) return "" // never link a PDF
  if (/libgen|sci-?hub|pan\.baidu|kdocs\.cn/i.test(s)) return "" // never these hosts
  return s
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeStringify)

const stripLeadingH1 = (body) => body.replace(/^\s*#\s+.+\r?\n/, "").trimStart()

// ---------------------------------------------------------------------------

async function main() {
  const filter = path.join(VAULT, "_system", "scripts", "vault-filter.mjs")
  if (!existsSync(filter)) {
    console.error(`roadmap-extract: shared vault filter not found at ${filter}`)
    console.error("Set VAULT_PATH to your juno-vault checkout.")
    process.exit(1)
  }
  const { readNotes, isGardenPublished, buildPublishedIndex, resolveWikilinks } = await import(
    pathToFileURL(filter).href
  )

  const { notes } = await readNotes(VAULT)
  const index = buildPublishedIndex(notes)
  const nodeNotes = notes.filter((n) => n.data.type === "roadmap-node" && isGardenPublished(n.data))
  const byId = new Map(nodeNotes.map((n) => [n.basename, n]))

  const failures = []
  const warnings = []
  const nodes = []
  const edges = []

  for (const n of nodeNotes) {
    const d = n.data
    const errs = []

    const roadmaps = asArray(d.roadmaps).map(String)
    if (roadmaps.length === 0) errs.push("`roadmaps` must list at least one roadmap")

    const progress = typeof d.progress === "number" ? d.progress : Number(d.progress)
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      errs.push(`\`progress\` must be a number 0–100, got ${JSON.stringify(d.progress)}`)
    }

    const kind = d.resource_kind ?? "topic"
    if (!RESOURCE_KINDS.has(kind)) {
      errs.push(`\`resource_kind\` must be one of ${[...RESOURCE_KINDS].join("/")}, got "${kind}"`)
    }

    if (errs.length) {
      failures.push(`${n.relPosix}\n${errs.map((e) => `    - ${e}`).join("\n")}`)
      continue
    }

    // Prerequisites → edges. A target that isn't a published roadmap node is dropped, not dangled.
    const prereqs = []
    for (const raw of asArray(d.prerequisites)) {
      const target = linkTarget(raw)
      if (byId.has(target)) {
        prereqs.push(target)
        edges.push({ from: target, to: n.basename })
      } else {
        warnings.push(`${n.basename}: prerequisite "${target}" is not a published roadmap node — edge dropped`)
      }
    }

    const group = d.part_of ? linkTarget(d.part_of) : null
    const html = String(await processor.process(resolveWikilinks(stripLeadingH1(n.body), index)))

    nodes.push({
      id: n.basename,
      title: d.title ?? n.basename,
      roadmaps,
      categories: asArray(d.categories).map(String),
      progress: Math.round(progress),
      resourceKind: kind,
      resourceUrl: safeUrl(d.resource_url),
      group: group && byId.has(group) ? group : null,
      level: Number.isFinite(Number(d.level)) ? Number(d.level) : 0,
      prerequisites: prereqs,
      // The node's own garden page (it is publish:true, so this always resolves).
      route: `/garden/${n.route}`,
      html,
    })
  }

  if (failures.length) {
    console.error(`\nroadmap-extract: ${failures.length} node(s) violate the schema:\n`)
    for (const f of failures) console.error(`  ${f}\n`)
    process.exit(1)
  }

  // Roadmap + category catalogs, so the page can build its switcher/filters without re-deriving.
  const roadmapIds = [...new Set(nodes.flatMap((n) => n.roadmaps))].sort()
  const roadmaps = roadmapIds.map((id) => {
    const members = nodes.filter((n) => n.roadmaps.includes(id))
    return {
      id,
      count: members.length,
      categories: [...new Set(members.flatMap((n) => n.categories))].sort(),
      avgProgress: members.length
        ? Math.round(members.reduce((s, n) => s + n.progress, 0) / members.length)
        : 0,
    }
  })

  const out = { generatedAt: new Date().toISOString(), roadmaps, nodes, edges }

  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })
  await writeFile(path.join(OUT, "roadmap.json"), `${JSON.stringify(out, null, 2)}\n`, "utf8")

  for (const w of warnings) console.warn(`roadmap-extract: ${w}`)
  console.log(
    `roadmap-extract: ${nodes.length} nodes, ${edges.length} edges across ${roadmaps.length} roadmap(s) → content/roadmap/roadmap.json`,
  )
  for (const r of roadmaps) console.log(`  ${r.id}: ${r.count} nodes, ${r.avgProgress}% avg`)
  if (nodes.length === 0) console.warn("roadmap-extract: no `type: roadmap-node` notes with publish: true found.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
