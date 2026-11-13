// Optional Worker entry: serves the static site and handles POST /api/contact (email via Resend).
// Enable it by adding to wrangler.jsonc:
//   "main": "worker/index.ts",
//   "assets": { "directory": "./dist", "binding": "ASSETS", "not_found_handling": "404-page", "run_worker_first": ["/api/*"] }
// then set contact.formEndpoint = '/api/contact' in site.config.ts and add secrets:
//   npx wrangler secret put RESEND_API_KEY   (CONTACT_TO / CONTACT_FROM as vars or secrets)
interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  RESEND_API_KEY: string;
  CONTACT_TO: string;
  CONTACT_FROM: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
      return contact(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function contact(request: Request, env: Env): Promise<Response> {
  const form = await request.formData();
  if (form.get('company_website')) return new Response(null, { status: 204 }); // honeypot
  const entries = [...form.entries()]
    .filter(([k]) => k !== 'company_website')
    .map(([k, v]) => [k, String(v).slice(0, 5000)] as const);
  const get = (k: string) => entries.find(([key]) => key === k)?.[1] ?? '';
  const name = get('name').slice(0, 200);
  const email = get('email').slice(0, 200);
  if (!name || (email && !/^\S+@\S+\.\S+$/.test(email)) || !(email || get('phone'))) {
    return Response.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: env.CONTACT_TO,
      ...(email && { reply_to: email }),
      subject: `New website request from ${name}`,
      text: entries.map(([k, v]) => `${k}: ${v}`).join('\n'),
    }),
  });
  return Response.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
}
