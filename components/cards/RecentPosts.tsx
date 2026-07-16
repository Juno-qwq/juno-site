"use client"

import Link from "next/link"
import { GlassCard } from "@/components/GlassCard"
import { useTheme } from "@/components/ThemeProvider"
import { formatShortDate, resolveThumbnail, type Post } from "@/lib/posts"

/**
 * Posts arrive as props: the source is the vault, read at build time by the server page.
 * This component stays a client component only because thumbnails are theme-swapped.
 */
export function RecentPosts({ posts }: { posts: Post[] }) {
  const { theme } = useTheme()
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-heading">Recent Posts</h2>
        <Link href="/blog/" className="text-xs text-accent-2 hover:underline">
          View all →
        </Link>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {posts.length === 0 && <p className="text-sm text-text-muted">No posts published yet.</p>}
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}/`} className="group flex gap-3">
            <div
              className="h-14 w-14 shrink-0 rounded-lg border border-card-border bg-cover bg-center"
              style={{ backgroundImage: `url(${resolveThumbnail(p.thumbnail, theme)})` }}
            />
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-sm font-medium text-text transition-colors group-hover:text-accent-2">
                {p.title}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[var(--track)] px-2 py-0.5 text-[0.65rem] text-text"
                  >
                    {t}
                  </span>
                ))}
                <span className="ml-auto text-[0.65rem] text-text-muted">{formatShortDate(p.date)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </GlassCard>
  )
}
