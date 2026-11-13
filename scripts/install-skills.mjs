#!/usr/bin/env node
// Usage: npm run skills:install -- <claude|cursor|hermes|antigravity|user|all>
// The canonical skills live in .agents/skills/ (Agent Skills format). Codex and other
// AGENTS.md-aware tools read that folder straight from the repo. This copies them where other runtimes look:
//   claude       → ./.claude/skills/                  (Claude Code, this project)
//   cursor       → ./.cursor/skills/                  (Cursor, this project)
//   hermes       → ~/.hermes/skills/deploykit/        (Hermes Agent; run `hermes skills reload` or restart after)
//   antigravity  → ~/.gemini/antigravity-cli/skills/  (Google Antigravity CLI)
//                  ~/.gemini/config/skills/           (Google Antigravity IDE / desktop)
//   user         → ~/.agents/skills/                  (user-level, for any repo — Codex, Gemini CLI, Copilot)
//   all          → installs to claude, cursor, antigravity, hermes, and user
// Re-run after pulling DeployKit updates.
import { cpSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function getTargets(cwd = process.cwd()) {
  const home = homedir();
  return {
    claude: [resolve(cwd, '.claude/skills')],
    cursor: [resolve(cwd, '.cursor/skills')],
    hermes: [join(home, '.hermes/skills/deploykit')],
    antigravity: [
      join(home, '.gemini/antigravity-cli/skills'),
      join(home, '.gemini/config/skills'),
    ],
    user: [join(home, '.agents/skills')],
  };
}

export function runInstallSkills({ which, cwd = process.cwd() } = {}) {
  const targets = getTargets(cwd);
  const src = resolve(cwd, '.agents/skills');
  if (!existsSync(src)) {
    throw new Error('No .agents/skills folder here. Run from the DeployKit (or a client site) root.');
  }
  const requested = String(which ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!requested.length) {
    throw new Error(`Usage: npm run skills:install -- <${[...Object.keys(targets), 'all'].join('|')}>`);
  }

  const keys = requested.includes('all') ? Object.keys(targets) : requested;
  if (!keys.every((k) => targets[k])) {
    throw new Error(`Usage: npm run skills:install -- <${[...Object.keys(targets), 'all'].join('|')}>`);
  }

  const skills = readdirSync(src);
  const installedTo = [];
  for (const k of keys) {
    const destList = Array.isArray(targets[k]) ? targets[k] : [targets[k]];
    for (const dest of destList) {
      mkdirSync(dest, { recursive: true });
      for (const name of skills) {
        cpSync(join(src, name), join(dest, name), { recursive: true });
      }
      installedTo.push(dest);
    }
  }
  return { ok: true, skills, installedTo };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const res = runInstallSkills({ which: process.argv[2] });
    for (const dest of res.installedTo) {
      console.log(`Installed ${res.skills.join(', ')} → ${dest}`);
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
