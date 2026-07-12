import { PagePlaceholder } from "@/components/PagePlaceholder"

export const metadata = { title: "About — Juno" }

export default function AboutPage() {
  return (
    <PagePlaceholder kicker="Who" title="About">
      <p>
        Junle (Juno) Zhou — UNSW CS/AI, incoming Junior Quant Researcher at Akuna Capital Sydney.
        Interests at the intersection of quant, LLM systems, and time-series research.
      </p>
    </PagePlaceholder>
  )
}
