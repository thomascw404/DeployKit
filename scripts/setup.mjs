#!/usr/bin/env node
// Usage: node scripts/setup.mjs [--dir <path>] [--agents <claude|cursor|antigravity|hermes|user|all>] [--skip-mcp] [--yes] [--dry-run]
// Shared cross-platform setup orchestrator bootstrapped by scripts/install.sh and scripts/install.ps1
// (or run directly via `npm run setup`).
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const REPO_URL = 'https://github.com/thomascw404/DeployKit.git';

export function parseArgs(argv = process.argv.slice(2)) {
  const opts = {
    dir: process.env.DEPLOYKIT_DIR || undefined,
    agents: process.env.DEPLOYKIT_AGENTS || undefined,
    skipMcp: process.env.DEPLOYKIT_SKIP_MCP === '1' || process.env.DEPLOYKIT_SKIP_MCP === 'true',
    yes: process.env.DEPLOYKIT_YES === '1' || process.env.DEPLOYKIT_YES === 'true',
    dryRun: false,
    skipDeps: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir' && argv[i + 1]) opts.dir = argv[++i];
    else if (a.startsWith('--dir=')) opts.dir = a.slice(6);
    else if (a === '--agents' && argv[i + 1]) opts.agents = argv[++i];
    else if (a.startsWith('--agents=')) opts.agents = a.slice(9);
    else if (a === '--skip-mcp') opts.skipMcp = true;
    else if (a === '--yes' || a === '-y') opts.yes = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--skip-deps') opts.skipDeps = true;
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

export function getOsInstallHints() {
  const os = platform();
  if (os === 'win32') {
    return {
      git: 'winget install --id Git.Git -e --source winget',
      node: 'winget install --id OpenJS.NodeJS.LTS -e   (or via fnm: winget install Schniz.fnm && fnm install 22)',
      gh: 'winget install --id GitHub.cli -e && gh auth login',
    };
  }
  if (os === 'darwin') {
    return {
      git: 'xcode-select --install   (or: brew install git)',
      node: 'brew install node@22   (or via fnm: brew install fnm && fnm install 22)',
      gh: 'brew install gh && gh auth login',
    };
  }
  return {
    git: 'sudo apt-get update && sudo apt-get install -y git   (or dnf/pacman equivalent)',
    node: 'curl -fsSL https://fnm.vercel.app/install | bash && fnm install 22',
    gh: 'sudo apt-get install -y gh && gh auth login   (see https://cli.github.com)',
  };
}

function checkCmd(bin, args = ['--version']) {
  try {
    return execFileSync(bin, args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

export function verifyPrerequisites() {
  const hints = getOsInstallHints();
  const missing = [];

  const gitVer = checkCmd('git');
  if (!gitVer) {
    missing.push({ name: 'git', reason: 'Git is not installed or not on PATH.', fix: hints.git });
  }

  const [maj, min] = process.versions.node.split('.').map(Number);
  const nodeOk = maj > 22 || (maj === 22 && min >= 23);
  if (!nodeOk) {
    missing.push({
      name: `node (found v${process.versions.node}, requires >= 22.23.0)`,
      reason: 'DeployKit & Astro 7 require Node.js 22.23.0 or newer.',
      fix: hints.node,
    });
  }

  const ghVer = checkCmd('gh');
  if (!ghVer) {
    missing.push({ name: 'gh (GitHub CLI)', reason: 'GitHub CLI is required for creating private repos and deploy secrets.', fix: hints.gh });
  }

  return { ok: missing.length === 0, gitVer, nodeVer: process.versions.node, ghVer, missing };
}

export function getMcpConfigCandidates() {
  const home = homedir();
  const os = platform();
  const appData = process.env.APPDATA || join(home, 'AppData', 'Roaming');

  const claudeDesktopPath =
    os === 'win32'
      ? join(appData, 'Claude', 'claude_desktop_config.json')
      : os === 'darwin'
        ? join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
        : join(home, '.config', 'Claude', 'claude_desktop_config.json');

  return [
    {
      id: 'antigravity-ide',
      label: 'Antigravity IDE (~/.gemini/config/mcp_config.json)',
      path: join(home, '.gemini', 'config', 'mcp_config.json'),
      parentCheck: join(home, '.gemini'),
    },
    {
      id: 'antigravity-cli',
      label: 'Antigravity CLI (~/.gemini/antigravity-cli/mcp.json)',
      path: join(home, '.gemini', 'antigravity-cli', 'mcp.json'),
      parentCheck: join(home, '.gemini', 'antigravity-cli'),
    },
    {
      id: 'cursor',
      label: 'Cursor (~/.cursor/mcp.json)',
      path: join(home, '.cursor', 'mcp.json'),
      parentCheck: join(home, '.cursor'),
    },
    {
      id: 'claude-desktop',
      label: `Claude Desktop (${claudeDesktopPath})`,
      path: claudeDesktopPath,
      parentCheck: dirname(claudeDesktopPath),
    },
    {
      id: 'hermes',
      label: 'Hermes Agent (~/.hermes/mcp.json)',
      path: join(home, '.hermes', 'mcp.json'),
      parentCheck: join(home, '.hermes'),
    },
  ];
}

export function mergeMcpConfigFile(configPath, mcpEntry, { dryRun = false } = {}) {
  let data = {};
  let backedUpTo = null;

  if (existsSync(configPath)) {
    const raw = readFileSync(configPath, 'utf8').trim();
    if (raw) {
      data = JSON.parse(raw);
    }
    backedUpTo = `${configPath}.bak`;
    if (!dryRun) {
      copyFileSync(configPath, backedUpTo);
    }
  } else if (!dryRun) {
    mkdirSync(dirname(configPath), { recursive: true });
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    data = {};
  }
  if (typeof data.mcpServers !== 'object' || data.mcpServers === null || Array.isArray(data.mcpServers)) {
    data.mcpServers = {};
  }
  data.mcpServers.deploykit = mcpEntry;

  if (!dryRun) {
    writeFileSync(configPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  }
  return { ok: true, configPath, backedUpTo };
}

function runStep(cmd, args, cwd, dryRun) {
  if (dryRun) {
    console.log(`  [dry-run] (${cwd}) $ ${cmd} ${args.join(' ')}`);
    return true;
  }
  const isWin = platform() === 'win32';
  const res = isWin
    ? spawnSync([cmd, ...args.map((a) => (/\s/.test(a) ? `"${a}"` : a))].join(' '), { cwd, stdio: 'inherit', shell: true })
    : spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  return res.status === 0;
}

export async function runSetup(rawOpts = {}) {
  const opts = { ...parseArgs([]), ...rawOpts };
  if (opts.help) {
    console.log(`DeployKit One-Command Setup
Usage:
  node scripts/setup.mjs [options]

Options:
  --dir <path>       Target directory (default: current repo or ~/DeployKit)
  --agents <target>  Agent skills to install: claude|cursor|antigravity|hermes|user|all (default: prompt or all)
  --skip-mcp         Print MCP snippet only; do not modify MCP config files
  --yes, -y          Non-interactive mode (accept safe defaults)
  --dry-run          Preview actions without modifying disk or installing browsers
`);
    return { ok: true };
  }

  console.log('\n=== DeployKit Setup ===\n');

  // 1. Verify prerequisites
  const prereq = verifyPrerequisites();
  if (!prereq.ok) {
    console.error('Missing or outdated prerequisites:\n');
    for (const m of prereq.missing) {
      console.error(`  ✗ ${m.name}: ${m.reason}`);
      console.error(`    Fix: ${m.fix}\n`);
    }
    return { ok: false, stage: 'prerequisites', missing: prereq.missing };
  }
  console.log(`✓ Prerequisites verified (Node v${prereq.nodeVer}, ${prereq.gitVer}, ${prereq.ghVer.split('\n')[0]})`);

  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY && !opts.yes);
  const rl = interactive ? createInterface({ input: process.stdin, output: process.stdout }) : null;
  const ask = async (q, def) => {
    if (!rl) return def;
    const ans = (await rl.question(q)).trim();
    return ans || def;
  };

  try {
    // 2. Determine target directory & clone/update if needed
    const scriptRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
    const insideRepo = existsSync(join(scriptRoot, 'package.json')) && existsSync(join(scriptRoot, 'scripts/mcp-server.mjs'));
    let targetDir = opts.dir ? resolve(opts.dir) : insideRepo ? scriptRoot : join(homedir(), 'DeployKit');

    if (!opts.dir && !insideRepo && interactive) {
      const chosen = await ask(`Install directory [${targetDir}]: `, targetDir);
      targetDir = resolve(chosen.replace(/^~(?=$|[\\/])/, homedir()));
    }

    if (existsSync(join(targetDir, '.git'))) {
      console.log(`\n→ Updating existing repository in "${targetDir}"...`);
      runStep('git', ['pull', '--ff-only'], targetDir, opts.dryRun);
    } else if (!existsSync(join(targetDir, 'package.json'))) {
      console.log(`\n→ Cloning DeployKit into "${targetDir}"...`);
      mkdirSync(dirname(targetDir), { recursive: true });
      const ok = runStep('git', ['clone', REPO_URL, targetDir], dirname(targetDir), opts.dryRun);
      if (!ok && !opts.dryRun) throw new Error(`Failed to clone ${REPO_URL} into ${targetDir}`);
    } else {
      console.log(`\n→ Using DeployKit directory "${targetDir}"`);
    }

    // 3. Install npm dependencies & Playwright Chromium
    if (!opts.skipDeps) {
      console.log('\n→ Installing npm dependencies...');
      if (!runStep('npm', ['install'], targetDir, opts.dryRun) && !opts.dryRun) {
        throw new Error('`npm install` failed.');
      }
      console.log('\n→ Installing Playwright Chromium browser...');
      if (!runStep('npx', ['playwright', 'install', 'chromium'], targetDir, opts.dryRun) && !opts.dryRun) {
        throw new Error('`npx playwright install chromium` failed.');
      }
    }

    // 4. Install Agent Skills
    let agentChoice = opts.agents;
    if (!agentChoice) {
      if (interactive) {
        agentChoice = await ask(
          '\nInstall Agent Skills for which runtime? (claude / cursor / antigravity / hermes / user / all) [all]: ',
          'all',
        );
      } else {
        agentChoice = 'all';
      }
    }

    console.log(`\n→ Installing DeployKit skills (${agentChoice})...`);
    let installedSkills = [];
    if (opts.dryRun) {
      console.log(`  [dry-run] npm run skills:install -- ${agentChoice}`);
    } else {
      const { runInstallSkills } = await import(new URL('./install-skills.mjs', `file://${targetDir.replace(/\\/g, '/')}/scripts/`).href);
      const skillRes = runInstallSkills({ which: agentChoice, cwd: targetDir });
      installedSkills = skillRes.installedTo;
      for (const dest of installedSkills) {
        console.log(`  ✓ Installed skills (${skillRes.skills.join(', ')}) → ${dest}`);
      }
    }

    // 5. Configure MCP Server
    const mcpServerPath = resolve(targetDir, 'scripts', 'mcp-server.mjs').replace(/\\/g, '/');
    const mcpEntry = {
      command: 'node',
      args: [mcpServerPath],
    };
    const snippet = JSON.stringify({ mcpServers: { deploykit: mcpEntry } }, null, 2);

    console.log('\n→ DeployKit MCP Server Configuration Snippet:');
    console.log('────────────────────────────────────────────────────────');
    console.log(snippet);
    console.log('────────────────────────────────────────────────────────');

    const updatedMcpConfigs = [];
    if (!opts.skipMcp) {
      const candidates = getMcpConfigCandidates();
      const detected = candidates.filter((c) => existsSync(c.path) || existsSync(c.parentCheck));
      if (detected.length > 0) {
        console.log('\nDetected agent config locations:');
        for (const c of detected) {
          console.log(`  • ${c.label}`);
        }
        const confirmMcp = interactive
          ? (await ask('\nMerge `mcpServers.deploykit` into detected configs (creates .bak backups first)? (Y/n) [Y]: ', 'Y')).toLowerCase()
          : 'y';
        if (confirmMcp.startsWith('y')) {
          for (const c of detected) {
            try {
              const res = mergeMcpConfigFile(c.path, mcpEntry, { dryRun: opts.dryRun });
              updatedMcpConfigs.push(res.configPath);
              console.log(
                `  ✓ ${opts.dryRun ? '[dry-run] Would update' : 'Updated'} ${c.path}${res.backedUpTo ? ` (backup: ${res.backedUpTo})` : ''}`,
              );
            } catch (err) {
              console.warn(`  ! Skipped ${c.path}: ${err.message}`);
            }
          }
        }
      }
    }

    // 6. Verify with Doctor
    console.log('\n→ Running `npm run doctor` verification...');
    let doctorOk = true;
    if (!opts.dryRun) {
      const { runDoctor } = await import(new URL('./doctor.mjs', `file://${targetDir.replace(/\\/g, '/')}/scripts/`).href);
      const doc = await runDoctor({ cwd: targetDir });
      doctorOk = doc.ok;
      const width = Math.max(...doc.checks.map((r) => r.name.length));
      for (const r of doc.checks) {
        console.log(`  ${r.ok ? 'OK  ' : 'MISS'}  ${r.name.padEnd(width)}  ${r.ok ? '' : '→ ' + r.fix}`);
      }
    } else {
      console.log('  [dry-run] npm run doctor');
    }

    // 7. Summary & First Prompt
    console.log('\n========================================================');
    console.log('🎉 DeployKit is ready!');
    console.log('========================================================');
    console.log(`  Location   : ${targetDir}`);
    console.log(`  MCP Server : ${mcpServerPath}`);
    if (installedSkills.length) {
      console.log(`  Skills     : Installed to ${installedSkills.length} runtime path(s)`);
    }
    if (updatedMcpConfigs.length) {
      console.log(`  MCP Config : Registered in ${updatedMcpConfigs.length} config file(s)`);
    }
    console.log('\nTry giving your AI agent this first prompt:');
    console.log('  "Use the deploykit-redesign skill (or deploykit MCP tools) to tear down');
    console.log('   https://example.com, write a sourced brief, scaffold a concept redesign,');
    console.log('   pass QA, and generate a before/after pitch package."');
    console.log('========================================================\n');

    return {
      ok: doctorOk,
      targetDir,
      mcpServerPath,
      installedSkills,
      updatedMcpConfigs,
    };
  } finally {
    if (rl) rl.close();
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  runSetup(parseArgs())
    .then((res) => process.exit(res.ok ? 0 : 1))
    .catch((err) => {
      console.error('\nSetup failed:', err.message);
      process.exit(1);
    });
}
