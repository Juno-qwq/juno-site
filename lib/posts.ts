/**
 * The blog's shared vocabulary: the Post type and pure helpers, safe on both sides of the
 * server/client boundary. Filesystem access lives in lib/blog.ts, which is `server-only` —
 * client components (themed thumbnails, date labels) import from here instead.
 */

export type Post = {
  slug: string
  title: string
  /** ISO date (publication). */
  date: string
  updated?: string
  tags: string[]
  description?: string
  /** Registry key → resolved to a `_light`/`_dark` thumbnail variant (DESIGN.md §9). */
  thumbnail?: string
  series?: string
  track?: string
  lang: string
  confidence?: number
  readingMinutes: number
  /** Rendered from the note's markdown, wikilinks already resolved against the garden. */
  html: string
}

/** Resolve a thumbnail registry key (e.g. "recent_post_1") to a themed asset path. */
export function resolveThumbnail(key: string | undefined, theme: "light" | "dark"): string {
  const n = (key ?? "recent_post_1").replace(/^recent_post_/, "")
  return `/img/posts/recent_post_${theme}_${n}.png`
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

/*
 * Dates are formatted by splitting the ISO string, never by constructing a Date:
 * `new Date("2026-07-08")` parses as UTC midnight and renders as the 7th west of Greenwich.
 */

/** Short form for cards: "Jul 8". */
export function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-")
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`
}

/** Long form for post headers: "July 8, 2026". */
export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${MONTHS_FULL[Number(m) - 1]} ${Number(d)}, ${y}`
}
