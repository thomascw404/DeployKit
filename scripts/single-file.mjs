#!/usr/bin/env node
// Usage: npm run single -- [out.html]
// After `npm run build`, writes one self-contained HTML file (fonts inlined as
// data URIs) that can be emailed or opened offline — handy for spec previews.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2] ?? 'preview.html';
let html = readFileSync('dist/index.html', 'utf8');
// Drop .woff fallbacks; every current browser takes woff2.
html = html.replace(/,\s*url\([^)]*?\.woff\)\s*format\(["']woff["']\)/g, '');
// Keep only the basic Latin subset (drop latin-ext, cyrillic, greek, vietnamese faces).
html = html.replace(/@font-face\s*\{[^}]*?-(?:latin-ext|cyrillic(?:-ext)?|greek(?:-ext)?|vietnamese)-[^}]*\}/g, '');
const assets = new Set(readdirSync('dist/_astro', { withFileTypes: true }).filter((f) => f.isFile()).map((f) => f.name));
html = html.replace(/url\((["']?)\/_astro\/([^)"']+)\1\)/g, (m, q, file) => {
  if (!assets.has(file)) return m;
  const ext = file.split('.').pop();
  const mime = { woff2: 'font/woff2', woff: 'font/woff', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }[ext] ?? 'application/octet-stream';
  return `url(data:${mime};base64,${readFileSync(join('dist/_astro', file)).toString('base64')})`;
});
writeFileSync(out, html);
console.log(`Wrote ${out} (${Math.round(html.length / 1024)} KB)`);
