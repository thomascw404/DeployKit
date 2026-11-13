#!/usr/bin/env node
// Usage: npm run pitch -- [beforeScreenshot] [--dir <cwd>] [--json]
// Builds the spec-site pitch package in .pitch/:
//   before-after-mobile.png   prospect's first mobile screen vs the concept (needs the teardown's mobile.png)
//   concept-desktop.png       concept, desktop first screen
//   concept-mobile.png        concept, mobile first screen
//   preview.html              one self-contained file (fonts & images inlined) — opens offline, safe to email
// Run after `npm run build` (or `npm run qa`). Reuses fresh `.qa/` screenshots when available!
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, serve } from './lib/browser.mjs';
import { runSingleFile } from './single-file.mjs';

export async function runPitch({ cwd = process.cwd(), before, reuseQa = true, quiet = false } = {}) {
  const absOut = resolve(cwd, '.pitch');
  mkdirSync(absOut, { recursive: true });
  const distIndex = join(cwd, 'dist/index.html');
  if (!existsSync(distIndex)) {
    throw new Error('dist/index.html not found. Run `npm run build` or `npm run qa` first.');
  }

  let beforePath = before ? (isAbsolute(before) ? before : resolve(cwd, before)) : undefined;
  const teardownDir = join(cwd, '.teardown');
  if (!beforePath && existsSync(teardownDir)) {
    const cands = readdirSync(teardownDir)
      .map((d) => join(teardownDir, d, 'mobile.png'))
      .filter(existsSync);
    beforePath = cands.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
  }

  const qaMobile = join(cwd, '.qa/mobile.png');
  const qaDesktop = join(cwd, '.qa/desktop.png');
  const distMtime = statSync(distIndex).mtimeMs;
  const canReuseQa =
    reuseQa &&
    existsSync(qaMobile) &&
    existsSync(qaDesktop) &&
    statSync(qaMobile).mtimeMs >= distMtime &&
    statSync(qaDesktop).mtimeMs >= distMtime;

  const conceptMobile = join(absOut, 'concept-mobile.png');
  const conceptDesktop = join(absOut, 'concept-desktop.png');

  if (canReuseQa) {
    copyFileSync(qaMobile, conceptMobile);
    copyFileSync(qaDesktop, conceptDesktop);
  }

  const needBrowser = !canReuseQa || !!beforePath;
  if (needBrowser) {
    const server = !canReuseQa ? await serve(join(cwd, 'dist')) : null;
    const browser = await launch();
    try {
      if (!canReuseQa) {
        const m = await browser.newContext({
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
          deviceScaleFactor: 2,
        });
        const mp = await m.newPage();
        await mp.goto(server.url + '/', { waitUntil: 'networkidle' });
        await mp.waitForTimeout(1500);
        await mp.screenshot({ path: conceptMobile });
        await m.close();

        const d = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const dp = await d.newPage();
        await dp.goto(server.url + '/', { waitUntil: 'networkidle' });
        await dp.waitForTimeout(2600);
        await dp.screenshot({ path: conceptDesktop });
        await d.close();
      }

      if (beforePath && existsSync(beforePath)) {
        const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
        const html = `<!doctype html><html><body style="margin:0;background:#f4f4f1;font:700 40px system-ui,sans-serif">
          <div style="display:flex;gap:60px;padding:60px">
            <figure style="margin:0;width:780px"><figcaption style="margin-bottom:28px;color:#1b1d2e">TODAY</figcaption>
              <img src="${b64(beforePath)}" style="width:780px;display:block;border-radius:24px;box-shadow:0 20px 60px #0002"></figure>
            <figure style="margin:0;width:780px"><figcaption style="margin-bottom:28px;color:#2e3192">CONCEPT</figcaption>
              <img src="${b64(conceptMobile)}" style="width:780px;display:block;border-radius:24px;box-shadow:0 20px 60px #0002"></figure>
          </div></body></html>`;
        const c = await browser.newContext({ viewport: { width: 1740, height: 1000 } });
        const cp = await c.newPage();
        await cp.setContent(html);
        await cp.waitForTimeout(300);
        await cp.screenshot({ path: join(absOut, 'before-after-mobile.png'), fullPage: true });
        await c.close();
      } else if (!quiet) {
        console.warn('No before screenshot found (run `npm run teardown -- <url>` first, or pass a path). Skipping before/after.');
      }
    } finally {
      await browser.close();
      if (server) await server.close();
    }
  } else if (!quiet) {
    console.warn('No before screenshot found (run `npm run teardown -- <url>` first, or pass a path). Skipping before/after.');
  }

  const singleRes = runSingleFile({ cwd, out: join(absOut, 'preview.html') });
  if (!quiet) console.log(`Wrote ${singleRes.outPath} (${singleRes.sizeKB} KB)`);

  const briefsDir = join(cwd, 'briefs');
  const copiedBriefs = [];
  if (existsSync(briefsDir)) {
    for (const f of readdirSync(briefsDir)) {
      if (f !== 'BRIEF_TEMPLATE.md' && f.endsWith('.md')) {
        copyFileSync(join(briefsDir, f), join(absOut, f));
        copiedBriefs.push(f);
      }
    }
  }

  const files = ['concept-mobile.png', 'concept-desktop.png', 'preview.html'];
  if (existsSync(join(absOut, 'before-after-mobile.png'))) files.unshift('before-after-mobile.png');
  files.push(...copiedBriefs);

  if (!quiet) console.log(`Pitch package in ${absOut}/`);
  return { ok: true, outDir: absOut, reusedQaShots: canReuseQa, files };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const dirIdx = args.indexOf('--dir');
  const cwd = dirIdx !== -1 && args[dirIdx + 1] ? resolve(args[dirIdx + 1]) : process.cwd();
  const skip = new Set(dirIdx !== -1 ? [dirIdx, dirIdx + 1] : []);
  const positionals = args.filter((a, i) => !skip.has(i) && !a.startsWith('--'));

  try {
    const res = await runPitch({ cwd, before: positionals[0], quiet: json });
    if (json) console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
