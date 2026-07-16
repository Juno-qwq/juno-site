import type { MetadataRoute } from "next"
import { getAllPosts } from "@/lib/blog"
import { site } from "@/lib/site"

/**
 * Static routes + every published post. The /garden tree is NOT listed here: Quartz emits
 * its own sitemap during its build, and duplicating it would mean this file has to know
 * the publish gate too. `output: export` renders this to /sitemap.xml at build time.
 */
export const dynamic = "force-static"

const STATIC_ROUTES = ["/", "/blog/", "/projects/", "/research/", "/reading/", "/about/", "/now/"]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const pages = STATIC_ROUTES.map((route) => ({
    url: `${site.url}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route === "/" ? 1 : 0.7,
  }))

  const posts = getAllPosts().map((p) => ({
    url: `${site.url}/blog/${p.slug}/`,
    lastModified: new Date(p.updated ?? p.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [...pages, ...posts]
}
