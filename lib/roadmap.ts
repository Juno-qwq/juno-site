import "server-only"

import fs from "node:fs"
import path from "node:path"
import type { RoadmapData } from "./roadmap-types"

/**
 * Build-time reader for the roadmap graph extracted from the vault by
 * scripts/roadmap-extract.mjs (run via `prebuild`). Static export resolves it at build.
 */

const ROADMAP_JSON = path.join(process.cwd(), "content", "roadmap", "roadmap.json")

let cache: RoadmapData | null = null

export function getRoadmap(): RoadmapData {
  if (cache) return cache
  if (!fs.existsSync(ROADMAP_JSON)) {
    throw new Error(
      `Roadmap content missing at ${ROADMAP_JSON}.\n` +
        "Run `npm run extract-roadmap` (or `npm run build`, which runs it via prebuild).",
    )
  }
  cache = JSON.parse(fs.readFileSync(ROADMAP_JSON, "utf8")) as RoadmapData
  return cache
}
