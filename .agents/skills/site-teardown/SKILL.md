---
name: site-teardown
description: Assess an existing or reference website (stack, design tokens, sections, motion, accessibility, SEO, conversion) and write a borrow/beat report with sourced facts. Use before redesigning a prospect's site or building something similar to a reference.
---

# Site teardown

Produces the evidence a redesign is built on. Everything downstream (brief, copy, pitch) may only use facts recorded here.

## Steps

1. **Automated capture** (from the DeployKit root):
   ```bash
   npm run teardown -- https://prospect.com
   ```
   Writes `.teardown/<host>/`: `probe.json` (stack, tokens, type, sections, CTAs, forms, motion, a11y, SEO), `content.md` (visible text, footer, internal links), `desktop.png`, `mobile.png`, `mobile-full.png`.
   - Exit code 2 / "bot check" warning → the headless browser was blocked. If you have a real browser tool, open the site there and run `scripts/teardown.js` in the page (it returns the same JSON); copy the visible text and footer by hand into `content.md`. Re-take the mobile screenshot at 390px wide for the pitch.
2. **Read every page that matters**, not just the homepage: services, about, reviews, contact, coupons. Note the URL of each fact.
3. **Look at the screenshots.** The first mobile screen is what most visitors see. Record what is and isn't there (phone, booking, proof, hours).
4. **Public listings** (Google Business Profile, Yelp, Birdeye, BBB, Facebook) for rating and review count. They often disagree; record each with source and date and flag the mismatch for the owner to confirm.
5. **Write the report** into `briefs/<slug>.md` using `briefs/BRIEF_TEMPLATE.md`:
   - Facts table: field · value · source URL
   - Verify-with-owner list (anything uncertain, conflicting or missing)
   - Current-site audit: platform, request count, first mobile screen, headings/H1s, reviews, booking flow, buried info, copy quality, fonts, SEO assets worth keeping (indexed service pages!)
   - Borrow / Beat lists (reference sites) or Problem → Fix table (prospects)
   - Tokens worth keeping (brand colors, font family) from `probe.json`

## Rules
- Observed vs inferred: label inferences.
- Never copy their copy, logo or photos into a reference-site build. For a prospect redesign you may reuse the business's own facts, owner quotes and published testimonials, with sources.
- Read-only: never submit their forms, never log in, never accept cookies beyond "necessary only".
