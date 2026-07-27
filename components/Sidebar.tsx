"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  FlaskConical,
  FolderGit2,
  Github,
  Home,
  Linkedin,
  Mail,
  Menu,
  NotebookText,
  PenSquare,
  User,
  Waypoints,
  X,
} from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { Sparkline } from "./Sparkline"
import { socials, tagline, totalVisits, visitsSeries } from "@/lib/site"

type NavItem = { label: string; href: string; icon: React.ComponentType<{ size?: number }>; external?: boolean }

const NAV: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Notes", href: "/garden/", icon: NotebookText, external: true },
  { label: "Roadmap", href: "/roadmap/", icon: Waypoints },
  { label: "Blog", href: "/blog/", icon: PenSquare },
  { label: "Projects", href: "/projects/", icon: FolderGit2 },
  { label: "Research", href: "/research/", icon: FlaskConical },
  { label: "Reading", href: "/reading/", icon: BookOpen },
  { label: "About", href: "/about/", icon: User },
]

const SOCIAL_ICON = { github: Github, x: X, mail: Mail, linkedin: Linkedin }

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ label, href, icon: Icon, external }) => {
        const active = !external && (href === "/" ? pathname === "/" : pathname.startsWith(href))
        const cls = `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
          active
            ? "bg-[var(--card-strong)] font-medium text-heading shadow-glass"
            : "text-text hover:bg-[var(--card)] hover:text-accent-2"
        }`
        const inner = (
          <>
            <Icon size={17} />
            {label}
          </>
        )
        return external ? (
          <a key={href} href={href} className={cls} onClick={onNavigate}>
            {inner}
          </a>
        ) : (
          <Link key={href} href={href} className={cls} onClick={onNavigate}>
            {inner}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      {/* Identity */}
      <div className="flex flex-col items-center text-center">
        <div
          className="h-24 w-24 rounded-full bg-cover bg-center"
          style={{
            backgroundImage: "var(--avatar-image)",
            boxShadow: "0 0 0 2px var(--card-border), 0 0 28px var(--glow)",
          }}
          aria-label="Juno avatar"
          role="img"
        />
        <div className="mt-3 font-display text-2xl font-bold tracking-wide text-heading">JUNO</div>
        <div className="text-xs uppercase tracking-[0.2em] text-accent-2">Digital Garden</div>
        <p className="mt-2 text-xs text-text-muted">{tagline}</p>
      </div>

      <NavLinks pathname={pathname} onNavigate={onNavigate} />

      {/* Socials */}
      <div className="flex justify-center gap-2">
        {socials.map(({ label, href, icon }) => {
          const Icon = SOCIAL_ICON[icon]
          return (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-card-border bg-card text-text transition-colors hover:text-accent-2"
            >
              <Icon size={16} />
            </a>
          )
        })}
      </div>

      {/* Total Visits */}
      <div className="rounded-xl border border-card-border bg-[var(--card)] p-4">
        <div className="text-[0.7rem] uppercase tracking-wider text-text-muted">Total Visits</div>
        <div className="mt-1 text-2xl font-bold text-heading">{totalVisits.toLocaleString()}</div>
        <Sparkline data={visitsSeries} width={200} height={34} fill className="mt-2 w-full" />
        {/* TODO(Phase 2): real counter via Cloudflare Worker + KV. */}
      </div>

      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="text-xs text-text-muted">Theme</span>
        <ThemeToggle />
      </div>
    </div>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const close = () => setOpen(false)

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-card-border bg-card text-heading backdrop-blur-glass lg:hidden"
      >
        <Menu size={18} />
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={close} aria-hidden="true" />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[280px] border-r border-card-border bg-[var(--card-strong)] backdrop-blur-glass transition-transform duration-300 lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0 lg:bg-[var(--card)] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile close */}
        <button
          type="button"
          onClick={close}
          aria-label="Close menu"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-text hover:text-accent-2 lg:hidden"
        >
          <X size={18} />
        </button>
        <SidebarContent pathname={pathname} onNavigate={close} />
      </aside>
    </>
  )
}
