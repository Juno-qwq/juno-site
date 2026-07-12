import { PagePlaceholder } from "@/components/PagePlaceholder"

/**
 * Dynamic blog post route. `output: export` requires generateStaticParams to enumerate the
 * pages to emit (and needs at least one). These placeholder slugs match the two seed posts
 * in the vault; the real slug list + MDX rendering come from the vault pipeline in Phase 6.
 */
export function generateStaticParams(): { slug: string }[] {
  return [
    { slug: "scaling-llm-inference-with-vllm-on-ray-cluster" },
    { slug: "a-practical-guide-to-pairs-trading-with-python" },
  ]
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <PagePlaceholder kicker="Post" title="Blog Post">
      <p>
        Post <code className="text-accent-2">{slug}</code> renders here once the MDX pipeline is
        wired to the vault in Phase 6.
      </p>
    </PagePlaceholder>
  )
}
