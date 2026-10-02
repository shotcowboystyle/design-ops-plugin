# Codebase Structure

## Core Sections (Required)

### 1) Top-Level Map

| Path | Purpose | Evidence |
|------|---------|----------|
| `.agent/agent.md` | Agent definition: purpose, owned areas, non-negotiable constraints. **Hand-edited** | file |
| `.agent/manifest.json` | Plugin metadata plus per-skill (`summary`, `tools`), per-command (`description`, `argumentHint`) and per-agent (`description`, `tools`) metadata. **Hand-edited** | file |
| `.agent/skills/<name>/` | 46 packaged skills: `SKILL.md` body (no frontmatter) + `references/`. **Hand-edited** | dir |
| `.agent/commands/<name>.md` | 39 command bodies. **Hand-edited** | dir |
| `.agent/agents/<name>.md` | 4 subagent bodies (scout, art-director, ux-architect, critic). **Hand-edited** | dir |
| `skills/`, `commands/`, `agents/` | **Generated** Claude layer (195 reference files mirrored) | `build.py` `render`, `sync_resources` |
| `.claude-plugin/plugin.json` | **Generated** manifest with explicit component arrays | `build.py` `plugin_json` |
| `AGENTS.md` | **Generated**, runtime-neutral, about 1.5 MB (agent.md + every skill, command and agent body) | `build.py` `agents_md` |
| `README.md` | Hand-edited, except the block between the `GENERATED: components` markers | `README.md` |
| `scripts/` | Build, validate, corpus checks, capture and scrape | dir |
| `tests/` | Ratchet fixtures: `baseline.json`, `routing-fixtures.yaml`, `retired-commands.txt`, `schema-waivers.txt`, `slash-token-allowlist.txt` | `check-corpus.py` |
| `LICENSE`, `NOTICE` | Apache-2.0, with Sumi attribution and a list of modifications | files |
| `docs/codebase/` | These docs | — |

### 2) Entry Points

- Plugin load: Claude Code reads `.claude-plugin/plugin.json`, which lists every command, skill and agent.
- User entry commands: `/design-ops:start` (router) and `/design-ops:design-ops` (command map).
- Model entry skill: `design-ops-orchestrator` picks the pipeline.
- Scripts: see STACK.md. Agents locate them through `CLAUDE_PLUGIN_ROOT` (`.agent/agents/critic.md`).

### 3) Module Boundaries

| Boundary | What belongs here | What must not be here |
|----------|-------------------|------------------------|
| `.agent/` | Every content edit | Claude-specific frontmatter. That lives in the manifest |
| Generated layer | Output of `build.py` only | Hand edits. `build.py` overwrites them, and **deletes** skills, commands and agents that have no manifest entry |
| `SKILL.md` body | Routing and a compact procedure (150-line budget, 29 over) | Bulk tables. Those go in `references/` |
| `.design-ops/` (in the user's project) | Design memory | — (contract in `design-memory`) |

### 4) Naming and Organization Rules

- Kebab-case dirs and files. A skill's `name` equals its directory (enforced by `validate-plugin.py`).
- Command names come from filenames. Generated command frontmatter has no `name` field.
- One skill per design domain.
- Python sibling import through `sys.path` (`check-corpus.py` → `design_ops_corpus.py`).

### 5) Evidence

- `.agent/manifest.json`, `scripts/build.py`, `README.md`
- `scripts/check-corpus.py`, `tests/`
