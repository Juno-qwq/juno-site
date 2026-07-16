import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { GlassCard } from "@/components/GlassCard"
import { SiteHeader } from "@/components/SiteHeader"
import { Footer } from "@/components/Footer"
import { getAllPosts, getPost } from "@/lib/blog"
import { formatLongDate } from "@/lib/posts"
import { site } from "@/lib/site"

/** `output: export` needs every route enumerated up front. */
export function generateStaticParams(): { slug: string }[] {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  const url = `/blog/${post.slug}/`
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      tags: post.tags,
      images: [{ url: site.ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [site.ogImage],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-5 pb-24 pt-6">
        <Link href="/blog/" className="text-xs text-accent-2 hover:underline">
          ← All posts
        </Link>

        <GlassCard as="article" className="mt-3 p-6 md:p-10" glow>
          <header>
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
              {post.series && (
                <span className="uppercase tracking-[0.2em] text-accent-2">{post.series}</span>
              )}
              <time dateTime={post.date}>{formatLongDate(post.date)}</time>
              <span aria-hidden="true">·</span>
              <span>{post.readingMinutes} min read</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-heading md:text-4xl">
              {post.title}
            </h1>
            {post.description && <p className="mt-3 text-text-muted">{post.description}</p>}
            <div className="mt-3 flex flex-wrap gap-1">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[var(--track)] px-2 py-0.5 text-[0.65rem] text-text"
                >
                  {t}
                </span>
              ))}
            </div>
            {post.updated && post.updated !== post.date && (
              <p className="mt-3 text-[0.65rem] text-text-muted">
                Last updated <time dateTime={post.updated}>{formatLongDate(post.updated)}</time>
              </p>
            )}
          </header>

          <hr className="my-6 border-card-border" />

          {/*
            Trusted content: this HTML is generated at build time by scripts/extract-blog.mjs
            from my own vault notes — never from user input — with wikilinks already resolved
            against the published set.
          */}
          <div className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />
        </GlassCard>

        <Footer />
      </main>
    </>
  )
}
