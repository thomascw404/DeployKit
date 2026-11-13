#!/usr/bin/env node
// Usage: npm run teardown -- <url> [outDir]
// Headless teardown of a reference or prospect site. Writes to .teardown/<host>/:
//   probe.json      stack, tokens, type, sections, CTAs, forms, motion, a11y, SEO (scripts/teardown.js)
//   content.md      visible text + internal links (source material for the brief — facts only)
//   desktop.png, mobile.png, mobile-full.png
// Some sites show a bot check to headless browsers. If content.md is a "verifying…" page,
// open the site in a real browser tool instead and run scripts/teardown.js in its console.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch, VIEWPORTS } from './lib/browser.mjs';

const target = process.argv[2];
if (!target || !/^https?:\/\//.test(target)) {
  console.error('Usage: npm run teardown -- https://example.com [outDir]');
  process.exit(1);
}
const host = new URL(target).host;
const out = process.argv[3] ?? join('.teardown', host.replace(/[^a-z0-9.-]/gi, '-'));
mkdirSync(out, { recursive: true });
const probe = readFileSync(new URL('./teardown.js', import.meta.url), 'utf8');

const browser = await launch();
try {
  const desktop = VIEWPORTS.find((v) => v.name === 'desktop');
  const ctx = await browser.newContext({ viewport: { width: desktop.width, height: desktop.height } });
  const page = await ctx.newPage();
  await page.goto(target, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => page.waitForLoadState('load'));
  await page.waitForTimeout(2500);

  const title = await page.title();
  const blocked = /one moment|just a moment|verif|checking your browser|attention required/i.test(title);

  const report = await page.evaluate(probe);
  writeFileSync(join(out, 'probe.json'), JSON.stringify(report, null, 2));

  const content = await page.evaluate(() => {
    const main = document.querySelector('main') ?? document.body;
    const links = [...new Set([...document.querySelectorAll('a[href]')]
      .map((a) => ({ t: a.textContent.trim().replace(/\s+/g, ' ').slice(0, 60), h: a.href }))
      .filter((l) => l.h.startsWith(location.origin))
      .map((l) => `- [${l.t || '(no text)'}](${l.h})`))];
    const footer = document.querySelector('footer')?.innerText ?? '';
    return { text: main.innerText, footer, links };
  });
  writeFileSync(
    join(out, 'content.md'),
    `# ${title}\n\nSource: ${target}\nCaptured: ${new Date().toISOString()}\n\n## Visible text\n\n${content.text}\n\n## Footer\n\n${content.footer}\n\n## Internal links (${content.links.length})\n\n${content.links.join('\n')}\n`,
  );
  await page.screenshot({ path: join(out, 'desktop.png') });
  await ctx.close();

  const m = VIEWPORTS.find((v) => v.name === 'mobile');
  const mctx = await browser.newContext({ viewport: { width: m.width, height: m.height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const mpage = await mctx.newPage();
  await mpage.goto(target, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => mpage.waitForLoadState('load'));
  await mpage.waitForTimeout(2500);
  await mpage.screenshot({ path: join(out, 'mobile.png') });
  await mpage.screenshot({ path: join(out, 'mobile-full.png'), fullPage: true });
  await mctx.close();

  console.log(`Teardown written to ${out}/ (probe.json, content.md, desktop.png, mobile.png, mobile-full.png)`);
  if (blocked) {
    console.warn(`WARNING: page title "${title}" looks like a bot check. Re-run the probe in a real browser before trusting these results.`);
    process.exitCode = 2;
  }
} finally {
  await browser.close();
}
