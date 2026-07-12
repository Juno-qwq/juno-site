# `design/` — Reference assets (NOT deployed)

This directory holds ground-truth references for building the site. **Nothing here is
part of the deployed artifact.**

| File | Role |
|---|---|
| `dashboard_light.png`, `dashboard_dark.png` | **Ground-truth UI mockups.** When in doubt about layout, spacing, hierarchy, or palette, match these exactly. |
| `main_card_light.png`, `main_card_dark.png` | Full hero composites — reference, and the reduced-motion fallback poster source. |

## Build-exclusion contract

`design/` lives at the repo root, **outside** `public/`. Next.js static export
(`output: 'export'`) only emits `public/` and rendered routes into `out/`, and
`wrangler pages deploy out/` ships only `out/`. Therefore `design/` never reaches
Cloudflare Pages.

Rules for later phases:
- **Never** import or reference `design/*` from application code or `public/`.
- The reduced-motion hero poster must be exported into `public/hero/` (a deployable
  copy), not linked from here.
- Keep these files in version control (they are committed reference material); only the
  *deploy path* excludes them.
