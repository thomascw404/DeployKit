#!/usr/bin/env node
// Usage: npm run doctor [-- --json] [-- --dir <path>]
// Checks everything an agent needs before running the DeployKit pipeline, and says how to fix each gap.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function runDoctor({ cwd = process.cwd() } = {}) {
  const rows = [];
  const add = (name, ok, fix = '', hard = false) => rows.push({ name, ok, hard, fix });
  const run = (cmd) => {
    try {
      return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim();
    } catch {
      return null;
    }
  };

  const [maj, min] = process.versions.node.split('.').map(Number);
  add(
    `Node ${process.versions.node}`,
    maj > 22 || (maj === 22 && min >= 23),
    'Install Node 22.23+ (Astro 7 requirement), e.g. via nvm or fnm.',
    true,
  );
  add('Dependencies installed', existsSync(join(cwd, 'node_modules/astro')), 'npm install', true);

  try {
    const { launch } = await import('./lib/browser.mjs');
    const b = await launch();
    await b.close();
    add('Headless browser', true, '', true);
  } catch {
    add(
      'Headless browser',
      false,
      'npx playwright install chromium   (or set DEPLOYKIT_CHROME to a Chrome executable)',
      true,
    );
  }

  const gh = run('gh --version');
  add('GitHub CLI (gh)', !!gh, 'Install from https://cli.github.com, then `gh auth login`.');
  if (gh) add('gh authenticated', run('gh auth status') !== null, 'gh auth login');

  const hasToken = !!process.env.CLOUDFLARE_API_TOKEN;
  const hasAcct = !!process.env.CLOUDFLARE_ACCOUNT_ID;
  add(
    'CLOUDFLARE_API_TOKEN set (CLI/Actions deploys)',
    hasToken,
    'Optional if you deploy with Workers Builds (dashboard Git import). See FRAMEWORK.md §7 for the token permissions.',
  );
  add('CLOUDFLARE_ACCOUNT_ID set', hasAcct, 'Optional; needed by `npm run cf:protect` and GitHub Actions deploys.');
  if (hasToken) {
    add(
      'wrangler can authenticate',
      run('npx wrangler whoami') !== null,
      'Check the token permissions (Workers Scripts: Edit, Account Settings: Read).',
    );
  }

  const hardFailures = rows.filter((r) => !r.ok && r.hard);
  return { ok: hardFailures.length === 0, checks: rows };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const dirIdx = args.indexOf('--dir');
  const cwd = dirIdx !== -1 && args[dirIdx + 1] ? resolve(args[dirIdx + 1]) : process.cwd();

  const res = await runDoctor({ cwd });
  if (json) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    const width = Math.max(...res.checks.map((r) => r.name.length));
    for (const r of res.checks) {
      console.log(`${r.ok ? 'OK  ' : 'MISS'}  ${r.name.padEnd(width)}  ${r.ok ? '' : '→ ' + r.fix}`);
    }
  }
  process.exit(res.ok ? 0 : 1);
}
