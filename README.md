# DeployKit

A template, MCP server, and skill suite for fast, accessible marketing sites and spec redesigns. One `site.config.ts` defines a site; scripts and MCP tools handle site teardown, validation, QA, pitch assets, and private deploys to Cloudflare Workers.

Astro 7 + Tailwind v4 · static output · self-hosted fonts · Cloudflare Workers. Agents start at [`AGENTS.md`](AGENTS.md); the playbook is [`FRAMEWORK.md`](FRAMEWORK.md).

## Quick Share / One-Line Install

Clones `DeployKit` to `~/DeployKit`, installs dependencies + Playwright Chromium, installs agent skills (`claude`, `cursor`, `antigravity`, `hermes`, `user`), configures the MCP server (with `.bak` backups), and verifies the setup with `npm run doctor`:

**macOS / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/thomascw404/DeployKit/main/scripts/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/thomascw404/DeployKit/main/scripts/install.ps1 | iex
```

> **Non-interactive / custom flags:** pass `--dir <path>`, `--agents <claude|cursor|antigravity|hermes|user|all>`, `--skip-mcp`, or `--yes` (e.g. `curl -fsSL .../scripts/install.sh | bash -s -- --yes --agents antigravity` or `npm run setup -- --yes`).

## Manual Install

Requires Node 22.23+, Git, and the [GitHub CLI](https://cli.github.com).

```bash
gh repo clone thomascw404/DeployKit && cd DeployKit
npm run setup
```

### Agent Skills & MCP Server

Skills live in `.agents/skills/` (auto-loaded by Codex and AGENTS.md-aware tools). Install them to other runtimes with:

```bash
npm run skills:install -- <claude|hermes|antigravity|cursor|user|all>
```

To expose DeployKit as an MCP server (`stdio`), point your client at `scripts/mcp-server.mjs`:

```json
{
  "mcpServers": {
    "deploykit": {
      "command": "node",
      "args": ["/path/to/DeployKit/scripts/mcp-server.mjs"]
    }
  }
}
```

## Commands

| Command | Does |
|---|---|
| `npm run setup [-- --yes]` | Interactive or automated one-step setup (deps, browser, skills, MCP, doctor) |
| `npm run doctor [-- --json]` | Check environment, browser, `gh`, and Cloudflare readiness |
| `npm run teardown -- <url> [outDir] [--no-crawl]` | Capture a site + key subpages → `.teardown/<host>/` |
| `npm run new -- <slug> [dir] [--link-deps]` | Scaffold a new site (`--link-deps` junctions `node_modules`) |
| `npm run validate [-- --dir <site-dir>]` | Fast pre-build check: config blocks, WCAG contrast, SEO, placeholders |
| `npm run dev` / `npm run build` | Local dev server / type check + static build to `dist/` |
| `npm run qa [-- --lighthouse] [--dir <site-dir>]` | QA gate: lock file, build, placeholders, concept safety, axe A/AA, shots |
| `npm run pitch [-- before.png] [--dir <site-dir>]` | Before/after image, desktop shot, offline `preview.html` → `.pitch/` |
| `npm run single -- [out.html]` | Bundle `dist/` into one self-contained HTML file |
| `npm run sync -- <site-dir>` | Push framework updates into an existing site |
| `npm run cf:protect [-- --emails a@x.com]` | Lock all Workers on the Cloudflare account behind Access |
| `npm run mcp` | Start the DeployKit stdio MCP server |

Deploy options (Workers Builds, GitHub Actions, or Wrangler) are in [`.agents/skills/deploykit-deploy/SKILL.md`](.agents/skills/deploykit-deploy/SKILL.md).
