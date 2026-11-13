#!/usr/bin/env node
// Usage: npm run skills:install -- <claude|hermes|user>
// The canonical skills live in .agents/skills/ (Agent Skills format). Codex and other
// AGENTS.md-aware tools read that folder straight from the repo. This copies them where other runtimes look:
//   claude  → ./.claude/skills/            (Claude Code, this project)
//   hermes  → ~/.hermes/skills/deploykit/    (Hermes Agent; run `hermes skills reload` or restart after)
//   user    → ~/.agents/skills/            (user-level, for any repo — Codex, Gemini CLI, Copilot)
// Re-run after pulling DeployKit updates.
import { cpSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const targets = {
  claude: resolve('.claude/skills'),
  hermes: join(homedir(), '.hermes/skills/deploykit'),
  user: join(homedir(), '.agents/skills'),
};
const which = process.argv[2];
if (!targets[which]) {
  console.error(`Usage: npm run skills:install -- <${Object.keys(targets).join('|')}>`);
  process.exit(1);
}
const src = resolve('.agents/skills');
if (!existsSync(src)) { console.error('No .agents/skills folder here. Run from the DeployKit (or a client site) root.'); process.exit(1); }
mkdirSync(targets[which], { recursive: true });
for (const name of readdirSync(src)) cpSync(join(src, name), join(targets[which], name), { recursive: true });
console.log(`Installed ${readdirSync(src).join(', ')} → ${targets[which]}`);
