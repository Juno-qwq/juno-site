/** Shared garden types — safe on server and client (the fs reader is in lib/garden.ts). */

export type GardenHeading = { level: number; id: string; text: string }

export type GardenNote = {
  /** Public URL, e.g. "/garden/Quant/market-making/bid-ask-spread". */
  url: string
  /** Vault path minus .md. */
  route: string
  title: string
  folder: string
  type: string
  tags: string[]
  updated: string
  /** Rendered note body (wikilinks resolved, leading H1 stripped). */
  html: string
  headings: GardenHeading[]
  /** URLs of notes this one links to. */
  outgoing: string[]
  /** URLs of notes that link here. */
  backlinks: string[]
  preview: string
}

export type GardenTreeNode = {
  name: string
  path: string
  notes: { url: string; title: string; base: string }[]
  folders: GardenTreeNode[]
}

export type GardenSearchItem = { url: string; title: string; tags: string[]; preview: string }

export type GardenData = {
  generatedAt: string
  notes: GardenNote[]
  tree: GardenTreeNode
  search: GardenSearchItem[]
}
