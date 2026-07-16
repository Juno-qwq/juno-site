"use client"

import Link from "next/link"
import { GlassCard } from "@/components/GlassCard"
import { useTheme } from "@/components/ThemeProvider"
import { formatShortDate, resolveThumbnail, type Post } from "@/lib/posts"

/** A post row on /blog. Client-side only because the thumbnail is theme-swapped. */
export function PostCard({ post }: { post: Post }) {
  const { theme } = useTheme()
  return (
    <GlassCard as="article" className="overflow-hidden transition-transform hover:-translate-y-0.5">
      <Link href={`/blog/${post.slug}/`} className="group flex flex-col gap-4 p-5 sm:flex-row">
        <div
          className="h-32 w-full shrink-0 rounded-xl border border-card-border bg-cover bg-center sm:h-24 sm:w-32"
          style={{ backgroundImage: `url(${resolveThumbnail(post.thumbnail, theme)})` }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[0.65rem] text-text-muted">
            {post.series && <span className="text-accent-2">{post.series}</span>}
            <span>{formatShortDate(post.date)}</span>
            <span aria-hidden="true">·</span>
            <span>{post.readingMinutes} min read</span>
          </div>
          <h2 className="mt-1 text-lg font-semibold text-heading transition-colors group-hover:text-accent-2">
            {post.title}
          </h2>
          {post.description && (
            <p className="mt-1 line-clamp-2 text-sm text-text-muted">{post.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {post.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[var(--track)] px-2 py-0.5 text-[0.65rem] text-text"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </GlassCard>
  )
}
