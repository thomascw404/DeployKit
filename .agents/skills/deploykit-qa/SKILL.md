---
name: deploykit-qa
description: Run and interpret DeployKit's QA gate (lock-file sync, type check, build, placeholder scan, concept safety, axe WCAG A/AA, screenshots, optional Lighthouse) and fix failures. Use before every push and before showing a site to anyone.
---

# DeployKit QA

```bash
npm run validate [-- --dir <site-dir>] [--json]             # fast pre-build config, contrast & SEO check
npm run qa [-- --dir <site-dir>] [--json]                   # full browser gate, ~1 min
npm run qa -- --lighthouse [--dir <site-dir>] [--json]      # adds Lighthouse mobile scores
```

Or call the MCP tools `deploykit_validate_config` and `deploykit_qa` (which also returns `.qa/mobile.png` and `.qa/desktop.png` directly as image attachments).

`npm run qa` writes `.qa/report.md` plus `mobile|tablet|desktop(.png|-full.png)` inside the target site directory (which `npm run pitch` / `deploykit_pitch` automatically reuses when fresh). Exit code 0 = shippable.

## Fixing common failures

| Failure | Fix |
|---|---|
| Config validation (`npm run validate`) | Fix reported missing fields, low WCAG contrast pairs (`theme.text`/`theme.muted` on `bg`/`surface`, or `accentInk` on `accent`), overlong `<title>` (> 60 chars) or meta description, or missing `concept` block. |
| Lock file out of sync | You or another tool edited `package.json` by hand. Run `npm install`, commit `package-lock.json`. Never hand-edit dependencies. |
| Type check / build | Read the first error. Usually a `site.config.ts` field missing or misspelled; the schema is `src/config/types.ts`. |
| Placeholder content | Replace `example.com`, `(555)` numbers, lorem, TODO in `site.config.ts`. The bundled Brightline example fails this on purpose. |
| Concept: noindex / robots / _headers / banner | `concept` must be set in `site.config.ts` for any real business that hasn't signed off. These are generated automatically from it. |
| axe `color-contrast` | Usually a muted color on `surface`, or text inside an element with reduced opacity. Darken `theme.muted`, or remove opacity from text containers. |
| axe `aria-*` | A component received an `aria-label` without a role; add `role="img"` (decorative groups) or remove the label. |
| JS errors | Open `.qa/desktop.png`, reproduce with `npm run dev`. |
| Lighthouse performance < 90 | Large images in `public/` (convert to WebP/AVIF, set width/height), extra font weights in `src/styles/fonts.css`. |

**Always look at the screenshots** (`.qa/mobile.png` first) before calling QA done — automated checks don't catch ugly.
