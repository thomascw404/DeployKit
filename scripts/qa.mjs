#!/usr/bin/env node
// Usage: npm run qa [-- --lighthouse] [-- --dir <cwd>] [-- --json]
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
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, serve, VIEWPORTS } from './lib/browser.mjs';

const execAsync = promisify(exec);

export async function runQa({ cwd = process.cwd(), lighthouse = false, quiet = false } = {}) {
  const absOut = resolve(cwd, '.qa');
  mkdirSync(absOut, { recursive: true });
  const results = [];
  const check = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    if (!quiet) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  };

  let isConcept = false;
  const siteConfigPath = join(cwd, 'site.config.ts');
  if (existsSync(siteConfigPath)) {
    const rawSite = readFileSync(siteConfigPath, 'utf8');
    const cleanSite = rawSite.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    isConcept = /^\s*concept\s*:/m.test(cleanSite);
  }

  const writeReport = () => {
    const failed = results.filter((r) => !r.ok);
    const md = `# QA report\n\n${new Date().toISOString()}\n\n| Result | Check | Detail |\n|---|---|---|\n${results
      .map((r) => `| ${r.ok ? 'PASS' : '**FAIL**'} | ${r.name} | ${r.detail.replace(/\|/g, '\\|')} |`)
      .join('\n')}\n\nScreenshots: ${VIEWPORTS.map((v) => `${v.name}.png, ${v.name}-full.png`).join(' · ')}\n`;
    const reportPath = join(absOut, 'report.md');
    writeFileSync(reportPath, md);
    if (!quiet) {
      console.log(`\n${failed.length ? `${failed.length} check(s) failed` : 'All checks passed'} — report: ${reportPath}`);
    }
    const screenshots = VIEWPORTS.flatMap((v) => [join(absOut, `${v.name}.png`), join(absOut, `${v.name}-full.png`)]).filter(existsSync);
    return {
      ok: failed.length === 0,
      isConcept,
      results,
      reportPath,
      screenshots,
    };
  };

  // 1. Lock file sync
  {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'));
    let lock;
    try {
      lock = JSON.parse(readFileSync(join(cwd, 'package-lock.json'), 'utf8'));
    } catch {
      lock = null;
    }
    if (!lock) check('package-lock.json present', false, 'run `npm install` and commit the lock file');
    else {
      const root = lock.packages?.[''] ?? {};
      const diff = [];
      for (const field of ['dependencies', 'devDependencies']) {
        const a = pkg[field] ?? {},
          b = root[field] ?? {};
        for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
          if (a[k] !== b[k]) diff.push(`${field}.${k}: package.json=${a[k] ?? '-'} lock=${b[k] ?? '-'}`);
        }
      }
      check('Lock file in sync with package.json', diff.length === 0, diff.length ? `${diff.join('; ')} → run \`npm install\`` : '');
    }
  }

  // 2. Build
  {
    const r = spawnSync('npm run build', { cwd, encoding: 'utf8', shell: true });
    const ok = r.status === 0;
    check(
      'Type check + build',
      ok,
      ok
        ? ''
        : ((r.stdout ?? '') + (r.stderr ?? ''))
            .split('\n')
            .filter((l) => /error/i.test(l))
            .slice(0, 5)
            .join(' | '),
    );
    if (!ok) return writeReport();
  }

  const distDir = join(cwd, 'dist');

  // 3. Placeholders
  {
    const html = readdirSync(distDir, { recursive: true })
      .filter((f) => String(f).endsWith('.html'))
      .map((f) => readFileSync(join(distDir, String(f)), 'utf8'))
      .join('\n');
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
    const hits = [
      [/example\.com/gi, 'example.com'],
      [/\(555\)|555-0\d{3}/g, '555 number'],
      [/lorem ipsum/gi, 'lorem ipsum'],
      [/\bTODO\b|\bTBD\b/g, 'TODO/TBD'],
    ].flatMap(([re, label]) => (text.match(re) ? [`${label} ×${text.match(re).length}`] : []));
    check('No placeholder content in dist/', hits.length === 0, hits.join(', '));
  }

  // 4. Concept safety
  if (isConcept) {
    const index = readFileSync(join(distDir, 'index.html'), 'utf8');
    const robots = existsSync(join(distDir, 'robots.txt')) ? readFileSync(join(distDir, 'robots.txt'), 'utf8') : '';
    const headers = existsSync(join(distDir, '_headers')) ? readFileSync(join(distDir, '_headers'), 'utf8') : '';
    check('Concept: meta noindex', /name="robots" content="noindex/.test(index));
    check('Concept: robots.txt disallows all', /Disallow: \/\s*$/m.test(robots));
    check('Concept: _headers X-Robots-Tag', /X-Robots-Tag: noindex/.test(headers));
    check('Concept: banner present', /concept-bar/.test(index));
  }

  // 5–6. axe + screenshots
  const server = await serve(distDir);
  const browser = await launch();
  try {
    const localAxe = join(cwd, 'node_modules/axe-core/axe.min.js');
    const axeSrc = readFileSync(existsSync(localAxe) ? localAxe : new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
    for (const v of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: v.width, height: v.height },
        isMobile: !!v.isMobile,
        hasTouch: !!v.hasTouch,
        deviceScaleFactor: v.deviceScaleFactor,
      });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(server.url + '/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: join(absOut, `${v.name}.png`) });
      await page.evaluate(() => {
        document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-in'));
        document.querySelectorAll('[data-scene]').forEach((e) => (e.dataset.focused = 'true'));
      });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(absOut, `${v.name}-full.png`), fullPage: true });
      check(`No JS errors (${v.name})`, errors.length === 0, errors.slice(0, 3).join(' | '));
      if (v.name === 'mobile' || v.name === 'desktop') {
        await page.addScriptTag({ content: axeSrc });
        const violations = await page.evaluate(async () =>
          (await window.axe.run({ runOnly: ['wcag2a', 'wcag2aa'] })).violations.map(
            (x) => `${x.id} (${x.nodes.length}): ${x.nodes[0]?.target.join(' ')}`,
          ),
        );
        check(`axe WCAG 2 A/AA (${v.name})`, violations.length === 0, violations.slice(0, 5).join(' | '));
      }
      await ctx.close();
    }

    // 7. Lighthouse (optional)
    if (lighthouse) {
      try {
        const chromePath = browser.browserType().executablePath();
        // Async on purpose: the static server lives in this process and must keep serving while Lighthouse runs.
        const lhOut = join(absOut, 'lighthouse.json');
        await execAsync(
          `npx --yes lighthouse@13 ${server.url}/ --quiet --chrome-flags="--headless=new --no-sandbox" --output=json --output-path="${lhOut}"`,
          {
            cwd,
            env: { ...process.env, CHROME_PATH: process.env.DEPLOYKIT_CHROME ?? chromePath },
            timeout: 240000,
            maxBuffer: 1 << 26,
          },
        );
        const lh = JSON.parse(readFileSync(lhOut, 'utf8'));
        const s = Object.fromEntries(Object.entries(lh.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
        // SEO is capped by noindex on concept builds; judge it only for launch builds.
        const seoOk = isConcept || s.seo >= 100;
        check(
          'Lighthouse mobile',
          s.performance >= 90 && s.accessibility >= 100 && s['best-practices'] >= 95 && seoOk,
          JSON.stringify(s) + (isConcept ? ' (SEO capped by concept noindex — expected)' : ''),
        );
      } catch (e) {
        check('Lighthouse mobile', false, `could not run: ${e.message.split('\n')[0]}`);
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  return writeReport();
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const lighthouse = args.includes('--lighthouse');
  const json = args.includes('--json');
  const dirIdx = args.indexOf('--dir');
  const cwd = dirIdx !== -1 && args[dirIdx + 1] ? resolve(args[dirIdx + 1]) : process.cwd();

  const res = await runQa({ cwd, lighthouse, quiet: json });
  if (json) {
    console.log(JSON.stringify(res, null, 2));
  }
  process.exit(res.ok ? 0 : 1);
}
