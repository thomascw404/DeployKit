import type { APIRoute } from 'astro';
import site from '../../site.config';

export const GET: APIRoute = () =>
  new Response(site.concept ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap-index.xml\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
