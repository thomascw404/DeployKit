#!/usr/bin/env node
// Usage: npm run cf:protect [-- --emails a@x.com,b@y.com] [--domain example.com]
// Makes every Worker on the Cloudflare account private by default with Cloudflare Access:
// members of the Cloudflare account can sign in, plus any --emails / --domain you list.
// Idempotent: re-running updates the same policy and app.
// Needs: CLOUDFLARE_API_TOKEN (Access: Apps and Policies Edit, Access: Organizations Read) and
// CLOUDFLARE_ACCOUNT_ID. Zero Trust must be enabled once in the dashboard (one.dash.cloudflare.com, Free plan).
const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!token || !account) {
  console.error('Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID first.');
  process.exit(1);
}
const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : undefined; };
const emails = (arg('--emails') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const domain = arg('--domain');

const api = async (method, path, body) => {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success) {
    const msg = json.errors?.map((e) => e.message).join('; ') ?? res.status;
    if (/not_enabled|not enabled/i.test(msg)) {
      console.error('Zero Trust is not enabled on this account. Enable it once at https://one.dash.cloudflare.com (Free plan), then re-run.');
      process.exit(1);
    }
    throw new Error(`${method} ${path}: ${msg}`);
  }
  return json.result;
};

await api('GET', '/access/organizations');
let idps = await api('GET', '/access/identity_providers');
let cf = idps.find((i) => i.type === 'cloudflare');
if (!cf) cf = await api('POST', '/access/identity_providers', { name: 'Cloudflare', type: 'cloudflare', config: {} });
const extraIdps = idps.filter((i) => i.type === 'onetimepin').map((i) => i.id);
if ((emails.length || domain) && !extraIdps.length) {
  const otp = await api('POST', '/access/identity_providers', { name: 'One-time PIN', type: 'onetimepin', config: {} });
  extraIdps.push(otp.id);
}

const include = [{ cloudflare_account_member: { account_id: account } }];
for (const e of emails) include.push({ email: { email: e } });
if (domain) include.push({ email_domain: { domain } });

const POLICY = 'DeployKit: Workers access';
const policies = await api('GET', '/access/policies');
const existingPolicy = policies.find((p) => p.name === POLICY);
const policyBody = { name: POLICY, decision: 'allow', include, session_duration: '24h' };
const policy = existingPolicy
  ? await api('PUT', `/access/policies/${existingPolicy.id}`, policyBody)
  : await api('POST', '/access/policies', policyBody);

const APP = 'DeployKit: all Workers private by default';
const apps = await api('GET', '/access/apps');
const existingApp = apps.find((a) => a.destinations?.some((d) => d.type === 'all_workers'));
const appBody = {
  type: 'self_hosted', name: existingApp?.name ?? APP, destinations: [{ type: 'all_workers' }],
  allowed_idps: [cf.id, ...extraIdps], auto_redirect_to_identity: !(emails.length || domain),
  session_duration: '24h', policies: [{ id: policy.id, precedence: 1 }],
};
const app = existingApp ? await api('PUT', `/access/apps/${existingApp.id}`, appBody) : await api('POST', '/access/apps', appBody);

console.log(`Access on: every Worker in account ${account} now requires sign-in.`);
console.log(`Allowed: Cloudflare account members${emails.length ? `, ${emails.join(', ')}` : ''}${domain ? `, anyone @${domain}` : ''}.`);
console.log(`App ${app.id} · policy ${policy.id}. Make one Worker public later with a Worker-level bypass (FRAMEWORK.md §7).`);
