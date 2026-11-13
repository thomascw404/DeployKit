#!/usr/bin/env node
// Usage: npm run validate [-- --dir <site-dir>] [--json]
// Fast (<50ms) pre-build validator for site.config.ts:
//   - Checks required top-level sections & fields
//   - Computes exact WCAG 2.1 contrast ratios for theme colors (text/bg, muted/bg, muted/surface, accentInk/accent)
//   - Checks SEO title & description length guidelines
//   - Scans for placeholder strings (example.com, 555 numbers, lorem ipsum, TODO/TBD)
//   - Detects whether concept mode is active
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\/|(?<!:)\/\/.*$/gm, '');
}

function parseHex(hex) {
  if (!hex) return null;
  const clean = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return clean.split('').map((c) => parseInt(c + c, 16));
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
  }
  return null;
}

function luminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(hexA, hexB) {
  const rgbA = parseHex(hexA);
  const rgbB = parseHex(hexB);
  if (!rgbA || !rgbB) return null;
  const l1 = luminance(rgbA);
  const l2 = luminance(rgbB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function extractThemeColors(cleanSrc) {
  const themeMatch = cleanSrc.match(/theme\s*:\s*\{([\s\S]*?)\n\s*\}/);
  if (!themeMatch) return {};
  const block = themeMatch[1];
  const get = (key) => {
    const m = block.match(new RegExp(`\\b${key}\\s*:\\s*['"]([^'"]+)['"]`));
    return m ? m[1] : undefined;
  };
  return {
    bg: get('bg'),
    surface: get('surface'),
    text: get('text'),
    muted: get('muted'),
    accent: get('accent'),
    accent2: get('accent2'),
    accentInk: get('accentInk'),
    mode: get('mode') ?? 'dark',
  };
}

function extractSeo(cleanSrc) {
  const seoMatch = cleanSrc.match(/seo\s*:\s*\{([\s\S]*?)\n\s*\}/);
  if (!seoMatch) return {};
  const block = seoMatch[1];
  const get = (key) => {
    const m = block.match(new RegExp(`\\b${key}\\s*:\\s*\\n?\\s*['"]([^'"]+)['"]`));
    return m ? m[1] : undefined;
  };
  return {
    title: get('title'),
    description: get('description'),
  };
}

export function runValidateConfig({ cwd = process.cwd() } = {}) {
  const configPath = join(resolve(cwd), 'site.config.ts');
  if (!existsSync(configPath)) {
    return {
      ok: false,
      configPath,
      checks: [{ name: 'site.config.ts present', ok: false, severity: 'error', detail: `Not found at ${configPath}` }],
    };
  }

  const raw = readFileSync(configPath, 'utf8');
  const clean = stripComments(raw);
  const checks = [];
  const add = (name, ok, detail = '', severity = 'error') => checks.push({ name, ok, severity, detail });

  // 1. Required blocks
  const requiredKeys = ['url', 'name', 'seo', 'theme', 'contact', 'sections', 'hero', 'services', 'closing', 'footer'];
  const missingKeys = requiredKeys.filter((k) => !new RegExp(`^\\s*${k}\\s*:`, 'm').test(clean));
  add('Required config blocks present', missingKeys.length === 0, missingKeys.length ? `Missing: ${missingKeys.join(', ')}` : '');

  // 2. Concept mode detection
  const isConcept = /^\s*concept\s*:\s*\{/m.test(clean);
  add('Concept mode status', true, isConcept ? 'Concept mode ON (banner + noindex active)' : 'Launch mode (publicly indexable)', 'info');

  // 3. Placeholder scan
  const placeholderHits = [
    [/example\.com/gi, 'example.com'],
    [/\(555\)|555-0\d{3}/g, '555 phone number'],
    [/lorem ipsum/gi, 'lorem ipsum'],
    [/\bTODO\b|\bTBD\b/g, 'TODO/TBD'],
  ].flatMap(([re, label]) => {
    const m = clean.match(re);
    return m ? [`${label} ×${m.length}`] : [];
  });
  add('No placeholder strings in site.config.ts', placeholderHits.length === 0, placeholderHits.join(', '));

  // 4. WCAG 2.1 AA Color Contrast checks
  const theme = extractThemeColors(clean);
  const pairs = [
    { label: 'theme.text on theme.bg', fg: theme.text, bg: theme.bg, min: 4.5 },
    { label: 'theme.muted on theme.bg', fg: theme.muted, bg: theme.bg, min: 4.5 },
    { label: 'theme.muted on theme.surface', fg: theme.muted, bg: theme.surface, min: 4.5 },
    { label: 'theme.accentInk on theme.accent', fg: theme.accentInk, bg: theme.accent, min: 4.5 },
    ...(theme.accent2 ? [{ label: 'theme.accentInk on theme.accent2', fg: theme.accentInk, bg: theme.accent2, min: 4.5 }] : []),
  ];
  for (const p of pairs) {
    const ratio = contrastRatio(p.fg, p.bg);
    if (ratio !== null) {
      add(
        `WCAG contrast: ${p.label}`,
        ratio >= p.min,
        `${ratio}:1 (${p.fg} on ${p.bg}) — minimum ${p.min}:1`,
      );
    }
  }

  // 5. SEO checks
  const seo = extractSeo(clean);
  if (seo.title) {
    const len = seo.title.length;
    add('SEO title length (≤ 65 chars)', len <= 65, `${len} chars ("${seo.title.slice(0, 50)}${len > 50 ? '…' : ''}")`, len <= 65 ? 'info' : 'warning');
  }
  if (seo.description) {
    const len = seo.description.length;
    add('SEO description length (50–170 chars)', len >= 50 && len <= 170, `${len} chars`, len >= 50 && len <= 170 ? 'info' : 'warning');
  }

  const hardFailures = checks.filter((c) => !c.ok && c.severity === 'error');
  return {
    ok: hardFailures.length === 0,
    isConcept,
    theme,
    seo,
    checks,
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : undefined; };
  const cwd = arg('--dir') ?? process.cwd();
  const asJson = process.argv.includes('--json');
  const res = runValidateConfig({ cwd });
  if (asJson) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    for (const c of res.checks) {
      const tag = c.ok ? (c.severity === 'info' ? 'INFO' : 'PASS') : c.severity === 'warning' ? 'WARN' : 'FAIL';
      console.log(`${tag}  ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
    }
  }
  process.exit(res.ok ? 0 : 1);
}
