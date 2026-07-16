# juno-site

The public surface of my digital garden: a Next.js 15 static export served at `/`, with the
Quartz garden merged in at `/garden`. This repo also owns the **deploy pipeline for all
three repos** — see [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

```
juno-vault (private)  ──┐
                        ├──► juno-site's GitHub Action ──► one artifact ──► Cloudflare Pages
juno-garden ────────────┘                                   out/         ──► juno.dev
```

Site and garden deploy as **one artifact to one Pages project** on purpose. Same origin is
what lets a single theme toggle govern both surfaces through a shared `localStorage` key —
split them across two projects and that breaks (DESIGN.md §8).

## Where content comes from

Nothing in this repo is a source of truth for content. Posts live in the vault, and two
independent gates decide what becomes public:

| Gate | Rule | Destination |
| --- | --- | --- |
| Garden | `publish: true` | `/garden/<vault path>` |
| Blog | `type: blog` **and** `status: published` | `/blog/<slug>` |

Both gates are implemented once, in `juno-vault/_system/scripts/vault-filter.mjs`, which CI
and local builds share. `_private/` and `Blog/drafts/` are hard-excluded regardless.

A post routinely cites private notes. Wikilinks to published notes become `/garden/...`
links; **wikilinks to anything else render as plain text**, so a private note's existence
never leaks as a URL.

## Local development

```bash
npm install
npm run dev        # extracts blog posts from ../juno-vault first, then starts Next
```

`scripts/extract-blog.mjs` runs automatically via the `predev`/`prebuild` hooks. It expects
the vault at `../juno-vault`; override with `VAULT_PATH=/path/to/juno-vault`.

It **fails the build** on a frontmatter schema violation (bad `date`, non-array `tags`, a
duplicate slug). Missing *optional* fields are fine. To hold a post back, set
`status: draft` — don't work around the validator.

`content/blog/` is generated and git-ignored. Never edit it; edit the note.

To reproduce the full production artifact locally:

```bash
cd ../juno-garden && npm run sync-local && npx quartz build
cd ../juno-site   && npm run build
rm -rf out/garden && mkdir -p out/garden && cp -r ../juno-garden/public/. out/garden/
npx serve out      # site at /, garden at /garden
```

## Publishing (the daily loop)

Write in Obsidian, then:

```bash
cd juno-vault && git commit -am "note: paged attention" && git push
```

The vault's `dispatch.yml` pings this repo, the Action rebuilds all three surfaces, and the
change is live in ~2 minutes. No manual steps.

---

# Deployment setup (one-time)

## 1. Create the Cloudflare Pages project

The Action uploads a prebuilt directory, so Pages needs **no build configuration** and
should not be connected to a Git repo — connecting it would create a second, conflicting
deploy path.

```bash
npx wrangler login
npx wrangler pages project create juno --production-branch=main
```

Or in the dashboard: **Workers & Pages → Create → Pages → Upload assets**, name it `juno`.

The project name must stay `juno` or the `--project-name` flag in `deploy.yml` needs to
change with it.

## 2. Create the Cloudflare API token

**My Profile → API Tokens → Create Token → Custom token**:

- Permissions: `Account` → `Cloudflare Pages` → `Edit`
- Account Resources: include your account

Copy the token — it is shown once.

Your Account ID is on the right-hand sidebar of the dashboard home, or from
`npx wrangler whoami`.

## 3. Create the GitHub tokens

Two are needed, because the default `GITHUB_TOKEN` is scoped to a single repo: it can
neither read the private vault nor trigger a workflow in another repository.

**Fine-grained PAT** (Settings → Developer settings → Personal access tokens):

| Token | Repository access | Permissions | Lives in |
| --- | --- | --- | --- |
| `VAULT_READ_TOKEN` | `juno-vault` | Contents: **Read**, Metadata: Read | juno-site secrets |
| `SITE_DISPATCH_TOKEN` | `juno-site` | Contents: **Read and write**, Metadata: Read | juno-vault **and** juno-garden secrets |

`SITE_DISPATCH_TOKEN` needs write on `juno-site` because that is the permission the
`repository_dispatch` API checks — it does not write anything.

Set an expiry you'll actually notice. When these expire, deploys fail with a 401/404 on
checkout or dispatch, which reads as a missing repo rather than an expired token.

## 4. Add the secrets

**juno-site** → Settings → Secrets and variables → Actions:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | from step 2 |
| `CLOUDFLARE_ACCOUNT_ID` | from step 2 |
| `VAULT_READ_TOKEN` | from step 3 |

**juno-vault** and **juno-garden** → same page, each:

| Secret | Value |
| --- | --- |
| `SITE_DISPATCH_TOKEN` | from step 3 |

Optional: a repository **variable** `SITE_URL` on juno-site (e.g. `https://juno.dev`)
overrides the default origin used for canonical URLs, OG cards, and the sitemap. It must
match the real origin or link previews break silently.

## 5. Attach the custom domain

Pages project → **Custom domains** → **Set up a custom domain** → `juno.dev`. If the domain
is on Cloudflare DNS the record is created automatically; otherwise add the `CNAME` it
shows you. HTTPS is provisioned automatically.

Until the domain is attached, the site is live at `https://juno.pages.dev`.

## 6. Verify

Push anything to `juno-site`, or run the workflow manually (**Actions → Deploy → Run
workflow**). A green run means:

- `/` renders the dashboard,
- `/garden/` renders the Quartz garden with the same theme toggle,
- `/blog/` lists posts extracted from the vault.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `Repository not found` on the vault checkout | `VAULT_READ_TOKEN` missing, expired, or lacks Contents: Read on juno-vault |
| Vault push doesn't deploy | `SITE_DISPATCH_TOKEN` missing in **juno-vault**, or lacks write on juno-site |
| Build fails in `extract-blog` | A published note violates the frontmatter schema — the error names the file and field |
| `/garden` 404s but `/` works | The merge step didn't run, or Quartz emitted nothing (no notes with `publish: true`) |
| A note isn't in the garden | It lacks `publish: true`, or it's under `_private/` |
| Deploy succeeds, wrong OG previews | `SITE_URL` doesn't match the real origin |
