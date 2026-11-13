---
name: deploykit-redesign
description: End-to-end spec redesign of a prospect's website with DeployKit — teardown, sourced brief, new site from the starter, config, build, QA, pitch package, private deploy. Use when asked to redesign, rebuild or pitch a new site for a business given its URL.
---

# DeployKit redesign (URL → deployed concept + pitch)

Read `AGENTS.md` and `FRAMEWORK.md` first. Run from the DeployKit root.

## Checkpoints — stop and ask the user
1. **After the teardown:** confirm this is the right business and the redesign direction (keep brand colors? light/dark?).
2. **After the brief:** show the facts you couldn't verify; get answers or approval to leave them flagged.
3. **Before the first deploy:** confirm Access is on for the account (concepts are never public).
If the user said to run unattended, take the safest option at each checkpoint, note it at the top of the brief, and continue.

## Pipeline

1. **Doctor** — `npm run doctor`. Fix hard failures before continuing.
2. **Teardown** — follow the `site-teardown` skill: `npm run teardown -- <url>`, read key pages, check public review listings, write `briefs/<slug>.md`.
3. **New site** — `npm run new -- <slug>` (creates `../<slug>` with its own `wrangler.jsonc` name), `cd ../<slug>`, `npm install`, copy the brief and `.teardown/` into it.
4. **Fonts** — pick families (keep the brand's if decent). `npm install @fontsource/<family>` (never edit package.json by hand), import the weights in `src/styles/fonts.css`, set `theme.fontSans` / `fontDisplay` / `fontMono` to the exact family names.
5. **Config** — rewrite `site.config.ts` from the brief. Local business kit:
   - `concept: { by: '<agency>', note: 'Concept redesign by', href: '<agency url>' }`
   - `theme.mode: 'light'` (usually), brand `accent` / `accent2`, `texture: 'grid'|'none'`
   - `business` (address, hours, `hoursSpec`, areas, payment) → Location section + LocalBusiness JSON-LD; `seo.schemaType` (AutoRepair, Dentist, Plumber, …)
   - `services.layout: 'grid'` with `icon`s, `more` chips, `features`
   - `offers` only for offers they actually run (copy the terms)
   - `story` with the owner's own words; `proof` with sourced rating + their published testimonials; `proof.source` names the source and month
   - `closing.fields` for a real booking form (vehicle/service/day etc. for the vertical)
   - `mobileBar: { call: true, action: { label: 'Book', href: '#contact' } }`
   - H1: two short lines, outcome + place/pain. Title ≤ 60 chars with "<service> in <City, ST>".
   - Hero `journey` cards show the customer's visit (and the agency's automation upsell), all labelled illustrative by context.
6. **Build & look** — `npm run dev`, check 390px and 1440px. Fix layout before QA.
7. **QA** — `deploykit-qa` skill. All green.
8. **Pitch package** — `npm run pitch` → `.pitch/before-after-mobile.png`, `concept-desktop.png`, `preview.html` (single file, safe to email), brief copy.
9. **Deploy** — `deploykit-deploy` skill. Private repo + Workers + Access.
10. **Report back** — URL (Access-protected), the pitch files, the verify-with-owner list, and the launch-plan note: before any domain switch, crawl their current site and build a 301 map so indexed service pages keep their rankings.

## Hard rules
- Facts only. No invented reviews, ratings, stats, staff, certifications, prices or guarantees. Uncertain → verify list.
- Concept mode on for any real business until they sign. Never public, never on their domain.
- Their logo/photos: use only if pulled from their own site for the pitch to them; otherwise a text wordmark (`brandMark: 'stars'|'dot'`).
- Never hand-edit dependencies; always leave `npm ci` passing.
