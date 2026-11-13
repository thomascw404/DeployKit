#!/usr/bin/env node
// Usage: npm run new -- <slug> [targetDir]
// Copies this starter into a sibling folder, ready for a fresh site.config.ts.
import { cpSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Usage: npm run new -- <kebab-case-slug> [targetDir]');
  process.exit(1);
}
const src = resolve('.');
const dest = resolve(process.argv[3] ?? `../${slug}`);
if (existsSync(dest)) { console.error(`${dest} already exists`); process.exit(1); }

const skip = new Set(['node_modules', 'dist', '.astro', '.git', '.qa', '.pitch', '.teardown', '.wrangler', '.claude', 'docs']);
cpSync(src, dest, { recursive: true, filter: (p) => !skip.has(basename(p)) });

const pkgPath = resolve(dest, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.name = slug;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const wranglerPath = resolve(dest, 'wrangler.jsonc');
if (existsSync(wranglerPath)) {
  writeFileSync(wranglerPath, readFileSync(wranglerPath, 'utf8').replace(/"name": "[^"]*"/, `"name": "${slug}"`));
}

console.log(`Created ${dest}
Next:
  cd ${dest}
  npm install            # adding font/other packages? always \`npm install <pkg>\`, never hand-edit package.json
  # fill briefs/BRIEF_TEMPLATE.md, then rewrite site.config.ts from it
  npm run dev`);
