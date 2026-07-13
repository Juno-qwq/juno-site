// Recent posts for the homepage card. In Phase 6 this is replaced by the real blog pipeline
// (reading vault Blog/published). Until then, a typed stub mirroring the seed posts.
export type RecentPost = {
  title: string
  slug: string
  tags: string[]
  /** ISO date (publication). */
  date: string
  /** Registry key → resolved to a `_light`/`_dark` thumbnail variant (DESIGN.md §9). */
  thumbnail: string
}

export const recentPosts: RecentPost[] = [
  {
    title: "Scaling LLM Inference with vLLM on Ray Cluster",
    slug: "scaling-llm-inference-with-vllm-on-ray-cluster",
    tags: ["vLLM", "LLM", "Systems"],
    date: "2026-07-08",
    thumbnail: "recent_post_1",
  },
  {
    title: "A Practical Guide to Pairs Trading with Python",
    slug: "a-practical-guide-to-pairs-trading-with-python",
    tags: ["Quant", "Trading", "Research"],
    date: "2026-07-05",
    thumbnail: "recent_post_2",
  },
  {
    title: "Building a Modern C++20 Concurrency Toolkit",
    slug: "building-a-modern-c20-concurrency-toolkit",
    tags: ["C++", "Concurrency", "Systems"],
    date: "2026-05-30",
    thumbnail: "recent_post_3",
  },
]

/** Resolve a thumbnail registry key (e.g. "recent_post_1") to a themed asset path. */
export function resolveThumbnail(key: string, theme: "light" | "dark"): string {
  const n = key.replace(/^recent_post_/, "")
  return `/img/posts/recent_post_${theme}_${n}.png`
}
