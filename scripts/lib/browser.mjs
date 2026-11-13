// Shared helpers for DeployKit scripts: launch a headless browser, serve dist/.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const CANDIDATES = [
  process.env.DEPLOYKIT_CHROME,
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);

/** Playwright's own Chromium if installed (`npx playwright install chromium`), else a system Chrome. */
export async function launch() {
  try {
    return await chromium.launch();
  } catch (first) {
    for (const p of CANDIDATES) {
      if (existsSync(p)) return chromium.launch({ executablePath: p });
    }
    throw new Error(
      'No browser found. Run `npx playwright install chromium` or set DEPLOYKIT_CHROME to a Chrome/Chromium executable.\n' + first.message,
    );
  }
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.xml': 'application/xml', '.txt': 'text/plain', '.ico': 'image/x-icon',
};

/** Minimal static server for dist/ (mirrors Workers static assets: /x → /x/index.html, 404 → 404.html). */
export async function serve(dir = 'dist', port = 0) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    let file = join(dir, p);
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    } catch {
      if (!extname(file)) file = `${file}.html`;
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      const nf = join(dir, '404.html');
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(existsSync(nf) ? await readFile(nf) : 'Not found');
    }
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  const { port: actual } = server.address();
  return { url: `http://127.0.0.1:${actual}`, close: () => new Promise((r) => server.close(r)) };
}

export const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'tablet', width: 768, height: 1024, deviceScaleFactor: 1 },
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
];
