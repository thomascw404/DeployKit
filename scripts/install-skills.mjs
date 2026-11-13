#!/usr/bin/env node
// Usage: npm run skills:install -- <claude|hermes|user|antigravity|cursor|all>
// The canonical skills live in .agents/skills/ (Agent Skills format). Codex and other
// AGENTS.md-aware tools read that folder straight from the repo. This copies them where other runtimes look:
//   claude       → ./.claude/skills/                  (Claude Code, this project)
//   cursor       → ./.cursor/skills/                  (Cursor, this project)
//   hermes       → ~/.hermes/skills/deploykit/        (Hermes Agent; run `hermes skills reload` or restart after)
//   antigravity  → ~/.gemini/antigravity-cli/skills/  (Google Antigravity CLI)
//   user         → ~/.agents/skills/                  (user-level, for any repo — Codex, Gemini CLI, Copilot)
//   all          → installs to both `claude` and `user`
// Re-run after pulling DeployKit updates.
import { cpSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function getTargets(cwd = process.cwd()) {
  return {
    claude: resolve(cwd, '.claude/skills'),
    cursor: resolve(cwd, '.cursor/skills'),
    hermes: join(homedir(), '.hermes/skills/deploykit'),
    antigravity: join(homedir(), '.gemini/antigravity-cli/skills'),
    user: join(homedir(), '.agents/skills'),
  };
}

export function runInstallSkills({ which, cwd = process.cwd() } = {}) {
  const targets = getTargets(cwd);
  const src = resolve(cwd, '.agents/skills');
  if (!existsSync(src)) {
    throw new Error('No .agents/skills folder here. Run from the DeployKit (or a client site) root.');
  }
  const keys = which === 'all' ? ['claude', 'user'] : [which];
  if (!keys.every((k) => targets[k])) {
    throw new Error(`Usage: npm run skills:install -- <${[...Object.keys(targets), 'all'].join('|')}>`);
  }
  const skills = readdirSync(src);
  const installedTo = [];
  for (const k of keys) {
    const dest = targets[k];
    mkdirSync(dest, { recursive: true });
    for (const name of skills) {
      cpSync(join(src, name), join(dest, name), { recursive: true });
    }
    installedTo.push(dest);
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
