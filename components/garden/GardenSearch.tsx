"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import type { GardenSearchItem } from "@/lib/garden-types"

/** Client search over the garden — a Cmd/Ctrl-K command palette + a button trigger. */
export function GardenSearch({ index, className = "" }: { index: GardenSearchItem[]; className?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQ("")
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return index.slice(0, 8)
    return index
      .map((it) => {
        const t = it.title.toLowerCase()
        const score = t.startsWith(term) ? 0 : t.includes(term) ? 1 : it.preview.toLowerCase().includes(term) || it.tags.some((g) => g.includes(term)) ? 2 : 3
        return { it, score }
      })
      .filter((r) => r.score < 3)
      .sort((a, b) => a.score - b.score || a.it.title.localeCompare(b.it.title))
      .slice(0, 10)
      .map((r) => r.it)
  }, [q, index])

  const go = (url: string) => {
    setOpen(false)
    router.push(url)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 rounded-lg border border-card-border bg-[var(--card)] px-3 py-2 text-sm text-text-muted transition-colors hover:text-accent-2 ${className}`}
      >
        <Search size={15} />
        <span className="flex-1 text-left">Search notes…</span>
        <kbd className="rounded border border-card-border px-1.5 text-[0.65rem]">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl border border-card-border bg-[var(--card-strong)] shadow-glass backdrop-blur-glass"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-card-border px-4 py-3">
              <Search size={16} className="text-text-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setActive(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)) }
                  if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
                  if (e.key === "Enter" && results[active]) go(results[active].url)
                }}
                placeholder="Search the garden…"
                aria-label="Search the garden"
                className="min-w-0 flex-1 bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
              />
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-text-muted">No matches.</li>}
              {results.map((it, i) => (
                <li key={it.url}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(it.url)}
                    className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors ${
                      i === active ? "bg-[var(--card)] text-heading" : "text-text hover:bg-[var(--card)]"
                    }`}
                  >
                    <span className="text-sm font-medium">{it.title}</span>
                    <span className="line-clamp-1 text-xs text-text-muted">{it.preview}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
