"use client"

import { useEffect, useState } from "react"
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
  PanelLeftClose,
  PanelLeftOpen,
  PenSquare,
  User,
  Waypoints,
  X,
} from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { Sparkline } from "./Sparkline"
import { socials, totalVisits, visitsSeries } from "@/lib/site"

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

function NavLinks({ pathname, collapsed, onNavigate }: { pathname: string; collapsed: boolean; onNavigate: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ label, href, icon: Icon, external }) => {
        const active = !external && (href === "/" ? pathname === "/" : pathname.startsWith(href))
        // `collapsed` only applies at lg+ — the mobile drawer always shows full labels.
        const cls = `flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${
          collapsed ? "lg:justify-center lg:px-0" : ""
        } ${
          active
            ? "bg-[var(--card-strong)] font-medium text-heading shadow-glass"
            : "text-text hover:bg-[var(--card)] hover:text-accent-2"
        }`
        const inner = (
          <>
            <Icon size={18} />
            <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
          </>
        )
        return external ? (
          <a key={href} href={href} className={cls} onClick={onNavigate} aria-label={label} title={label}>
            {inner}
          </a>
        ) : (
          <Link key={href} href={href} className={cls} onClick={onNavigate} aria-label={label} title={label}>
            {inner}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarContent({
  pathname, collapsed, onNavigate, onToggleCollapse,
}: {
  pathname: string
  collapsed: boolean
  onNavigate: () => void
  onToggleCollapse: () => void
}) {
  const hideWhenCollapsed = collapsed ? "lg:hidden" : ""
  return (
    // Compact + non-scrolling: everything fits one screen. Nav is the flexible middle; identity is
    // pinned at top and socials/visits/theme at the bottom.
    <div className={`flex h-full flex-col gap-3 overflow-hidden ${collapsed ? "lg:px-2" : ""} p-4`}>
      {/* Collapse toggle — desktop only */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={`hidden shrink-0 text-text-muted transition-colors hover:text-accent-2 lg:flex ${
          collapsed ? "lg:justify-center" : "lg:justify-end"
        }`}
      >
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      {/* Identity */}
      <div className="flex shrink-0 flex-col items-center text-center">
        <div
          className={`rounded-full bg-cover bg-center transition-all ${collapsed ? "h-16 w-16 lg:h-10 lg:w-10" : "h-16 w-16"}`}
          style={{
            backgroundImage: "var(--avatar-image)",
            boxShadow: "0 0 0 2px var(--card-border), 0 0 22px var(--glow)",
          }}
          aria-label="Juno avatar"
          role="img"
        />
        <div className={`mt-2 font-display text-xl font-bold tracking-wide text-heading ${hideWhenCollapsed}`}>JUNO</div>
        <div className={`text-[0.6rem] uppercase tracking-[0.2em] text-accent-2 ${hideWhenCollapsed}`}>Digital Garden</div>
      </div>

      <NavLinks pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />

      <div className="mt-auto flex flex-col gap-3">
        {/* Socials */}
        <div className={`flex justify-center gap-2 ${hideWhenCollapsed}`}>
          {socials.map(({ label, href, icon }) => {
            const Icon = SOCIAL_ICON[icon]
            return (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-card-border bg-card text-text transition-colors hover:text-accent-2"
              >
                <Icon size={15} />
              </a>
            )
          })}
        </div>

        {/* Total Visits */}
        <div className={`rounded-xl border border-card-border bg-[var(--card)] px-3 py-2.5 ${hideWhenCollapsed}`}>
          <div className="flex items-baseline justify-between">
            <span className="text-[0.62rem] uppercase tracking-wider text-text-muted">Total Visits</span>
            <span className="text-base font-bold text-heading">{totalVisits.toLocaleString()}</span>
          </div>
          <Sparkline data={visitsSeries} width={200} height={24} fill className="mt-1.5 w-full" />
          {/* TODO(Phase 2): real counter via Cloudflare Worker + KV. */}
        </div>

        <div className={`flex items-center ${collapsed ? "lg:justify-center" : "justify-between"}`}>
          <span className={`text-xs text-text-muted ${hideWhenCollapsed}`}>Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false) // mobile drawer
  const [collapsed, setCollapsed] = useState(false) // desktop rail
  const pathname = usePathname()
  const close = () => setOpen(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("sidebar-collapsed") === "1")
    } catch {}
  }, [])

  const toggleCollapse = () =>
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem("sidebar-collapsed", next ? "1" : "0")
      } catch {}
      return next
    })

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
        className={`fixed left-0 top-0 z-50 h-full w-[280px] shrink-0 border-r border-card-border bg-[var(--card-strong)] backdrop-blur-glass transition-[transform,width] duration-300 lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0 lg:bg-[var(--card)] ${
          collapsed ? "lg:w-[76px]" : "lg:w-[264px]"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
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
        <SidebarContent pathname={pathname} collapsed={collapsed} onNavigate={close} onToggleCollapse={toggleCollapse} />
      </aside>
    </>
  )
}
