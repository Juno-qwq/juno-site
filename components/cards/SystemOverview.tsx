"use client"

import { GlassCard } from "@/components/GlassCard"
import { useSimulatedMetrics } from "@/hooks/useSimulatedMetrics"

function Meter({ label, value, display, pct }: { label: string; value: string; display?: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">{label}</span>
        <span className="font-medium text-text">{display ?? value}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--track)]">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: "var(--track-fill)" }}
        />
      </div>
    </div>
  )
}

export function SystemOverview() {
  const { cpu, mem, net, uptime } = useSimulatedMetrics()
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-heading">System // Overview</h2>
        <span className="flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-wide text-accent-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-2" />
          Live
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <Meter label="CPU" value={`${cpu}%`} pct={cpu} />
        <Meter label="MEM" value={`${mem}%`} pct={mem} />
        <Meter label="NET" value={`${net} KB/s`} display={`${net} KB/s`} pct={Math.min(100, net * 11)} />
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">UPTIME</span>
          <span className="font-medium text-text tabular-nums">{uptime}</span>
        </div>
      </div>
      {/* TODO(Phase 2): real system metrics behind useSimulatedMetrics' interface. */}
    </GlassCard>
  )
}
