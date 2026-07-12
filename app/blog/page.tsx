import { PagePlaceholder } from "@/components/PagePlaceholder"

export const metadata = { title: "Blog — Juno" }

export default function BlogPage() {
  return (
    <PagePlaceholder kicker="Writing" title="Blog">
      <p>
        Long-form posts across Re:Quant, Re:AI Systems, Re:Systems, Re:Research, and Re:Projects.
        The list and posts are wired to the vault pipeline in Phase 6.
      </p>
    </PagePlaceholder>
  )
}
