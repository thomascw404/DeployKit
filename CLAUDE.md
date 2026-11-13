# Claude

Follow `AGENTS.md` — it is the source of truth for this repo, and its rules apply to you in full.

Skills live in `.agents/skills/` (Agent Skills format). Read the relevant `SKILL.md` before starting a task, or run `npm run skills:install -- claude` once so Claude Code loads them automatically from `.claude/skills/`.

Claude-specific notes:
- Design-only work (look and feel, copy, a mockup to react to) can be done in Claude's design tools first; bring the decisions back as `site.config.ts` values (colors, fonts, copy, section order) so the build stays reproducible.
- If you have a browser tool, prefer it over `npm run teardown` for sites that block headless browsers.
