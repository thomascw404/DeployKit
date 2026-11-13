#!/usr/bin/env node
// Usage: npm run mcp   (or configure in Claude Desktop / Cursor / Antigravity / Hermes MCP settings)
// Zero-dependency Model Context Protocol (MCP) server over stdio (JSON-RPC 2.0).
// Exposes DeployKit's suite of website analysis, validation, scaffolding, QA, pitch, and deploy tools,
// plus live documentation resources and guided workflow prompts.
import { createInterface } from 'node:readline';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runDoctor } from './doctor.mjs';
import { runTeardown } from './teardown.mjs';
import { runValidateConfig } from './validate-config.mjs';
import { runNewSite } from './new-site.mjs';
import { runQa } from './qa.mjs';
import { runPitch } from './pitch.mjs';
import { runSingleFile } from './single-file.mjs';
import { runSync } from './sync-framework.mjs';
import { runInstallSkills } from './install-skills.mjs';
import { runCfProtect } from './cf-protect.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

const TOOLS = [
  {
    name: 'deploykit_doctor',
    description: 'Check environment readiness (Node 22.23+, dependencies, Playwright headless browser, GitHub CLI auth, Cloudflare credentials) and return fix instructions.',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Optional directory path to check (defaults to DeployKit root).' },
      },
    },
  },
  {
    name: 'deploykit_teardown',
    description: 'Run a headless site teardown on a reference or prospect URL. Captures stack/design tokens/sections/a11y/SEO (probe.json), visible copy + automatically crawled key subpages (content.md), and desktop/mobile screenshots.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Target website URL (https://...).' },
        outDir: { type: 'string', description: 'Optional output directory for teardown artifacts.' },
        cwd: { type: 'string', description: 'Optional working directory.' },
        crawl: { type: 'boolean', description: 'Automatically crawl up to maxSubpages key internal pages (about, services, reviews, contact, coupons). Default true.' },
        maxSubpages: { type: 'number', description: 'Maximum internal subpages to crawl (default 4).' },
        includeImages: { type: 'boolean', description: 'Attach mobile.png and desktop.png as base64 MCP image blocks (default true).' },
      },
      required: ['url'],
    },
  },
  {
    name: 'deploykit_validate_config',
    description: 'Fast (<50ms) pre-build validator for site.config.ts. Checks required blocks, WCAG 2.1 AA color contrast ratios, SEO title/description lengths, placeholder strings, and concept mode status.',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Site directory containing site.config.ts (defaults to current working directory).' },
      },
    },
  },
  {
    name: 'deploykit_new_site',
    description: 'Scaffold a new DeployKit site from the starter template with its own package.json and wrangler.jsonc Worker name.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Kebab-case site slug (e.g. "harbor-plumbing").' },
        targetDir: { type: 'string', description: 'Optional destination folder path (defaults to ../<slug>).' },
        linkDeps: { type: 'boolean', description: 'Symlink/junction node_modules from DeployKit root for instant zero-install builds (default true).' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'deploykit_qa',
    description: 'Run the full DeployKit QA gate on a site: lock-file sync, Astro type-check & build, placeholder scan, concept safety verification, axe-core WCAG 2 A/AA audit, and responsive screenshots (390/768/1440).',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Site directory to test (defaults to current working directory).' },
        lighthouse: { type: 'boolean', description: 'Also run Lighthouse mobile audit (default false).' },
        includeImages: { type: 'boolean', description: 'Attach .qa/mobile.png and .qa/desktop.png as MCP image content blocks (default true).' },
      },
    },
  },
  {
    name: 'deploykit_pitch',
    description: 'Generate the prospect pitch package in .pitch/: before-after-mobile.png comparison, concept-desktop.png, and self-contained offline preview.html (inlines fonts and images). Automatically reuses fresh .qa/ screenshots.',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Site directory (defaults to current working directory).' },
        before: { type: 'string', description: 'Optional path to the prospect "before" mobile screenshot (defaults to newest .teardown/*/mobile.png).' },
        includeImages: { type: 'boolean', description: 'Attach before-after-mobile.png and concept-desktop.png as MCP image content blocks (default true).' },
      },
    },
  },
  {
    name: 'deploykit_single_file',
    description: 'Bundle a built dist/ directory into a single self-contained HTML file with fonts and images inlined as base64 data URIs.',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Site directory containing dist/.' },
        out: { type: 'string', description: 'Output file path (default preview.html).' },
      },
    },
  },
  {
    name: 'deploykit_sync',
    description: 'Push framework upgrades (components, layouts, schema, scripts, skills) from DeployKit root into an existing site directory without touching its site.config.ts, fonts.css, public/, or briefs/.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Target site directory containing site.config.ts.' },
      },
      required: ['target'],
    },
  },
  {
    name: 'deploykit_install_skills',
    description: 'Install DeployKit portable Agent Skills (.agents/skills/*) into an agent runtime directory.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['claude', 'hermes', 'antigravity', 'cursor', 'user', 'all'],
          description: 'Runtime target where skills should be installed.',
        },
      },
      required: ['target'],
    },
  },
  {
    name: 'deploykit_cf_protect',
    description: 'Make every Cloudflare Worker on the account private behind Cloudflare Access (idempotent).',
    inputSchema: {
      type: 'object',
      properties: {
        emails: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional email addresses allowed to sign in via One-Time PIN in addition to Cloudflare account members.',
        },
        domain: {
          type: 'string',
          description: 'Optional email domain (e.g. "agency.com") allowed to sign in.',
        },
      },
    },
  },
];

