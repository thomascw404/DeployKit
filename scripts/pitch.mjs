#!/usr/bin/env node
// Usage: npm run pitch -- [beforeScreenshot]
// Builds the spec-site pitch package in .pitch/:
//   before-after-mobile.png   prospect's first mobile screen vs the concept (needs the teardown's mobile.png)
//   concept-desktop.png       concept, desktop first screen
//   preview.html              one self-contained file (fonts inlined) — opens offline, safe to email
// Run after `npm run build`. The before screenshot defaults to the newest .teardown/*/mobile.png.
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { launch, serve } from './lib/browser.mjs';

const OUT = '.pitch';
mkdirSync(OUT, { recursive: true });
if (!existsSync('dist/index.html')) { console.error('Run `npm run build` first.'); process.exit(1); }

let before = process.argv[2];
if (!before && existsSync('.teardown')) {
  const cands = readdirSync('.teardown').map((d) => join('.teardown', d, 'mobile.png')).filter(existsSync);
  before = cands.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
}

const server = await serve('dist');
const browser = await launch();
try {
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const mp = await m.newPage();
  await mp.goto(server.url + '/', { waitUntil: 'networkidle' });
  await mp.waitForTimeout(1500);
  await mp.screenshot({ path: join(OUT, 'concept-mobile.png') });
  await m.close();

  const d = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await d.newPage();
  await dp.goto(server.url + '/', { waitUntil: 'networkidle' });
  await dp.waitForTimeout(2600);
  await dp.screenshot({ path: join(OUT, 'concept-desktop.png') });
  await d.close();

  if (before) {
    const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
    const html = `<!doctype html><html><body style="margin:0;background:#f4f4f1;font:700 40px system-ui,sans-serif">
      <div style="display:flex;gap:60px;padding:60px">
        <figure style="margin:0;width:780px"><figcaption style="margin-bottom:28px;color:#1b1d2e">TODAY</figcaption>
          <img src="${b64(before)}" style="width:780px;display:block;border-radius:24px;box-shadow:0 20px 60px #0002"></figure>
        <figure style="margin:0;width:780px"><figcaption style="margin-bottom:28px;color:#2e3192">CONCEPT</figcaption>
          <img src="${b64(join(OUT, 'concept-mobile.png'))}" style="width:780px;display:block;border-radius:24px;box-shadow:0 20px 60px #0002"></figure>
      </div></body></html>`;
    const c = await browser.newContext({ viewport: { width: 1740, height: 1000 } });
    const cp = await c.newPage();
    await cp.setContent(html);
    await cp.waitForTimeout(300);
    await cp.screenshot({ path: join(OUT, 'before-after-mobile.png'), fullPage: true });
    await c.close();
  } else {
    console.warn('No before screenshot found (run `npm run teardown -- <url>` first, or pass a path). Skipping before/after.');
  }
} finally {
  await browser.close();
  await server.close();
}

execFileSync(process.execPath, ['scripts/single-file.mjs', join(OUT, 'preview.html')], { stdio: 'inherit' });
if (existsSync('briefs')) for (const f of readdirSync('briefs')) if (f !== 'BRIEF_TEMPLATE.md' && f.endsWith('.md')) copyFileSync(join('briefs', f), join(OUT, f));
console.log(`Pitch package in ${OUT}/`);
