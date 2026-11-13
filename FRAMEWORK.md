# DeployKit Framework

A repeatable way to go from "I like that site" to a launched, fast, accessible marketing site.
The starter in this repo implements these patterns. Agents: start with `AGENTS.md`.

---

## 1. Workflow

| Phase | Output | Tooling | Done when |
|---|---|---|---|
| **0. Teardown** (optional) | Reference report: stack, tokens, sections, motion, gaps | Browser + `scripts/teardown.js`, `site-teardown` skill | You can name what to borrow and what to beat |
| **1. Brief** | `briefs/<client>.md` from `BRIEF_TEMPLATE.md` | Interview / call notes | Audience, offer, primary CTA, proof, and 6–10 FAQs are written down |
| **2. Config** | `site.config.ts` filled from the brief | Editor / Claude | `npm run build` passes with zero placeholder text |
| **3. Customize** | Brand tokens, art cards, any new section | Tailwind, `Art.astro` kinds | Looks right at 390px and 1440px |
| **4. QA** | QA checklist (§6) all green | Lighthouse, axe, Playwright screenshots, Rich Results test | No red items |
| **5. Launch** | Live on domain, tracked, indexed | Cloudflare Pages, Search Console, analytics | Sitemap submitted, form test received |
| **6. Operate** | Monthly report, content updates | GSC / Ads / analytics MCPs | Report sent; backlog updated |

Rule: **content before layout.** Never open the design phase with lorem ipsum — a polished shell with thin copy is the most common failure.

---

## 2. Architecture

```
site.config.ts          ← one file per site: brand, copy, sections, SEO, contact, analytics
src/config/types.ts     ← schema (typed; `astro check` catches missing fields)
src/components/         ← one component per section + Art.astro (mock-UI cards)
src/layouts/Base.astro  ← head: meta, OG, canonical, JSON-LD (Org + FAQPage), fonts, analytics
src/pages/index.astro   ← section registry; renders config.sections in order
worker/index.ts         ← optional Worker: static site + POST /api/contact (Resend)
src/styles/fonts.css    ← per-site self-hosted font imports (@fontsource)
AGENTS.md / CLAUDE.md   ← agent instructions (any runtime) / Claude pointer
.agents/skills/         ← portable skills: site-teardown, deploykit-redesign, deploykit-qa, deploykit-deploy
scripts/doctor.mjs      ← environment check with fixes                (npm run doctor)
scripts/teardown.mjs    ← headless capture of a site                  (npm run teardown -- <url>)
scripts/qa.mjs          ← QA gate + screenshots                       (npm run qa [-- --lighthouse])
scripts/pitch.mjs       ← before/after, desktop shot, preview.html    (npm run pitch)
scripts/cf-protect.mjs  ← Cloudflare Access: all Workers private      (npm run cf:protect)
scripts/new-site.mjs    ← clone the starter for a new client      (npm run new -- <slug> [dir])
scripts/sync-framework.mjs ← push framework upgrades into an existing site (npm run sync -- <dir>)
scripts/single-file.mjs ← one self-contained HTML preview to email  (npm run single -- out.html)
scripts/teardown.js     ← in-page probe (used by teardown.mjs; paste into any browser console)
wrangler.jsonc          ← Cloudflare Workers static-assets deploy config
```

- **Stack:** Astro 7 (static output, zero JS by default) + Tailwind v4 + small vanilla scripts. Builds to one self-contained `index.html` (CSS and JS inlined).
- **Why not Next.js?** Same visual result, but Astro ships less JS for a brochure site and has no server to run. Switch to Next.js only when the site needs auth, a dashboard, or heavy app routes.
- **Theming:** config colors → CSS variables on `<html>` → Tailwind utilities (`bg-accent`, `bg-accent-2`, `text-muted`, `border-line`). Dark and light modes both work; components tint with `ink/5`-style utilities, never hard-coded white. Optional display face (`fontDisplay`, `displayUppercase`) for headings.
- **Fonts:** self-hosted by default (`theme.fontSource: 'self'`): install `@fontsource/*` packages and import them in `src/styles/fonts.css`. Family names in the config must match the package's declared family (variable fonts end in "Variable"). Set `fontSource: 'google'` to load from Google Fonts instead.
- **Upgrading client sites:** improve the starter, then `npm run sync -- ../client-site`. Sync never touches `site.config.ts`, `fonts.css`, `public/`, `briefs/` or `package.json`.

### Adding a section
1. Create `src/components/MySection.astro` reading from `site.config`.
2. Add its shape to `SiteConfig` in `types.ts` and its id to `SectionId`.
3. Register it in `src/pages/index.astro`.
4. Add the id to `sections` in the config where it should appear.

