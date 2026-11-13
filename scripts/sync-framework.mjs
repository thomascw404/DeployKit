#!/usr/bin/env node
// Usage: npm run sync -- <path-to-site>
// Pushes framework code (components, layouts, types, pages, global styles, functions)
// from this starter into an existing site. Never touches site.config.ts, src/styles/fonts.css,
// public/, briefs/ or package.json, so client content and assets are safe.
import { cpSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const target = process.argv[2];
if (!target || !existsSync(resolve(target, 'site.config.ts'))) {
  console.error('Usage: npm run sync -- <path-to-site>   (target must contain site.config.ts)');
  process.exit(1);
}
const paths = [
  'src/components', 'src/layouts', 'src/lib', 'src/config', 'src/pages',
  'src/styles/global.css', 'worker', 'scripts', 'FRAMEWORK.md', 'AGENTS.md', 'CLAUDE.md', '.agents', '.github', 'astro.config.ts', 'tsconfig.json',
];
for (const p of paths) {
  const from = resolve(p);
  if (existsSync(from)) cpSync(from, join(resolve(target), p), { recursive: true });
}
console.log(`Synced framework into ${resolve(target)}. Run: npm run build`);
