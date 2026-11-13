import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import site from './site.config';

// Concept builds: send X-Robots-Tag noindex on every URL (Cloudflare Workers static assets / Pages read dist/_headers).
const conceptHeaders = {
  name: 'deploykit-concept-headers',
  hooks: {
    'astro:build:done': ({ dir }: { dir: URL }) => {
      if (site.concept) writeFileSync(fileURLToPath(new URL('_headers', dir)), '/*\n  X-Robots-Tag: noindex, nofollow\n');
    },
  },
};

export default defineConfig({
  site: site.url,
  integrations: [sitemap(), conceptHeaders],
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
});
