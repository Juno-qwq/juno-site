#!/usr/bin/env node
/**
 * extract-blog — vault Blog/published/ → juno-site/content/blog/ (DESIGN.md §7 step 4).
 *
 * Runs before `next build` (see the "prebuild" script). For every note passing the blog
 * gate (type: blog AND status: published) it validates the frontmatter against the schema
 * below, resolves wikilinks, renders the markdown to HTML, and writes one JSON file the
 * site's lib/blog.ts reads. `content/blog/` is generated — it is git-ignored, never edited.
 *
 * Two things this must get right:
 *
 *   1. Schema violations fail the build. A post with a bad `date` or a non-array `tags`
 *      is a bug in the note, and shipping it silently mangled is worse than a red build.
 *      Missing OPTIONAL fields are fine and stay undefined.
 *   2. Wikilinks to unpublished notes become plain text, never links. The blog gate and
 *      the garden gate are independent: a published post routinely cites private notes,
 *      and those citations must not leak a URL. resolveWikilinks() in the shared vault
 *      filter enforces this; we only pass it the garden-published index.
 *
 * Rendering note: we emit HTML rather than MDX. The vault is hand-written Obsidian
 * markdown — bare `<`, `{`, and stray JSX-ish text are normal there and are syntax errors
 * in MDX. Posts carry no interactive components, so MDX buys nothing and costs build
 * fragility. Same routes, same static output.
 */
import { mkdir, readdir, rm, writeFile } from "node:fs/promises"
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
const OUT = path.join(SITE, "content", "blog")

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const isString = (v) => typeof v === "string" && v.trim() !== ""
const isStringArray = (v) => Array.isArray(v) && v.every((x) => typeof x === "string")
/** Frontmatter dates arrive as `2026-07-08` (unquoted YAML ⇒ our parser yields a string). */
const isDate = (v) => isString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))

/** [field, required, predicate, expectation] */
const SCHEMA = [
  ["title", true, isString, "a non-empty string"],
  ["date", true, isDate, "an ISO date (YYYY-MM-DD)"],
  ["tags", true, isStringArray, "an array of strings"],
  ["updated", false, isDate, "an ISO date (YYYY-MM-DD)"],
  ["description", false, isString, "a non-empty string"],
  ["thumbnail", false, isString, "a thumbnail registry key"],
  ["series", false, isString, "a non-empty string"],
  ["track", false, isString, "a non-empty string"],
  ["lang", false, isString, "a language code"],
  ["slug", false, isString, "a non-empty string"],
  ["confidence", false, (v) => Number.isInteger(v) && v >= 1 && v <= 5, "an integer 1-5"],
]

function validate(note) {
  const errors = []
  for (const [field, required, ok, expectation] of SCHEMA) {
    const value = note.data[field]
    const absent = value === undefined || value === null || value === ""
    if (absent) {
      if (required) errors.push(`missing required field \`${field}\` (expected ${expectation})`)
      continue // optional + absent is fine, by design
    }
    if (!ok(value)) errors.push(`\`${field}\` must be ${expectation}, got ${JSON.stringify(value)}`)
  }
  return errors
}

// ---------------------------------------------------------------------------
// Transforms
// ---------------------------------------------------------------------------

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

/** The page renders the title in the header; a duplicate H1 in the body is noise. */
const stripLeadingH1 = (body) => body.replace(/^\s*#\s+.+\r?\n/, "").trimStart()

const readingMinutes = (body) => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220))

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeHighlight, { detect: false, ignoreMissing: true })
  .use(rehypeStringify)

// ---------------------------------------------------------------------------

async function main() {
  const filter = path.join(VAULT, "_system", "scripts", "vault-filter.mjs")
  if (!existsSync(filter)) {
    console.error(`extract-blog: shared vault filter not found at ${filter}`)
    console.error("Set VAULT_PATH to your juno-vault checkout.")
    process.exit(1)
  }
  const { readNotes, isBlogPublished, buildPublishedIndex, resolveWikilinks } = await import(
    pathToFileURL(filter).href
  )

  const { notes } = await readNotes(VAULT)
  const index = buildPublishedIndex(notes)
  const posts = notes.filter((n) => isBlogPublished(n.data))

  const failures = []
  const out = []
  const seen = new Map()

  for (const note of posts) {
    const errors = validate(note)
    if (errors.length) {
      failures.push(`${note.relPosix}\n${errors.map((e) => `    - ${e}`).join("\n")}`)
      continue
    }
    const slug = isString(note.data.slug) ? slugify(note.data.slug) : slugify(note.data.title)
    if (seen.has(slug)) {
      failures.push(`${note.relPosix}\n    - slug "${slug}" collides with ${seen.get(slug)}`)
      continue
    }
    seen.set(slug, note.relPosix)

    const markdown = resolveWikilinks(stripLeadingH1(note.body), index)
    const html = String(await processor.process(markdown))

    out.push({
      slug,
      title: note.data.title,
      date: note.data.date,
      updated: note.data.updated,
      tags: note.data.tags,
      description: note.data.description,
      thumbnail: note.data.thumbnail,
      series: note.data.series,
      track: note.data.track,
      lang: note.data.lang ?? "en",
      confidence: note.data.confidence,
      readingMinutes: readingMinutes(note.body),
      html,
    })
  }

  if (failures.length) {
    console.error(`\nextract-blog: ${failures.length} post(s) violate the frontmatter schema:\n`)
    for (const f of failures) console.error(`  ${f}\n`)
    console.error("Fix the note's frontmatter, or set `status: draft` to hold it back.\n")
    process.exit(1)
  }

  out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)))

  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })
  await writeFile(path.join(OUT, "posts.json"), `${JSON.stringify(out, null, 2)}\n`, "utf8")

  const linked = out.reduce((n, p) => n + (p.html.match(/href="\/garden\//g)?.length ?? 0), 0)
  console.log(`extract-blog: ${out.length} published post(s) → content/blog/posts.json`)
  console.log(`  garden links resolved: ${linked} (unpublished targets rendered as plain text)`)
  if (out.length === 0) {
    console.warn("extract-blog: no notes match `type: blog` + `status: published`.")
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
