// Static site chrome data — identity, socials, taglines, quotes. `icon` keys map to lucide
// icons in components. Edit here only.

/**
 * Canonical identity used for metadata, OG cards, sitemap, and robots.
 * `url` must match the production origin — it is what absolute OG/canonical URLs are built
 * from, and a wrong value silently breaks link previews.
 */
export const site = {
  name: "Juno",
  title: "Juno — Digital Garden",
  description: "A digital garden for quant, AI, systems, and research by Junle (Juno) Zhou.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://juno.dev",
  locale: "en_US",
  ogImage: "/img/og.png",
} as const

export type Social = { label: string; href: string; icon: "github" | "x" | "mail" | "linkedin" }

export const socials: Social[] = [
  { label: "GitHub", href: "https://github.com/Juno-qwq", icon: "github" },
  { label: "X", href: "https://x.com/", icon: "x" },
  { label: "Email", href: "mailto:quant.lexian@gmail.com", icon: "mail" },
  { label: "LinkedIn", href: "https://www.linkedin.com/", icon: "linkedin" },
]

export const tagline = "Cultivating ideas. Building tomorrow."

export const sidebarQuote = {
  text: "We shape systems, then systems shape us back. Keep learning. Keep building.",
  author: "Juno",
}

export const dailyReminder = {
  text: "The edge comes from curiosity, clarity, and compounding effort.",
}

// Simulated Total Visits sparkline series (TODO: real counter via CF Worker + KV).
export const totalVisits = 128946
export const visitsSeries = [42, 55, 48, 63, 59, 71, 66, 82, 77, 95, 88, 104, 121, 129]
