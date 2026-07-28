"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, FileText, Folder } from "lucide-react"
import type { GardenTreeNode } from "@/lib/garden-types"

function Node({ node, depth, currentUrl }: { node: GardenTreeNode; depth: number; currentUrl?: string }) {
  // Open the branch that contains the current note; top level open by default.
  const containsCurrent = !!currentUrl && (currentUrl.includes(`/${node.path}/`) || false)
  const [open, setOpen] = useState(depth === 0 || containsCurrent)
  const pad = { paddingLeft: `${depth * 12}px` }

  return (
    <div>
      {node.name && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-1 rounded-md px-2 py-1 text-left text-sm text-text transition-colors hover:text-accent-2"
          style={pad}
        >
          <ChevronRight size={13} className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
          <Folder size={13} className="shrink-0 text-text-muted" />
          <span className="truncate">{node.name}</span>
        </button>
      )}
      {open && (
        <>
          {node.folders.map((f) => (
            <Node key={f.path} node={f} depth={node.name ? depth + 1 : depth} currentUrl={currentUrl} />
          ))}
          {node.notes.map((n) => {
            const active = n.url === currentUrl
            return (
              <Link
                key={n.url}
                href={n.url}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors ${
                  active ? "bg-[var(--card-strong)] font-medium text-heading" : "text-text hover:text-accent-2"
                }`}
                style={{ paddingLeft: `${(node.name ? depth + 1 : depth) * 12 + 8}px` }}
              >
                <FileText size={13} className="shrink-0 text-text-muted" />
                <span className="truncate">{n.title}</span>
              </Link>
            )
          })}
        </>
      )}
    </div>
  )
}

/** The folder tree of the whole garden. */
export function GardenExplorer({ tree, currentUrl }: { tree: GardenTreeNode; currentUrl?: string }) {
  return (
    <nav aria-label="Garden explorer" className="flex flex-col gap-0.5">
      <Node node={tree} depth={0} currentUrl={currentUrl} />
    </nav>
  )
}
