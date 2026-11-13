---
name: deploykit-deploy
description: Put a DeployKit site in a private GitHub repo and deploy it to Cloudflare Workers from the user's own accounts, with Cloudflare Access protecting previews and concept sites. Use when a site passes QA and needs a URL.
---

# DeployKit deploy

Works with any GitHub + Cloudflare account. Nothing here is tied to a specific user: the Worker name comes from `wrangler.jsonc` (`npm run new` / `deploykit_new_site` sets it to the site slug) and the URL is `https://<name>.<the account's workers.dev subdomain>.workers.dev`.

## 0. Preconditions
- `npm run validate [-- --dir <site-dir>]` and `npm run qa [-- --dir <site-dir>]` (or MCP `deploykit_validate_config` + `deploykit_qa`) pass.
- `npm run doctor [-- --json]` (or MCP `deploykit_doctor`) shows `gh` authenticated. Cloudflare: either a dashboard login (option A) or `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (option B).
- **Real business without sign-off → `concept` set AND Access on before the first deploy** (run step 3 first if Access isn't set up on the account yet).

## 1. GitHub repo (private)
```bash
git init -b main && git add -A && git commit -m "<slug>: initial site (DeployKit)"
gh repo create <owner>/<slug> --private --source . --push
```
No `gh`? Ask the user to create an empty private repo (no README/license/.gitignore) and give you push access, then `git remote add origin … && git push -u origin main`.

## 2. Cloudflare Workers — pick ONE

**A. Workers Builds (dashboard, auto-deploy on push).** The user does this once per repo (it includes a GitHub authorization screen only they can approve):
Workers & Pages → Create → Import a repository → pick the repo → Build command `npm run build:fast` → Deploy command `npx wrangler deploy` → Deploy.
Delete `.github/workflows/deploy.yml` or leave the secrets unset so it no-ops.

**B. GitHub Actions + API token (fully scriptable).**
```bash
gh secret set CLOUDFLARE_API_TOKEN   # user pastes the value into the prompt; never put it in chat or files
gh secret set CLOUDFLARE_ACCOUNT_ID
git commit --allow-empty -m "Deploy" && git push
gh run watch
```
Token: Cloudflare dashboard → My Profile → API Tokens → "Edit Cloudflare Workers" template. The user creates it; you never ask for it in chat.

**C. One-off from the CLI** (token in the environment): `npm run build:fast && npx wrangler deploy`.

## 3. Lock it down (Cloudflare Access)
Once per account, the user enables Zero Trust (one.dash.cloudflare.com → Free plan). Then either:
- Dashboard: Workers & Pages → **Protect all Workers** → All traffic → policy "Cloudflare account" (and/or emails / an email domain), or
- `npm run cf:protect -- --emails partner@agency.com [--domain agency.com]` (or MCP `deploykit_cf_protect`; token needs Access edit permissions; see `FRAMEWORK.md` §7).

Verify while signed out (private window or `curl -sI`): the URL must redirect to a Cloudflare login, not serve the site.

## 4. Verify the deploy
- Build succeeded (dashboard, `gh run watch`, or the Cloudflare API builds endpoint).
- Signed in: page loads, fonts load, `/nope` returns the 404 page.
- Concept: response header `X-Robots-Tag: noindex, nofollow`, `/robots.txt` = `Disallow: /`.

## Rules
- Never ask for passwords, API tokens or 2FA codes in chat; the user enters them into `gh secret set`, `wrangler login`, or the dashboard.
- Never make a real business's concept public. Never point a prospect's real domain at a concept.
- If a build fails: read the build log first. `npm ci` lock errors → `npm install`, commit lock, push.
