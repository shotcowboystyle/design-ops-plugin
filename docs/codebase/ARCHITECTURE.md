# Architecture

## Core Sections (Required)

### 1) Architectural Style

- Primary style: **prompt-corpus plugin with a file-based shared memory**. A router skill picks a pipeline. Commands do the work and talk to each other only through JSON files in the user's `.design-ops/` directory. Agents are role-scoped subprocesses for reference sourcing and grading.
- Why this classification: there is no executable app. Behavior is defined in Markdown (`skills/`, `commands/`, `agents/`). Composition is mediated by the `.design-ops/` contract (`skills/design-memory/SKILL.md`), not by code calls.
- Primary constraints:
  1. Context budget. A `SKILL.md` loads in full on trigger and references load on demand, hence the 150-line budget (`scripts/validate-plugin.py` `check_skill_size`) and the orchestrator's "stages vs depth" split (`design-ops-orchestrator` skill, "Two bands").
  2. Commands must not clobber each other's state. Single-owner subtrees and read-modify-write merges (`skills/design-memory/SKILL.md` "Ownership", "Merge rules").
  3. References must be real, never recalled from memory (`agents/scout.md` description: "Never recalls references from memory").

### 2) System Flow

```text
user request / slash command
  -> /start or design-ops-orchestrator skill (pick pipeline + stage)
  -> command (e.g. /brief, /style, /inspo, /page) loads its skills + references
  -> reads .design-ops/*.json in read order; agents/scripts fetch external evidence
  -> writes owned subtree of .design-ops/ (+ decisions.log) and emits code/docs
  -> critic agent grades output against .design-ops/refs/board.json
```

1. `/start` (`commands/start.md`) or the orchestrator skill classifies the request into one of 12 pipelines (Evaluate, Fix, Create, Implement, Compose, Generate, Systematize, Handoff, Convert, Localize, AI Surface, Measure). See the `design-ops-orchestrator` skill, "Pipelines".
2. Each command loads the domain skills it needs. Depth references are pulled only inside a stage.
3. Commands read memory in a fixed order: `brief.json` → `map.json` → `refs/board.json` → `style.json` → `vision.json` → `wireframe-*.json` → `decisions.log` (`skills/design-memory/SKILL.md` "Read order").
4. The reference loop: `/inspo` → `scout` agent (`scripts/awwwards.mjs`, Mobbin MCP) → `scripts/capture.mjs` (screenshots + `dna.json`) → `art-director` agent writes `refs/board.md|json` → `/style` turns it into tokens (`commands/inspo.md` steps 0-5, `agents/art-director.md`).
5. The grading loop: the `critic` agent re-captures the build with the same `capture.mjs`, diffs DNA against `board.json` and routes fixes to the art-director or builder (`agents/critic.md`).

### 3) Layer/Module Responsibilities

| Layer or module | Owns | Must not own | Evidence |
|-----------------|------|--------------|----------|
| Orchestrator skill | Pipeline selection, stage gates, handoff artifacts | Domain content | `.agent/skills/design-ops-orchestrator/SKILL.md` |
| Domain skills (44) | Knowledge and procedures per design domain | Cross-session state | `skills/*/SKILL.md` |
| Commands (38) | User workflows, file I/O to `.design-ops/` within their owned subtree | Other commands' subtrees (read-only) | `skills/design-memory/SKILL.md` "Ownership" |
| Agents (4) | Scout: source references. Art-director: direction/board. UX-architect: flows (`refs/mobbin.json`). Critic: grade | Building UI | `agents/*.md` |
| Scripts | Deterministic capture/scrape and corpus validation | Prompt logic | `scripts/` |
| `.design-ops/` (user project) | Persistent design decisions | — | `skills/design-memory/SKILL.md` |

### 4) Reused Patterns

| Pattern | Where found | Why it exists |
|---------|-------------|---------------|
| Router / pipeline with stage gates | `design-ops-orchestrator` skill | Running skills out of order wastes work |
| Shared-file blackboard with single-writer subtrees | `skills/design-memory/SKILL.md` | Keeps 4 writers of `style.json` from clobbering each other |
| Append-only NDJSON decision log | `.design-ops/decisions.log` | Last-wins overrides with a reason |
| Progressive disclosure (SKILL.md → references/) | every skill | Context budget |
| Adapter per reference source | `skills/reference-intelligence/references/{awwwards,mobbin,motionsites}-adapter.md` | Uniform board input from heterogeneous sources |
| Ratchet baseline for debt | `scripts/check-corpus.py` (`tests/baseline.json`) | Freeze existing debt and forbid new debt |

### 5) Known Architectural Risks

- **Generated-layer deletion.** `scripts/build.py` deletes any `skills/`, `commands/` or `agents/` entry that is not in `.agent/manifest.json` (`stale_paths`). Add new components to the manifest *before* building, or they vanish. Git history makes this recoverable now.
- **The memory contract is enforced only by prose.** No schema validator ships for `.design-ops/*.json`, so drift is possible between the 72 mentions of `style.json` across commands.
- **The reference loop depends on scraping** (Awwwards HTML regexes, live-site capture). A markup change stops `awwwards.mjs` with a "No sites found" error rather than failing silently.

### 6) Evidence

- `.agent/skills/design-ops-orchestrator/SKILL.md`, `.agent/skills/design-memory/SKILL.md`
- `commands/start.md`, `commands/inspo.md`
- `agents/scout.md`, `agents/art-director.md`, `agents/critic.md`, `agents/ux-architect.md`
- `scripts/build.py`, `scripts/capture.mjs`, `scripts/awwwards.mjs`
