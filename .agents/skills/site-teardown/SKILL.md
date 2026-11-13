---
name: site-teardown
description: Assess an existing or reference website (stack, design tokens, sections, motion, accessibility, SEO, conversion) and write a borrow/beat report with sourced facts. Use before redesigning a prospect's site or building something similar to a reference.
---

# Site teardown

Produces the evidence a redesign is built on. Everything downstream (brief, copy, pitch) may only use facts recorded here.

## Steps

1. **Automated capture** (from the DeployKit root, or via the MCP `deploykit_teardown` tool):
   ```bash
   npm run teardown -- https://prospect.com [outDir] [--no-crawl] [--max-pages 4] [--json]
   ```
   - Writes `.teardown/<host>/`: `probe.json` (stack, tokens, type, sections, CTAs, forms, motion, a11y, SEO), `content.md` (visible homepage text, footer, internal links, plus sourced text from up to 4 automatically crawled key internal subpages such as about, services, reviews, contact, coupons), `desktop.png`, `mobile.png`, `mobile-full.png`.
   - Pass `--no-crawl` to capture only the entry URL, or `--max-pages <n>` to adjust subpage crawl depth.
   - When invoked via the MCP server (`deploykit_teardown`), structured JSON and visual screenshot attachments (`desktop.png`, `mobile.png`) are returned directly to the agent.
   - Exit code 2 / "bot check" warning → the headless browser was blocked. If you have a real browser tool, open the site there and run `scripts/teardown.js` in the page (it returns the same JSON); copy the visible text and footer by hand into `content.md`. Re-take the mobile screenshot at 390px wide for the pitch.
2. **Review subpages & sourced text** in `content.md` (services, about, reviews, contact, coupons). If any critical page wasn't covered by the automatic crawl, inspect it and note the URL of each fact.
3. **Look at the screenshots** (`mobile.png` and `desktop.png`). The first mobile screen is what most visitors see. Record what is and isn't there (phone, booking, proof, hours).
4. **Public listings** (Google Business Profile, Yelp, Birdeye, BBB, Facebook) for rating and review count. They often disagree; record each with source and date and flag the mismatch for the owner to confirm.
5. **Write the report** into `briefs/<slug>.md` using `briefs/BRIEF_TEMPLATE.md` (preserving the `[site.config.ts]` field mappings):
   - **1. Sourced business facts table:** `Field | Config path | Value | Source URL & date`
   - **2. Verify with owner:** checklist of anything uncertain, conflicting or missing
   - **3. Current-site audit:** platform/stack, request/weight, first mobile screen, H1/headings, booking flow, buried info, indexed service/city pages to preserve
   - **4. Problem → Fix (or Borrow / Beat) table:** `Current problem / gap | Concept fix`
   - **5. Copy & brand plan:** `[hero]`, `[band]`, `[process.steps]`, `[faq.items]`, and `[theme]` tokens worth keeping (brand colors, font family from `probe.json`)
   - **6. Launch & 301 redirect plan**

## Rules
- Observed vs inferred: label inferences.
- Never copy their copy, logo or photos into a reference-site build. For a prospect redesign you may reuse the business's own facts, owner quotes and published testimonials, with sources.
- Read-only: never submit their forms, never log in, never accept cookies beyond "necessary only".
