import Link from "next/link"
import { ArrowUpRight, BrainCircuit, Github, HeartPulse, LineChart, Network } from "lucide-react"
import { GlassCard } from "@/components/GlassCard"
import { projects, type ProjectIcon, type ProjectStatus } from "@/lib/projects"

const ICON: Record<ProjectIcon, React.ComponentType<{ size?: number }>> = {
  health: HeartPulse,
  chart: LineChart,
  network: Network,
  brain: BrainCircuit,
}

const STATUS_STYLE: Record<ProjectStatus, string> = {
  Live: "bg-emerald-400/15 text-emerald-500 dark:text-emerald-300",
  Research: "bg-[var(--track)] text-accent-2",
  Prototype: "bg-amber-400/15 text-amber-600 dark:text-amber-300",
  Archived: "bg-[var(--track)] text-text-muted",
}

export function FeaturedProjects() {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-heading">Featured Projects</h2>
        <Link href="/projects/" className="text-xs text-accent-2 hover:underline">
          View all →
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {projects.map((p) => {
          const Icon = ICON[p.icon]
          return (
            <div key={p.name} className="rounded-xl border border-card-border bg-[var(--card)] p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-card-border bg-[var(--card-strong)] text-accent-2">
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-heading">{p.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide ${STATUS_STYLE[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="truncate text-xs text-text-muted">{p.subtitle}</div>
                  <div className="mt-2 flex items-center gap-3">
                    {p.repo && (
                      <a
                        href={p.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${p.name} repository`}
                        className="-m-1 inline-flex h-6 w-6 items-center justify-center text-text-muted transition-colors hover:text-accent-2"
                      >
                        <Github size={15} />
                      </a>
                    )}
                    {p.garden && (
                      <a
                        href={p.garden}
                        aria-label={`${p.name} notes`}
                        className="-m-1 inline-flex h-6 w-6 items-center justify-center text-text-muted transition-colors hover:text-accent-2"
                      >
                        <ArrowUpRight size={15} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
