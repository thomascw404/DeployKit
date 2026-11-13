# DeployKit — agent instructions

DeployKit is a template and framework for marketing sites. One `site.config.ts` defines a site; components, schema, QA and deploy tooling are shared. Its main workflows are building a new site from the template and producing a sourced spec redesign of an existing business site. Either way it deploys privately to the user's own Cloudflare account from their own GitHub. Any agent (Codex, Claude Code, Hermes, Antigravity, Cursor, …) can run it via CLI or the built-in MCP server; nothing is tied to a specific person's accounts.

## Start here
- **New site from the template:** `npm run new -- <slug> [--link-deps]`, fill `briefs/BRIEF_TEMPLATE.md`, write `site.config.ts` (schema: `src/config/types.ts`), run `npm run validate`, then QA and deploy with the skills below.
- **Redesign a business from its URL:** follow `.agents/skills/deploykit-redesign/SKILL.md` end to end.
- **Just analyze a site:** `.agents/skills/site-teardown/SKILL.md`.
- **QA / deploy an existing DeployKit site:** `.agents/skills/deploykit-qa/SKILL.md`, `.agents/skills/deploykit-deploy/SKILL.md`.
- Design rules, copy formulas, section library, checklists: `FRAMEWORK.md`. Config schema: `src/config/types.ts`.

## Commands
| Command | What it does |
|---|---|
| `npm run doctor [-- --json]` | Checks Node 22.23+, deps, headless browser, `gh`, Cloudflare credentials; prints fixes |
| `npm run teardown -- <url> [outDir] [--no-crawl] [--max-pages 4] [--json]` | Headless capture of a site + auto-crawls up to 4 key internal subpages (about, services, reviews, contact, coupons) → `.teardown/<host>/` (`probe.json`, `content.md`, screenshots) |
| `npm run new -- <slug> [dir] [--link-deps] [--json]` | New site from this starter (default `../<slug>`), Worker named `<slug>`. `--link-deps` junctions `node_modules` for instant zero-install local builds |
| `npm run validate [-- --dir <site-dir>] [--json]` | Fast pre-build check of `site.config.ts`: structure, WCAG contrast ratios, SEO title/description lengths, and concept safety |
| `npm run dev` / `npm run build` | Local dev server / type check + static build to `dist/` |
| `npm run qa [-- --lighthouse] [--dir <site-dir>] [--json]` | Full QA gate → `.qa/report.md` + screenshots; supports targeting any `<site-dir>` without `cd`; non-zero exit on failure |
| `npm run pitch [-- before.png] [--dir <site-dir>] [--json]` | Before/after image, desktop shot, single-file `preview.html` → `.pitch/` (reuses fresh `.qa/` screenshots automatically) |
| `npm run sync -- <site-dir>` | Push framework upgrades into an existing site (never touches its config, fonts, `public/`, `briefs/`) |
| `npm run cf:protect [-- --emails a@x.com] [--domain x.com]` | Make every Worker on the account private behind Cloudflare Access |
| `npm run skills:install -- <claude\|hermes\|antigravity\|cursor\|user\|all>` | Copy skills (and MCP config where supported) to where agent runtimes auto-load them |
| `npm run mcp` | Run the DeployKit stdio MCP server (`node scripts/mcp-server.mjs`) |

## DeployKit MCP Server
MCP-capable agents can register `node scripts/mcp-server.mjs` (or `npm run mcp`) as a stdio MCP server. It exposes structured tools and returns both structured JSON results and visual screenshot attachments (`desktop.png`, `mobile.png`, `before-after-mobile.png`) directly into the agent's context:
- `deploykit_doctor` — verify local environment and credentials
- `deploykit_teardown` — capture a target URL + key subpages and return `probe.json`, `content.md`, and `desktop.png` / `mobile.png` images
- `deploykit_new_site` — scaffold a new site (`../<slug>`) with optional `linkDeps`
- `deploykit_validate_config` — validate `site.config.ts` structure, contrast ratios, SEO lengths, and concept safety before building
- `deploykit_qa` — run the full QA gate on any site directory and return `.qa/report.md` + `mobile.png` / `desktop.png` images
- `deploykit_pitch` — generate the pitch package (reusing fresh `.qa/` screenshots) and return `before-after-mobile.png` + `concept-desktop.png`
- `deploykit_cf_protect` — lock down Workers behind Cloudflare Access

## Non-negotiable rules
1. **Facts only.** Every business fact in a site or brief has a source (their site or a public listing, with date). Never invent reviews, ratings, stats, staff, certifications, prices, guarantees or results. Unknown → the brief's verify-with-owner list.
2. **Concepts stay private.** For a real business that hasn't signed: set `concept` in `site.config.ts` (banner + noindex + robots disallow + `X-Robots-Tag` + inert form) **and** deploy only behind Cloudflare Access. Never on their domain. Never public.
3. **Dependencies:** add packages with `npm install <pkg>`; never hand-edit `package.json` dependencies. `npm run qa` must pass (it checks the lock file the way `npm ci` does) before any push.
4. **Credentials:** never ask for passwords, API tokens or 2FA codes in chat or write them to files. The user enters them in `gh auth login`, `gh secret set`, `wrangler login`, or the Cloudflare/GitHub dashboards.
5. **Human checkpoints** (see the redesign skill): right business + direction after teardown; unverified facts after the brief; Access confirmed before first deploy.
6. **Don't publish before QA.** Run `npm run validate` and `npm run qa`, and look at `.qa/mobile.png` yourself; automated checks don't catch ugly.

## Repo map
```
site.config.ts            the one file per site (example: fictional "Brightline" agency — fails QA placeholders on purpose)
src/config/types.ts       schema for site.config.ts (36 cross-industry icons, sections, SEO, theme)
src/lib/icons.ts          36 built-in 24x24 SVG stroke icons across local & professional verticals
src/components/           sections (Hero, Offers, Services, Band, Story, Process, Proof, Faq, Location, Contact, MobileBar…)
src/styles/fonts.css      self-hosted @fontsource imports for this site
wrangler.jsonc            Cloudflare Workers static-assets deploy
worker/index.ts           optional Worker for /api/contact (see file header)
.github/workflows/        optional GitHub Actions deploy (no-ops without secrets)
.agents/skills/           portable Agent Skills (SKILL.md)
scripts/                  doctor, teardown, validate-config, qa, pitch, new-site, sync, single-file, cf-protect, install-skills, mcp-server
briefs/BRIEF_TEMPLATE.md  unified sourced brief format with [site.config.ts] field mappings
docs/examples/            worked example brief (fictional business)
```
