import "server-only"

import fs from "node:fs"
import path from "node:path"
import type { Post } from "./posts"

/**
 * Read access to the blog set extracted from the vault by scripts/extract-blog.mjs
 * (run via `prebuild`). Build-time only — a static export resolves every route at
 * `next build`, so the vault is never needed at runtime.
 */

const POSTS_JSON = path.join(process.cwd(), "content", "blog", "posts.json")

let cache: Post[] | null = null

/** All published posts, newest first (sorted at extraction time). */
export function getAllPosts(): Post[] {
  if (cache) return cache
  if (!fs.existsSync(POSTS_JSON)) {
    throw new Error(
      `Blog content missing at ${POSTS_JSON}.\n` +
        "Run `npm run extract-blog` (or `npm run build`, which runs it via prebuild).",
    )
  }
  cache = JSON.parse(fs.readFileSync(POSTS_JSON, "utf8")) as Post[]
  return cache
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug)
}

/** Homepage "Recent Posts" — same source as /blog, top N by date. */
export function getRecentPosts(n = 3): Post[] {
  return getAllPosts().slice(0, n)
}