const RESOURCES = [
  { uri: 'deploykit://docs/agents', name: 'AGENTS.md', mimeType: 'text/markdown', path: 'AGENTS.md', description: 'Core DeployKit agent rules, commands, and non-negotiable guardrails.' },
  { uri: 'deploykit://docs/framework', name: 'FRAMEWORK.md', mimeType: 'text/markdown', path: 'FRAMEWORK.md', description: 'Design rules, copy formulas, section library, and QA/launch checklists.' },
  { uri: 'deploykit://schema/types', name: 'src/config/types.ts', mimeType: 'text/typescript', path: 'src/config/types.ts', description: 'TypeScript schema for site.config.ts.' },
  { uri: 'deploykit://templates/brief', name: 'briefs/BRIEF_TEMPLATE.md', mimeType: 'text/markdown', path: 'briefs/BRIEF_TEMPLATE.md', description: 'Sourced redesign brief template.' },
  { uri: 'deploykit://examples/brief', name: 'docs/examples/brief-example.md', mimeType: 'text/markdown', path: 'docs/examples/brief-example.md', description: 'Worked example brief for a local service business.' },
];

const PROMPTS = [
  {
    name: 'redesign-site',
    description: 'End-to-end spec redesign workflow for a prospect website URL.',
    arguments: [
      { name: 'url', description: 'Prospect website URL to analyze and redesign', required: true },
      { name: 'slug', description: 'Kebab-case project slug', required: true },
    ],
  },
  {
    name: 'teardown-site',
    description: 'Analyze an existing or reference website and produce a sourced teardown brief.',
    arguments: [
      { name: 'url', description: 'Website URL to tear down', required: true },
    ],
  },
];

function imageBlockIfExists(filePath, label) {
  if (!filePath || !existsSync(filePath)) return [];
  try {
    const data = readFileSync(filePath).toString('base64');
    return [
      { type: 'text', text: `[Attached image: ${label} (${filePath})]` },
      { type: 'image', data, mimeType: 'image/png' },
    ];
  } catch {
    return [];
  }
}

async function callTool(name, args = {}) {
  // Redirect console.log/warn during tool execution to stderr so stdout remains pure JSON-RPC
  const origLog = console.log;
  const origWarn = console.warn;
  const logs = [];
  console.log = (...a) => logs.push(a.join(' '));
  console.warn = (...a) => logs.push('WARN: ' + a.join(' '));

  try {
    switch (name) {
      case 'deploykit_doctor': {
        const res = await runDoctor({ cwd: args.cwd ?? ROOT });
        return {
          content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
          isError: !res.ok,
        };
      }
      case 'deploykit_teardown': {
        const res = await runTeardown({
          url: args.url,
          outDir: args.outDir,
          cwd: args.cwd ?? ROOT,
          crawl: args.crawl ?? true,
          maxSubpages: args.maxSubpages ?? 4,
        });
        const content = [{ type: 'text', text: JSON.stringify(res, null, 2) }];
        if (args.includeImages !== false && res.outDir) {
          content.push(...imageBlockIfExists(join(res.outDir, 'mobile.png'), 'Teardown Mobile First Screen'));
          content.push(...imageBlockIfExists(join(res.outDir, 'desktop.png'), 'Teardown Desktop First Screen'));
        }
        return { content, isError: !res.ok };
      }
      case 'deploykit_validate_config': {
        const res = runValidateConfig({ cwd: args.cwd ?? ROOT });
        return {
          content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
          isError: !res.ok,
        };
      }
      case 'deploykit_new_site': {
        const res = runNewSite({
          slug: args.slug,
          targetDir: args.targetDir,
          cwd: ROOT,
          linkDeps: args.linkDeps ?? true,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
          isError: !res.ok,
        };
      }
      case 'deploykit_qa': {
        const res = await runQa({
          cwd: args.cwd ?? ROOT,
          lighthouse: !!args.lighthouse,
        });
        const content = [{ type: 'text', text: JSON.stringify(res, null, 2) }];
        if (args.includeImages !== false && res.reportPath) {
          const qaDir = resolve(res.reportPath, '..');
          content.push(...imageBlockIfExists(join(qaDir, 'mobile.png'), 'QA Mobile (390px)'));
          content.push(...imageBlockIfExists(join(qaDir, 'desktop.png'), 'QA Desktop (1440px)'));
        }
        return { content, isError: !res.ok };
      }
      case 'deploykit_pitch': {
        const res = await runPitch({
          cwd: args.cwd ?? ROOT,
          before: args.before,
          reuseQa: true,
        });
        const content = [{ type: 'text', text: JSON.stringify(res, null, 2) }];
        if (args.includeImages !== false && res.outDir) {
          content.push(...imageBlockIfExists(join(res.outDir, 'before-after-mobile.png'), 'Pitch Before vs After Mobile'));
          content.push(...imageBlockIfExists(join(res.outDir, 'concept-desktop.png'), 'Pitch Concept Desktop'));
        }
        return { content, isError: !res.ok };
      }
      case 'deploykit_single_file': {
        const res = runSingleFile({ cwd: args.cwd ?? ROOT, out: args.out });
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }], isError: !res.ok };
      }
      case 'deploykit_sync': {
        const res = runSync({ target: args.target, cwd: ROOT });
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }], isError: !res.ok };
      }
      case 'deploykit_install_skills': {
        const res = runInstallSkills({ which: args.target, cwd: ROOT });
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }], isError: !res.ok };
      }
      case 'deploykit_cf_protect': {
        const res = await runCfProtect({ emails: args.emails ?? [], domain: args.domain });
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }], isError: !res.ok };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ ok: false, error: err.message, logs }, null, 2) }],
      isError: true,
    };
  } finally {
    console.log = origLog;
    console.warn = origWarn;
  }
}

