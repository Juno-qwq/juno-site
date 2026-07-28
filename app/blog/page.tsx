import type { Metadata } from "next"
import { GlassCard } from "@/components/GlassCard"
import { PostCard } from "@/components/PostCard"
import { Footer } from "@/components/Footer"
import { getAllPosts } from "@/lib/blog"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Long-form posts on quant research, LLM inference systems, C++/systems, and EEG/BCI — written in my vault, published here.",
  alternates: { canonical: "/blog/" },
}

export default function BlogPage() {
  const posts = getAllPosts()
  const series = [...new Set(posts.map((p) => p.series).filter(Boolean))]

  return (
    <main id="main-content" className="mx-auto max-w-4xl px-5 pb-24 pt-16 lg:pt-6">
        <GlassCard className="p-8 md:p-10" glow>
          <p className="text-xs uppercase tracking-[0.25em] text-accent-2">Writing</p>
          <h1 className="mt-2 text-4xl font-bold text-gradient md:text-5xl">Blog</h1>
          <p className="mt-4 max-w-2xl text-text-muted">
            Long-form posts, written in my vault and published from it. Most are living documents —
            they grow as the notes behind them do. {posts.length} published
            {series.length > 0 && <> across {series.join(", ")}</>}.
          </p>
        </GlassCard>

        <div className="mt-6 flex flex-col gap-4">
          {posts.length === 0 ? (
            <GlassCard className="p-8 text-center text-text-muted">
              No posts published yet. They appear here as soon as a vault note is marked{" "}
              <code className="text-accent-2">status: published</code>.
            </GlassCard>
          ) : (
            posts.map((p) => <PostCard key={p.slug} post={p} />)
          )}
        </div>

        <Footer />
    </main>
  )
}
