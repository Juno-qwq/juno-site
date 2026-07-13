"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { GlassCard } from "@/components/GlassCard"

export function StayInLoop() {
  const [email, setEmail] = useState("")
  const [done, setDone] = useState(false)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO(Phase 2): wire to a real newsletter endpoint (CF Worker / provider). No-op for now.
    setDone(true)
    setEmail("")
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-heading">
        <Send size={15} className="text-accent-2" />
        Stay in the Loop
      </div>
      <p className="mt-2 text-xs text-text-muted">New notes, insights, and projects straight to your inbox.</p>
      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="min-w-0 flex-1 rounded-lg border border-card-border bg-[var(--card)] px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-[var(--accent-contrast)]"
          style={{ background: "var(--accent)" }}
        >
          Subscribe
        </button>
      </form>
      {done && <p className="mt-2 text-xs text-accent-2">Thanks — you&apos;re on the list. (Demo only.)</p>}
    </GlassCard>
  )
}