### Section library (current)

| id | Pattern | Use when |
|---|---|---|
| `hero` | Eyebrow · 2-line H1 · support · 2 CTAs · chips · animated journey stack | Always |
| `services` | Numbered scenes; the one in view lights up; each has a mock-UI card | 3–8 offerings |
| `band` | Full-bleed accent strip with one positioning sentence | You have a crisp two-sided promise |
| `process` | 4–6 numbered steps in a joined grid | Buyers worry about how the work happens |
| `proof` | Stat tiles and/or quotes | You have **real** numbers or permissioned quotes. Otherwise remove it |
| `faq` | Accessible accordion + FAQPage JSON-LD | Always — it handles objections and helps search |
| `contact` | Heading + direct details + working form; fields configurable via `closing.fields` (text, tel, email, select, date, textarea) | Always |
| `offers` | Coupon cards with visible terms; alternates accent / accent-2 | The business runs real specials or discounts |
| `story` | Owner/company story + pull quote + quick facts | Owner-operated businesses; ownership changes |
| `location` | Address + directions, hours, contact, payment; feeds LocalBusiness JSON-LD | Any business with a physical location |

**Services layouts:** `scenes` (numbered rows with mock-UI art, agency style) or `grid` (icon cards + "also on the menu" chips + feature strip, local-business style). Icons: see `src/lib/icons.ts`.

**Site-wide options:** `mobileBar` (sticky Call / Book bar on phones), `business` (address, hours, `hoursSpec`, areas, payment, `sameAs` → JSON-LD), `brandMark` (`dot` / `stars` / `none` when there is no logo file), `concept` (see §8).

### Art card kinds (`Art.astro`)
`search` · `steps` · `pipeline` · `form` · `message` · `metric` · `browser` · `chart`.
They are illustrative only; keep a note saying so on the page (honesty + legal).

---

## 3. Copy formulas

- **Eyebrow:** the 2–4 things you sell, separated by `·`.
- **H1 (two lines):** line 1 = the outcome; line 2 = the pain removed. "More booked jobs. / Less admin."
- **Support (1 sentence):** who it's for + how you deliver it, in plain words.
- **Primary CTA:** a specific, small step with a time box ("Book a 20-minute call"), not "Learn more".
- **Service cards:** title = noun phrase the customer would search; body = the result in ≤ 25 words.
- **Band:** "[Thing A] when you need [X]. [Thing B] when you need [Y]."
- **FAQ:** answer the six buyer objections: who it's for, do I need everything, will it work with what I have, who owns it, what does it cost, do you guarantee results.
- **Never:** invented stats, fake reviews, fake client logos. Illustrative mockups must be labelled.

---

## 4. Design rules

- One accent color, used for CTAs, numbers, and the band — roughly ≤ 10% of the screen.
- Check contrast: body text ≥ 4.5:1, accent-on-ink buttons ≥ 4.5:1 (yellow needs near-black text).
- Type: one sans (Geist, Inter, Manrope, Space Grotesk) + one mono for labels. Tight tracking on headings (−0.035em).
- Radius scale: pills for buttons, 16–24px cards. Glass panels (`.glass`) only on dark themes.
- Texture: `carbon`, `grid`, `dots`, or `none` — CSS only, faded by mask, never behind body copy.

## 5. Motion rules

- Motion explains the offer (journey stack), never decorates for its own sake.
- Every looping animation gets a visible **Pause** control (WCAG 2.2.2) and stops off-screen.
- `prefers-reduced-motion` turns animation off globally (already in `global.css`).
- Reveal-on-scroll is opacity + 14px translate only. No parallax on text.

---

## 6. QA checklist

**Content**
- [ ] No placeholder text, example.com, or sample phone numbers (`grep -ri "example\|555" dist/`)
- [ ] Every claim is true; illustrative visuals labelled
- [ ] Spelling/grammar pass

**Build**
- [ ] Fresh-clone install passes: `rm -rf node_modules && npm ci && npm run build:fast` (this is exactly what Cloudflare runs — a lock file out of sync with package.json fails the deploy)

**Function**
- [ ] Form submits to the real endpoint and the test arrives; mailto fallback works when endpoint is empty
- [ ] All anchor links land below the fixed header; mobile menu opens/closes, Esc closes
- [ ] 404 page renders

