import Link from "next/link"
import { ThemeToggle } from "./ThemeToggle"

// Notes points at the Quartz garden (same origin in production, DESIGN.md §6).
const NAV = [
  { label: "Home", href: "/" },
  { label: "Notes", href: "/garden/" },
  { label: "Blog", href: "/blog/" },
  { label: "Projects", href: "/projects/" },
  { label: "Research", href: "/research/" },
  { label: "Reading", href: "/reading/" },
  { label: "About", href: "/about/" },
]

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <Link href="/" className="group flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold tracking-wide text-heading">JUNO</span>
        <span className="text-xs uppercase tracking-[0.2em] text-text-muted">Digital Garden</span>
      </Link>
      <nav className="hidden items-center gap-5 text-sm text-text-muted md:flex">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="transition-colors hover:text-accent-2">
            {item.label}
          </Link>
        ))}
      </nav>
      <ThemeToggle />
    </header>
  )
}