async function handleRequest(msg) {
  const { id, method, params } = msg;
  try {
    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: params?.protocolVersion ?? '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
          serverInfo: {
            name: 'deploykit-mcp',
            version: '1.1.0',
          },
        },
      };
    }
    if (method === 'notifications/initialized' || method === 'initialized') {
      return null;
    }
    if (method === 'ping') {
      return { jsonrpc: '2.0', id, result: {} };
    }
    if (method === 'tools/list') {
      return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
    }
    if (method === 'tools/call') {
      const result = await callTool(params?.name, params?.arguments ?? {});
      return { jsonrpc: '2.0', id, result };
    }
    if (method === 'resources/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          resources: RESOURCES.map(({ uri, name, mimeType, description }) => ({ uri, name, mimeType, description })),
        },
      };
    }
    if (method === 'resources/read') {
      const r = RESOURCES.find((x) => x.uri === params?.uri);
      if (!r) throw new Error(`Resource not found: ${params?.uri}`);
      const text = readFileSync(join(ROOT, r.path), 'utf8');
      return {
        jsonrpc: '2.0',
        id,
        result: {
          contents: [{ uri: r.uri, mimeType: r.mimeType, text }],
        },
      };
    }
    if (method === 'prompts/list') {
      return { jsonrpc: '2.0', id, result: { prompts: PROMPTS } };
    }
    if (method === 'prompts/get') {
      const name = params?.name;
      const args = params?.arguments ?? {};
      if (name === 'redesign-site') {
        const skill = readFileSync(join(ROOT, '.agents/skills/deploykit-redesign/SKILL.md'), 'utf8');
        return {
          jsonrpc: '2.0',
          id,
          result: {
            description: `Redesign ${args.url ?? '<url>'} into ${args.slug ?? '<slug>'}`,
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Redesign ${args.url} as slug "${args.slug}" following the DeployKit Redesign skill:\n\n${skill}`,
                },
              },
            ],
          },
        };
      }
      if (name === 'teardown-site') {
        const skill = readFileSync(join(ROOT, '.agents/skills/site-teardown/SKILL.md'), 'utf8');
        return {
          jsonrpc: '2.0',
          id,
          result: {
            description: `Teardown ${args.url ?? '<url>'}`,
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Run a sourced site teardown on ${args.url} following the Site Teardown skill:\n\n${skill}`,
                },
              },
            ],
          },
        };
      }
      throw new Error(`Unknown prompt: ${name}`);
    }
    if (id !== undefined) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
    }
    return null;
  } catch (err) {
    if (id !== undefined) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: err.message },
      };
    }
    return null;
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const rl = createInterface({ input: process.stdin, terminal: false });
  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const msg = JSON.parse(trimmed);
      const res = await handleRequest(msg);
      if (res) process.stdout.write(JSON.stringify(res) + '\n');
    } catch (e) {
      process.stdout.write(
        JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error: ' + e.message } }) + '\n',
      );
    }
  });
}

export { TOOLS, RESOURCES, PROMPTS, handleRequest, callTool };