**Performance & SEO**
- [ ] Lighthouse mobile: Performance ≥ 95, Accessibility 100, Best Practices ≥ 95, SEO 100
- [ ] `<title>` ≤ 60 chars, description 140–160 chars, canonical correct, OG image 1200×630
- [ ] JSON-LD passes Google Rich Results Test (Organization type + FAQPage)
- [ ] `robots.txt` and `sitemap-index.xml` live

**Accessibility**
- [ ] axe: zero violations; keyboard-only run through header, CTAs, FAQ, form
- [ ] Skip link visible on focus; one H1; heading order logical
- [ ] Reduced-motion mode checked

**Visual**
- [ ] Screenshots at 390 / 768 / 1440 widths reviewed (Playwright)

## 7. Deploy & launch

Everything deploys from the user's own GitHub and Cloudflare accounts. Nothing in the repo names an account: the Worker is `wrangler.jsonc → name` and the URL is `https://<name>.<account subdomain>.workers.dev`.

**Deploy (pick one per site)**
- **A. Workers Builds:** Workers & Pages → Create → Import a repository. Build `npm run build:fast`, deploy `npx wrangler deploy`. Auto-deploys on push. The user approves the GitHub authorization once.
- **B. GitHub Actions:** `.github/workflows/deploy.yml` plus repo secrets `CLOUDFLARE_API_TOKEN` (token template "Edit Cloudflare Workers") and `CLOUDFLARE_ACCOUNT_ID`, set with `gh secret set`. Fully scriptable; no-ops without secrets.
- **C. CLI:** `npx wrangler deploy` with the token in the environment.

**Privacy (once per account)**
1. Enable Zero Trust (one.dash.cloudflare.com, Free plan).
2. Turn on Workers & Pages → **Protect all Workers** → All traffic, or run `npm run cf:protect [-- --emails … --domain …]`. For the script, the token also needs Access permissions to edit apps and policies and to read organizations and identity providers.
3. Every Worker is now private. When a client site launches publicly, add a Worker-level bypass or move it to their account.

**Launch (client signed)**
1. **Rankings:** crawl the old site and build a 301 map for every indexed URL (service and location pages especially) before switching domains.
2. Remove `concept` from the config; swap in the real logo and photos and the verified rating; set `url` to the final origin.
3. Custom domain on the Worker; keep the client's MX/email DNS records intact.
4. Form: Formspree/Web3Forms, or `worker/index.ts` (`/api/contact` + Resend; see the file header).
5. Analytics: Cloudflare Web Analytics token (no cookie banner needed) or Plausible/GA4.
6. Search Console: verify, submit `sitemap-index.xml`. Google Business Profile: update the website and booking links.
7. Client access sheet: domain, DNS, hosting, analytics, form inbox, all in the client's name.

## 8. Spec sites for real prospects

A spec site is a free concept for a real business, used to win the project.
- **Facts only.** Every claim comes from their current site or a public listing, with sources in the brief. Never invent reviews, stats, team members or prices. Put anything uncertain on a "verify with owner" list.
- **Concept mode:** set `concept: { by, note, href }`. This adds a top banner, sets `noindex, nofollow`, makes robots.txt disallow everything, and turns form submits into a harmless notice so test entries never reach the real business.
- **Never public.** Share as screenshots, a before/after image and a single-file HTML (`npm run pitch` produces all three). A hosted preview must sit behind Cloudflare Access (§7).
- **The pitch package:**
  1. Before/after mobile image (their site vs. the concept, first screen).
  2. Single-file preview.
  3. One-page audit from the brief (problems → fixes → scores).
  4. A launch plan that protects their existing search rankings (redirect map).

## 9. Agents, skills & tools

| Need | Provided by |
|---|---|
| Instructions for any agent | `AGENTS.md` (Codex, Hermes, Cursor, Copilot…), `CLAUDE.md` → `AGENTS.md` |
| Procedures | `.agents/skills/*/SKILL.md` (Agent Skills format; `npm run skills:install`) |
| Site capture, QA, pitch | `npm run teardown`, `npm run qa`, `npm run pitch` (Playwright + axe; Lighthouse optional) |
| GitHub | `gh` CLI (or a GitHub MCP/connector) |
| Cloudflare | Dashboard, `wrangler`, or the Cloudflare API MCP (`https://mcp.cloudflare.com/mcp`) |
| Live browsing of bot-protected sites | Any browser tool your runtime has; paste `scripts/teardown.js` into the page |
| Optional | Figma MCP (client designs), Search Console / analytics MCPs (post-launch reporting) |

## Examples

- `docs/examples/brief-example.md`: a complete spec-redesign brief for a fictional HVAC company (facts with sources, verify list, current-site audit, problem → fix table, launch plan).
