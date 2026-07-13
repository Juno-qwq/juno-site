// Static site chrome data — socials, taglines, quotes. `icon` keys map to lucide icons in
// components. Edit here only.
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
