// Hardcoded year to avoid a build-vs-view hydration mismatch on a static export.
const YEAR = 2026

export function Footer() {
  return (
    <footer className="mt-8 flex flex-col items-center gap-1 py-6 text-center text-xs text-text-muted">
      <div>© {YEAR} Juno. All rights reserved.</div>
      <div>Built with Next.js, React, TypeScript, Tailwind CSS &amp; Motion</div>
    </footer>
  )
}
