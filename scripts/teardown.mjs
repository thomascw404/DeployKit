#!/usr/bin/env node
// Usage: npm run teardown -- <url> [outDir] [--no-crawl] [--max-pages <n>] [--dir <cwd>] [--json]
// Headless teardown of a reference or prospect site. Writes to .teardown/<host>/:
//   probe.json      stack, tokens, type, sections, CTAs, forms, motion, a11y, SEO, subpages (scripts/teardown.js)
//   content.md      visible text + internal links + key subpage copy (source material for the brief — facts only)
//   desktop.png, mobile.png, mobile-full.png
// Some sites show a bot check to headless browsers. If content.md is a "verifying…" page,
// open the site in a real browser tool instead and run scripts/teardown.js in its console.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, VIEWPORTS } from './lib/browser.mjs';

const SUBPAGE_PATTERN = /about|service|review|testimonial|contact|offer|coupon|pricing|faq|location|team|story|specials/i;
const SKIP_EXT_PATTERN = /\.(pdf|png|jpe?g|gif|webp|svg|zip|mp4|mp3|doc|docx|xls|xlsx)(\?|$)/i;

export async function runTeardown({ url, outDir, cwd = process.cwd(), crawl = true, maxSubpages = 4 } = {}) {
  if (!url || !/^https?:\/\//.test(url)) {
    throw new Error('A valid http(s) URL is required for teardown.');
  }
  const parsedRoot = new URL(url);
  const host = parsedRoot.host;
  const relOut = outDir ?? join('.teardown', host.replace(/[^a-z0-9.-]/gi, '-'));
  const absOut = isAbsolute(relOut) ? relOut : resolve(cwd, relOut);
  mkdirSync(absOut, { recursive: true });
  const probe = readFileSync(new URL('./teardown.js', import.meta.url), 'utf8');

  const browser = await launch();
  try {
    const desktop = VIEWPORTS.find((v) => v.name === 'desktop');
    const ctx = await browser.newContext({ viewport: { width: desktop.width, height: desktop.height } });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => page.waitForLoadState('load'));
    await page.waitForTimeout(2500);

    const title = await page.title();
    const blocked = /one moment|just a moment|verif|checking your browser|attention required/i.test(title);

    const report = await page.evaluate(probe);

    const content = await page.evaluate(() => {
      const main = document.querySelector('main') ?? document.body;
      const rawLinks = [...document.querySelectorAll('a[href]')]
        .map((a) => ({ t: a.textContent.trim().replace(/\s+/g, ' ').slice(0, 60), h: a.href }))
        .filter((l) => l.h.startsWith(location.origin));
      const links = [...new Set(rawLinks.map((l) => `- [${l.t || '(no text)'}](${l.h})`))];
      const footer = document.querySelector('footer')?.innerText ?? '';
      return { text: main.innerText, footer, links, rawLinks };
    });

    await page.screenshot({ path: join(absOut, 'desktop.png') });

    const subpages = [];
    if (crawl && !blocked && maxSubpages > 0) {
      const normalize = (u) => {
        try {
          const parsed = new URL(u);
          parsed.hash = '';
          return parsed.href.replace(/\/$/, '');
        } catch {
          return '';
        }
      };
      const rootNorm = normalize(url);
      const seen = new Set([rootNorm]);
      const candidates = [];

      for (const l of content.rawLinks) {
        if (!l.h || l.h.startsWith('mailto:') || l.h.startsWith('tel:') || l.h.includes('#')) continue;
        const norm = normalize(l.h);
        if (!norm || seen.has(norm) || SKIP_EXT_PATTERN.test(norm)) continue;
        if (SUBPAGE_PATTERN.test(norm) || SUBPAGE_PATTERN.test(l.t)) {
          seen.add(norm);
          candidates.push(norm);
          if (candidates.length >= maxSubpages) break;
        }
      }

      for (const subUrl of candidates) {
        try {
          const sp = await ctx.newPage();
          await sp.goto(subUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await sp.waitForTimeout(800);
          const subData = await sp.evaluate(() => {
            const main = document.querySelector('main') ?? document.body;
            return {
              url: location.href,
              title: document.title.trim(),
              h1: document.querySelector('h1')?.textContent.trim().replace(/\s+/g, ' ') ?? '',
              text: (main?.innerText || document.body.innerText || '').trim().slice(0, 6000),
            };
          });
          subpages.push(subData);
          await sp.close();
        } catch {
          // Ignore subpage navigation failures so teardown still succeeds
        }
      }
    }

    report.subpages = subpages.map(({ url: u, title: t, h1 }) => ({ url: u, title: t, h1 }));
    writeFileSync(join(absOut, 'probe.json'), JSON.stringify(report, null, 2));

    const subpageMd = subpages.length
      ? `\n## Subpages captured (${subpages.length})\n\n` +
        subpages.map((s) => `### ${s.title || s.h1 || s.url} (${s.url})\n\n${s.text}\n`).join('\n')
      : '';

    writeFileSync(
      join(absOut, 'content.md'),
      `# ${title}\n\nSource: ${url}\nCaptured: ${new Date().toISOString()}\n\n## Visible text\n\n${content.text}\n\n## Footer\n\n${content.footer}\n\n## Internal links (${content.links.length})\n\n${content.links.join('\n')}\n${subpageMd}`,
    );

    await ctx.close();

    const m = VIEWPORTS.find((v) => v.name === 'mobile');
    const mctx = await browser.newContext({
      viewport: { width: m.width, height: m.height },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    const mpage = await mctx.newPage();
    await mpage.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => mpage.waitForLoadState('load'));
    await mpage.waitForTimeout(2500);
    await mpage.screenshot({ path: join(absOut, 'mobile.png') });
    await mpage.screenshot({ path: join(absOut, 'mobile-full.png'), fullPage: true });
    await mctx.close();

    return {
      ok: !blocked,
      blocked,
      title,
      url,
      outDir: absOut,
      files: ['probe.json', 'content.md', 'desktop.png', 'mobile.png', 'mobile-full.png'],
      subpagesVisited: subpages.map((s) => s.url),
      probe: report,
    };
  } finally {
    await browser.close();
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const crawl = !args.includes('--no-crawl');
  const dirIdx = args.indexOf('--dir');
  const cwd = dirIdx !== -1 && args[dirIdx + 1] ? resolve(args[dirIdx + 1]) : process.cwd();
  const maxIdx = args.indexOf('--max-pages');
  const maxSubpages = maxIdx !== -1 && args[maxIdx + 1] ? Number(args[maxIdx + 1]) : 4;

  // Positional args excluding flag values
  const skipIndices = new Set();
  if (dirIdx !== -1) { skipIndices.add(dirIdx); skipIndices.add(dirIdx + 1); }
  if (maxIdx !== -1) { skipIndices.add(maxIdx); skipIndices.add(maxIdx + 1); }
  const positionals = args.filter((a, i) => !skipIndices.has(i) && !a.startsWith('--'));

  const target = positionals[0];
  const outDir = positionals[1];
  if (!target || !/^https?:\/\//.test(target)) {
    console.error('Usage: npm run teardown -- https://example.com [outDir] [--no-crawl] [--max-pages <n>] [--dir <cwd>] [--json]');
    process.exit(1);
  }

  const res = await runTeardown({ url: target, outDir, cwd, crawl, maxSubpages });
  if (json) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    console.log(
      `Teardown written to ${res.outDir}/ (${res.files.join(', ')}${res.subpagesVisited.length ? `; +${res.subpagesVisited.length} subpages` : ''})`,
    );
    if (res.blocked) {
      console.warn(`WARNING: page title "${res.title}" looks like a bot check. Re-run the probe in a real browser before trusting these results.`);
    }
  }
  if (res.blocked) process.exitCode = 2;
}
