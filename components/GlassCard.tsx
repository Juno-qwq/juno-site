import { forwardRef } from "react"

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: "div" | "section" | "article"
  /** Adds an accent glow halo around the card (hero / featured cards). */
  glow?: boolean
  /** Slightly more opaque surface for dense/data cards. */
  strong?: boolean
}

/**
 * The core surface primitive (DESIGN.md §8, Phase 3.6): translucent glass with a 1px
 * translucent border, backdrop blur, inner top highlight, large radius, and soft shadow —
 * matching the mockup cards in both themes. All values come from tokens.css.
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { as = "div", glow = false, strong = false, className = "", style, children, ...rest },
  ref,
) {
  const Tag = as
  return (
    <Tag
      ref={ref as never}
      className={`relative rounded-card border border-card-border backdrop-blur-glass ${className}`}
      style={{
        background: strong ? "var(--card-strong)" : "var(--card)",
        boxShadow: glow
          ? "var(--shadow-card), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 40px var(--glow)"
          : "var(--shadow-card), inset 0 1px 0 rgba(255,255,255,0.22)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
})
