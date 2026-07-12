/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Cloudflare Pages (DESIGN.md §7, D5). No server needed.
  output: "export",
  // Required for `output: export` — no Next.js Image Optimization server at runtime.
  images: { unoptimized: true },
  // Emit `/route/index.html` so Cloudflare Pages serves clean URLs consistently.
  trailingSlash: true,
  // `design/` holds mockups/composites and lives OUTSIDE app/ & public/, so it is never
  // part of the export. Nothing here references it. (DESIGN.md §9)
}

export default nextConfig
