# DeployKit

A template and framework for fast, accessible marketing sites, built to be driven by coding agents. One config file defines a site. Scripts handle site teardown, QA, pitch assets, and deploys to Cloudflare Workers from your own GitHub and Cloudflare accounts.

Astro + Tailwind v4 · static output · self-hosted fonts · Cloudflare Workers. Agents start at [`AGENTS.md`](AGENTS.md); the playbook is [`FRAMEWORK.md`](FRAMEWORK.md).

## Install

Requires Node 22.23+, Git and the [GitHub CLI](https://cli.github.com).

```bash
gh repo clone <owner>/deploykit && cd deploykit
npm install
npx playwright install chromium
npm run doctor
```

Agent skills are in `.agents/skills/`. Codex reads them from the repo as-is. For other runtimes:

```bash
npm run skills:install -- claude   # ./.claude/skills (Claude Code)
npm run skills:install -- hermes   # ~/.hermes/skills/deploykit (Hermes Agent)
npm run skills:install -- user     # ~/.agents/skills (any repo)
```

Optional, once per Cloudflare account: enable Zero Trust (Free plan), then `npm run cf:protect` so every Worker preview requires sign-in.

## Commands

| Command | Does |
|---|---|
| `npm run doctor` | Check the environment and print a fix for anything missing |
| `npm run new -- <slug> [dir]` | Create a new site from this template (default `../<slug>`) |
| `npm run dev` | Local dev server |
| `npm run build` | Type check + static build to `dist/` |
| `npm run teardown -- <url>` | Capture an existing site → `.teardown/<host>/` |
| `npm run qa [-- --lighthouse]` | QA gate: lock file, build, placeholders, concept safety, accessibility, screenshots |
| `npm run pitch [-- before.png]` | Before/after image, desktop shot, single-file preview → `.pitch/` |
| `npm run single -- out.html` | One self-contained HTML file of the built site |
| `npm run sync -- <site-dir>` | Push template updates into an existing site |
| `npm run cf:protect [-- --emails a@x.com]` | Put every Worker on the Cloudflare account behind Access |
| `npm run skills:install -- <runtime>` | Copy agent skills to a runtime's skill folder |

Deploy options (Workers Builds, GitHub Actions, or wrangler) are in `.agents/skills/deploykit-deploy/SKILL.md`.
