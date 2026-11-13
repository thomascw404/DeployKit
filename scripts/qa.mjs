#!/usr/bin/env node
// Usage: npm run qa [-- --lighthouse]
// One command for the FRAMEWORK.md §6 checklist. Exits non-zero on any failure.
//   1. Lock file in sync with package.json (what `npm ci` on Cloudflare/GitHub checks)
//   2. Type check + build
//   3. Placeholder scan of dist/ (example.com, 555 numbers, lorem, TODO)
//   4. Concept safety: concept builds must be noindex + robots disallow + _headers
//   5. axe-core WCAG 2 A/AA on the built page (all reveal animations forced on)
//   6. Screenshots at 390 / 768 / 1440 → .qa/
//   7. (--lighthouse) Lighthouse mobile scores via `npx lighthouse`
// Report: .qa/report.md
import { exec, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
const execAsync = promisify(exec);
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, serve, VIEWPORTS } from './lib/browser.mjs';

const OUT = '.qa';
mkdirSync(OUT, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

// 1. Lock file sync
{
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  let lock;
  try { lock = JSON.parse(readFileSync('package-lock.json', 'utf8')); } catch { lock = null; }
  if (!lock) check('package-lock.json present', false, 'run `npm install` and commit the lock file');
  else {
    const root = lock.packages?.[''] ?? {};
    const diff = [];
    for (const field of ['dependencies', 'devDependencies']) {
      const a = pkg[field] ?? {}, b = root[field] ?? {};
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[k] !== b[k]) diff.push(`${field}.${k}: package.json=${a[k] ?? '-'} lock=${b[k] ?? '-'}`);
    }
    check('Lock file in sync with package.json', diff.length === 0, diff.length ? `${diff.join('; ')} → run \`npm install\`` : '');
  }
}

// 2. Build
{
  const r = spawnSync('npm', ['run', 'build'], { encoding: 'utf8', shell: process.platform === 'win32' });
  const ok = r.status === 0;
  check('Type check + build', ok, ok ? '' : (r.stdout + r.stderr).split('\n').filter((l) => /error/i.test(l)).slice(0, 5).join(' | '));
  if (!ok) finish();
}

// 3. Placeholders
{
  const html = readdirSync('dist', { recursive: true }).filter((f) => String(f).endsWith('.html')).map((f) => readFileSync(join('dist', String(f)), 'utf8')).join('\n');
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
  const hits = [
    [/example\.com/gi, 'example.com'], [/\(555\)|555-0\d{3}/g, '555 number'], [/lorem ipsum/gi, 'lorem ipsum'], [/\bTODO\b|\bTBD\b/g, 'TODO/TBD'],
  ].flatMap(([re, label]) => (text.match(re) ? [`${label} ×${text.match(re).length}`] : []));
  check('No placeholder content in dist/', hits.length === 0, hits.join(', '));
}

// 4. Concept safety
const site = readFileSync('site.config.ts', 'utf8');
const isConcept = /^\s*concept\s*:/m.test(site);
if (isConcept) {
  const index = readFileSync('dist/index.html', 'utf8');
  const robots = existsSync('dist/robots.txt') ? readFileSync('dist/robots.txt', 'utf8') : '';
  const headers = existsSync('dist/_headers') ? readFileSync('dist/_headers', 'utf8') : '';
  check('Concept: meta noindex', /name="robots" content="noindex/.test(index));
  check('Concept: robots.txt disallows all', /Disallow: \/\s*$/m.test(robots));
  check('Concept: _headers X-Robots-Tag', /X-Robots-Tag: noindex/.test(headers));
  check('Concept: banner present', /concept-bar/.test(index));
}

// 5–6. axe + screenshots
const server = await serve('dist');
const browser = await launch();
try {
  const axeSrc = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
  for (const v of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, isMobile: !!v.isMobile, hasTouch: !!v.hasTouch, deviceScaleFactor: v.deviceScaleFactor });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(server.url + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: join(OUT, `${v.name}.png`) });
    await page.evaluate(() => {
      document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-in'));
      document.querySelectorAll('[data-scene]').forEach((e) => (e.dataset.focused = 'true'));
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: join(OUT, `${v.name}-full.png`), fullPage: true });
    check(`No JS errors (${v.name})`, errors.length === 0, errors.slice(0, 3).join(' | '));
    if (v.name === 'mobile' || v.name === 'desktop') {
      await page.addScriptTag({ content: axeSrc });
      const violations = await page.evaluate(async () =>
        (await window.axe.run({ runOnly: ['wcag2a', 'wcag2aa'] })).violations.map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0]?.target.join(' ')}`),
      );
      check(`axe WCAG 2 A/AA (${v.name})`, violations.length === 0, violations.slice(0, 5).join(' | '));
    }
    await ctx.close();
  }

  // 7. Lighthouse (optional)
  if (process.argv.includes('--lighthouse')) {
    try {
      const chromePath = browser.browserType().executablePath();
      // Async on purpose: the static server lives in this process and must keep serving while Lighthouse runs.
      await execAsync(`npx --yes lighthouse@13 ${server.url}/ --quiet --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=${join(OUT, 'lighthouse.json')}`, {
        env: { ...process.env, CHROME_PATH: process.env.DEPLOYKIT_CHROME ?? chromePath }, timeout: 240000, maxBuffer: 1 << 26,
      });
      const lh = JSON.parse(readFileSync(join(OUT, 'lighthouse.json'), 'utf8'));
      const s = Object.fromEntries(Object.entries(lh.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
      // SEO is capped by noindex on concept builds; judge it only for launch builds.
      const seoOk = isConcept || s.seo >= 100;
      check('Lighthouse mobile', s.performance >= 90 && s.accessibility >= 100 && s['best-practices'] >= 95 && seoOk, JSON.stringify(s) + (isConcept ? ' (SEO capped by concept noindex — expected)' : ''));
    } catch (e) {
      check('Lighthouse mobile', false, `could not run: ${e.message.split('\n')[0]}`);
    }
  }
} finally {
  await browser.close();
  await server.close();
}
finish();

function finish() {
  const failed = results.filter((r) => !r.ok);
  const md = `# QA report\n\n${new Date().toISOString()}\n\n| Result | Check | Detail |\n|---|---|---|\n${results
    .map((r) => `| ${r.ok ? 'PASS' : '**FAIL**'} | ${r.name} | ${r.detail.replace(/\|/g, '\\|')} |`).join('\n')}\n\nScreenshots: ${VIEWPORTS.map((v) => `${v.name}.png, ${v.name}-full.png`).join(' · ')}\n`;
  writeFileSync(join(OUT, 'report.md'), md);
  console.log(`\n${failed.length ? `${failed.length} check(s) failed` : 'All checks passed'} — report: ${OUT}/report.md`);
  process.exit(failed.length ? 1 : 0);
}
