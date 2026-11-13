---
name: deploykit-qa
description: Run and interpret DeployKit's QA gate (lock-file sync, type check, build, placeholder scan, concept safety, axe WCAG A/AA, screenshots, optional Lighthouse) and fix failures. Use before every push and before showing a site to anyone.
---

# DeployKit QA

```bash
npm run qa                 # fast gate, ~1 min
npm run qa -- --lighthouse # adds Lighthouse mobile scores
```

Writes `.qa/report.md` plus `mobile|tablet|desktop(.png|-full.png)`. Exit code 0 = shippable.

## Fixing common failures

| Failure | Fix |
|---|---|
| Lock file out of sync | You or another tool edited `package.json` by hand. Run `npm install`, commit `package-lock.json`. Never hand-edit dependencies. |
| Type check / build | Read the first error. Usually a `site.config.ts` field missing or misspelled; the schema is `src/config/types.ts`. |
| Placeholder content | Replace `example.com`, `(555)` numbers, lorem, TODO in `site.config.ts`. The bundled Brightline example fails this on purpose. |
| Concept: noindex / robots / _headers / banner | `concept` must be set in `site.config.ts` for any real business that hasn't signed off. These are generated automatically from it. |
| axe `color-contrast` | Usually a muted color on `surface`, or text inside an element with reduced opacity. Darken `theme.muted`, or remove opacity from text containers. |
| axe `aria-*` | A component received an `aria-label` without a role; add `role="img"` (decorative groups) or remove the label. |
| JS errors | Open `.qa/desktop.png`, reproduce with `npm run dev`. |
| Lighthouse performance < 90 | Large images in `public/` (convert to WebP/AVIF, set width/height), extra fonts weights in `src/styles/fonts.css`. |

**Always look at the screenshots** (`.qa/mobile.png` first) before calling QA done — automated checks don't catch ugly.
