#!/usr/bin/env node
// Usage: npm run doctor
// Checks everything an agent needs before running the DeployKit pipeline, and says how to fix each gap.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { launch } from './lib/browser.mjs';

const rows = [];
const add = (name, ok, fix = '') => rows.push({ name, ok, fix });
const run = (cmd) => { try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim(); } catch (e) { return null; } };

const [maj, min] = process.versions.node.split('.').map(Number);
add(`Node ${process.versions.node}`, maj > 22 || (maj === 22 && min >= 23), 'Install Node 22.23+ (Astro 7 requirement), e.g. via nvm or fnm.');
add('Dependencies installed', existsSync('node_modules/astro'), 'npm install');

try { const b = await launch(); await b.close(); add('Headless browser', true); }
catch { add('Headless browser', false, 'npx playwright install chromium   (or set DEPLOYKIT_CHROME to a Chrome executable)'); }

const gh = run('gh --version');
add('GitHub CLI (gh)', !!gh, 'Install from https://cli.github.com, then `gh auth login`.');
if (gh) add('gh authenticated', run('gh auth status') !== null, 'gh auth login');

const hasToken = !!process.env.CLOUDFLARE_API_TOKEN;
const hasAcct = !!process.env.CLOUDFLARE_ACCOUNT_ID;
add('CLOUDFLARE_API_TOKEN set (CLI/Actions deploys)', hasToken, 'Optional if you deploy with Workers Builds (dashboard Git import). See FRAMEWORK.md §7 for the token permissions.');
add('CLOUDFLARE_ACCOUNT_ID set', hasAcct, 'Optional; needed by `npm run cf:protect` and GitHub Actions deploys.');
if (hasToken) add('wrangler can authenticate', run('npx wrangler whoami') !== null, 'Check the token permissions (Workers Scripts: Edit, Account Settings: Read).');

const width = Math.max(...rows.map((r) => r.name.length));
for (const r of rows) console.log(`${r.ok ? 'OK  ' : 'MISS'}  ${r.name.padEnd(width)}  ${r.ok ? '' : '→ ' + r.fix}`);
const hard = rows.filter((r) => !r.ok && /Node|Dependencies|Headless/.test(r.name));
process.exit(hard.length ? 1 : 0);
