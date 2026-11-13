#!/usr/bin/env node
// Usage: npm run sync -- <path-to-site>
// Pushes framework code (components, layouts, types, pages, global styles, functions)
// from this starter into an existing site. Never touches site.config.ts, src/styles/fonts.css,
// public/, briefs/ or package.json, so client content and assets are safe.
import { cpSync, existsSync } from 'node:fs';
import { resolve, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

export function runSync({ target, cwd = process.cwd() } = {}) {
  const absTarget = target ? (isAbsolute(target) ? target : resolve(cwd, target)) : '';
  if (!absTarget || !existsSync(join(absTarget, 'site.config.ts'))) {
    throw new Error('Usage: npm run sync -- <path-to-site>   (target must contain site.config.ts)');
  }
  const paths = [
    'src/components',
    'src/layouts',
    'src/lib',
    'src/config',
    'src/pages',
    'src/styles/global.css',
    'worker',
    'scripts',
    'FRAMEWORK.md',
    'AGENTS.md',
    'CLAUDE.md',
    '.agents',
    '.github',
    'astro.config.ts',
    'tsconfig.json',
  ];
  const synced = [];
  for (const p of paths) {
    const from = resolve(cwd, p);
    if (existsSync(from)) {
      cpSync(from, join(absTarget, p), { recursive: true });
      synced.push(p);
    }
  }
  return { ok: true, target: absTarget, synced };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const res = runSync({ target: process.argv[2] });
    console.log(`Synced framework into ${res.target}. Run: npm run build`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
