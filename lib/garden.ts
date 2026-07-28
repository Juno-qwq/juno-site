import "server-only"

import fs from "node:fs"
import path from "node:path"
import type { GardenData, GardenNote } from "./garden-types"

/** Build-time reader for the garden extracted by scripts/garden-extract.mjs (prebuild). */

const GARDEN_JSON = path.join(process.cwd(), "content", "garden", "garden.json")

let cache: GardenData | null = null

export function getGarden(): GardenData {
  if (cache) return cache
  if (!fs.existsSync(GARDEN_JSON)) {
    throw new Error(
      `Garden content missing at ${GARDEN_JSON}.\n` +
        "Run `npm run extract-garden` (or `npm run build`, which runs it via prebuild).",
    )
  }
  cache = JSON.parse(fs.readFileSync(GARDEN_JSON, "utf8")) as GardenData
  return cache
}

export function getGardenNotes(): GardenNote[] {
  return getGarden().notes
}

/** Look up a note by its route segments (from the [...slug] catch-all). */
export function getGardenNote(slug: string[]): GardenNote | undefined {
  const url = `/garden/${slug.join("/")}`
  return getGarden().notes.find((n) => n.url === url)
}

export function titleOf(url: string): string {
  return getGarden().notes.find((n) => n.url === url)?.title ?? url.split("/").pop() ?? url
}
