# Technology Stack

> Snapshot: 2026-10-02, the initial commit of `shotcowboystyle/design-ops-plugin`.
> Design Ops is a private customization of Sumi 4.2.0 (Phazur Labs LLC, Apache-2.0).

## Core Sections (Required)

### 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Product type | Claude Code plugin. Markdown prompts (skills, commands, agents) plus helper scripts | `.claude-plugin/plugin.json` |
| Source of truth | `.agent/` (runtime-neutral). The Claude layer is generated from it | `scripts/build.py` docstring |
| Script languages | Python 3 (build, validate, corpus checks) and Node.js ESM (capture, scrape) | `scripts/*.py`, `scripts/*.mjs` |
| Python version | Not pinned. Needs 3.10+ (`int \| None` syntax, `Path.is_relative_to`) | `scripts/check-corpus.py`, `scripts/build.py` |
| Node version | Not pinned. Needs 18+ (global `fetch`, ESM) | `scripts/awwwards.mjs` |
| Package manager | None. No `package.json` or `requirements.txt` | repo root |

### 2) Production Frameworks and Dependencies

No package-managed dependencies. These are optional and resolved at runtime:

| Dependency | Version | Role in system | Evidence |
|------------|---------|----------------|----------|
| Claude Code plugin runtime | n/a | Loads `skills/`, `commands/`, `agents/` | `.claude-plugin/plugin.json` |
| `puppeteer-core` | unpinned, not bundled | Live-site screenshots and design DNA | `scripts/capture.mjs` `loadPuppeteer` |
| Chrome / Chromium / Edge / Brave | any | Browser for capture. Found in the puppeteer cache or standard macOS/Linux paths | `scripts/capture.mjs` `findChrome` |
| PyYAML | optional | Stricter frontmatter checks in the validator | `scripts/validate-plugin.py` |
| MCP servers (Mobbin, Figma, Stitch, Fal) | external | See INTEGRATIONS.md | `agents/scout.md`, `commands/generate.md` |

### 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| `scripts/build.py` | Generates `AGENTS.md`, `skills/`, `commands/`, `agents/`, `plugin.json` and the README block from `.agent/` | file |
| `scripts/validate-plugin.py` | Release gate: manifest, frontmatter, kebab names, counts | file |
| `scripts/check-corpus.py` + `design_ops_corpus.py` | Ratchet: reference graph, section shape, routing fixtures, token budgets against `tests/` | file |
| `scripts/extract-claims.py` | Worklist of numeric claims that need a primary source | file |
| `claude plugin validate .` | Authoritative manifest check | CLI |

### 4) Key Commands

```bash
python3 scripts/build.py                # regenerate after editing .agent/
python3 scripts/build.py --check        # drift gate
python3 scripts/validate-plugin.py      # release gate
python3 scripts/check-corpus.py all     # ratchet (add --update-baseline to accept growth)
claude plugin validate .
node scripts/awwwards.mjs sotd --limit 10 --out .design-ops/refs/awwwards.json
node scripts/capture.mjs <url> [--out .design-ops/refs]
```

All five gates passed at the snapshot.

### 5) Environment and Config

- Config sources: `.agent/manifest.json`, which generates `.claude-plugin/plugin.json`.
- Env vars read by code: `CLAUDE_PLUGIN_ROOT` (agents and commands use it to locate scripts), `DESIGN_OPS_PUPPETEER_DIR`, `DESIGN_OPS_CHROME`.
- Env vars named in skill prose for third-party MCP setups (never read by the plugin): `FAL_KEY`, `STITCH_API_KEY`, `RECRAFT_API_KEY`.

### 6) Evidence

- `.agent/manifest.json`, `.claude-plugin/plugin.json`
- `scripts/build.py`, `scripts/validate-plugin.py`, `scripts/check-corpus.py`, `scripts/capture.mjs`, `scripts/awwwards.mjs`
- Terminal: all gates green. `capture.mjs` against example.com wrote 2 screenshots + `dna.json`. `awwwards.mjs sotd --limit 2` returned 2 sites.
