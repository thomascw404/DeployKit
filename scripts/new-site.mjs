#!/usr/bin/env node
// Usage: npm run new -- <slug> [targetDir] [--link-deps] [--json]
// Copies this starter into a sibling folder, ready for a fresh site.config.ts.
import { cpSync, readFileSync, writeFileSync, existsSync, symlinkSync } from 'node:fs';
import { resolve, basename, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

export function runNewSite({ slug, targetDir, cwd = process.cwd(), linkDeps = false } = {}) {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('Usage: npm run new -- <kebab-case-slug> [targetDir] [--link-deps]');
  }
  const src = resolve(cwd);
  const dest = targetDir ? (isAbsolute(targetDir) ? targetDir : resolve(cwd, targetDir)) : resolve(cwd, `../${slug}`);
  if (existsSync(dest)) {
    throw new Error(`${dest} already exists`);
  }

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

  let linkedDeps = false;
  const srcNodeModules = join(src, 'node_modules');
  const destNodeModules = join(dest, 'node_modules');
  if (linkDeps && existsSync(srcNodeModules) && !existsSync(destNodeModules)) {
    symlinkSync(srcNodeModules, destNodeModules, 'junction');
    linkedDeps = true;
  }

  return { ok: true, slug, dest, linkedDeps };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const linkDeps = args.includes('--link-deps');
  const json = args.includes('--json');
  const positionals = args.filter((a) => !a.startsWith('--'));

  try {
    const res = runNewSite({ slug: positionals[0], targetDir: positionals[1], linkDeps });
    if (json) {
      console.log(JSON.stringify(res, null, 2));
    } else {
      console.log(`Created ${res.dest}${res.linkedDeps ? ' (linked node_modules from starter)' : ''}
Next:
  cd ${res.dest}
  ${res.linkedDeps ? '# node_modules linked! If adding new font packages, run `npm install <pkg>` first.' : 'npm install            # adding font/other packages? always `npm install <pkg>`, never hand-edit package.json'}
  # fill briefs/BRIEF_TEMPLATE.md, then rewrite site.config.ts from it
  npm run dev`);
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
