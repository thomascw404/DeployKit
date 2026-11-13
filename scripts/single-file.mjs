#!/usr/bin/env node
// Usage: npm run single -- [out.html] [--dir <cwd>]
// After `npm run build`, writes one self-contained HTML file (fonts & local images inlined as
// data URIs) that can be emailed or opened offline — handy for spec previews.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, isAbsolute, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME_MAP = {
  woff2: 'font/woff2',
  woff: 'font/woff',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

export function runSingleFile({ cwd = process.cwd(), out } = {}) {
  const distDir = join(cwd, 'dist');
  const outPath = out ? (isAbsolute(out) ? out : resolve(cwd, out)) : resolve(cwd, 'preview.html');
  let html = readFileSync(join(distDir, 'index.html'), 'utf8');

  // Drop .woff fallbacks; every current browser takes woff2.
  html = html.replace(/,\s*url\([^)]*?\.woff\)\s*format\(["']woff["']\)/g, '');
  // Keep only the basic Latin subset (drop latin-ext, cyrillic, greek, vietnamese faces).
  html = html.replace(/@font-face\s*\{[^}]*?-(?:latin-ext|cyrillic(?:-ext)?|greek(?:-ext)?|vietnamese)-[^}]*\}/g, '');

  const astroDir = join(distDir, '_astro');
  const assets = existsSync(astroDir)
    ? new Set(
        readdirSync(astroDir, { withFileTypes: true })
          .filter((f) => f.isFile())
          .map((f) => f.name),
      )
    : new Set();

  html = html.replace(/url\((["']?)\/_astro\/([^)"']+)\1\)/g, (m, q, file) => {
    if (!assets.has(file)) return m;
    const ext = file.split('.').pop().toLowerCase();
    const mime = MIME_MAP[ext] ?? 'application/octet-stream';
    return `url(data:${mime};base64,${readFileSync(join(astroDir, file)).toString('base64')})`;
  });

  // Inline local <img ... src="/..."> attributes so offline preview has no broken images
  html = html.replace(/(<img\b[^>]*?\bsrc=)(["'])(\/[^"']*)\2/gi, (m, prefix, q, srcPath) => {
    if (srcPath.startsWith('//')) return m;
    const cleanRel = srcPath.replace(/^\/+/, '').split('?')[0];
    const filePath = join(distDir, cleanRel);
    if (!existsSync(filePath)) return m;
    const ext = extname(filePath).slice(1).toLowerCase();
    const mime = MIME_MAP[ext];
    if (!mime) return m;
    return `${prefix}${q}data:${mime};base64,${readFileSync(filePath).toString('base64')}${q}`;
  });

  writeFileSync(outPath, html);
  const sizeKB = Math.round(html.length / 1024);
  return { ok: true, outPath, sizeKB };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const dirIdx = args.indexOf('--dir');
  const cwd = dirIdx !== -1 && args[dirIdx + 1] ? resolve(args[dirIdx + 1]) : process.cwd();
  const skip = new Set(dirIdx !== -1 ? [dirIdx, dirIdx + 1] : []);
  const positionals = args.filter((a, i) => !skip.has(i) && !a.startsWith('--'));

  const res = runSingleFile({ cwd, out: positionals[0] });
  console.log(`Wrote ${res.outPath} (${res.sizeKB} KB)`);
}
