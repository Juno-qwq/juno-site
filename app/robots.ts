import type { MetadataRoute } from "next"
import { site } from "@/lib/site"

export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    // The garden ships its own sitemap from the Quartz build; both are listed so crawlers
    // discover the notes as well as the site.
    sitemap: [`${site.url}/sitemap.xml`, `${site.url}/garden/sitemap.xml`],
    host: site.url,
  }
}
