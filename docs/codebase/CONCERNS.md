# Codebase Concerns

> Updated 2026-10-02 after the restructure. Resolved items are listed at the end for traceability.

## Core Sections (Required)

### 1) Top Risks (Prioritized)

| Severity | Concern | Evidence | Impact | Suggested action |
|----------|---------|----------|--------|------------------|
| med | `build.py` deletes generated skills, commands and agents that have no manifest entry | `scripts/build.py` `stale_paths` | A component added only to the generated layer, or forgotten in the manifest, disappears on the next build | Always add to `.agent/manifest.json` first. Commit before building |
| low | `build.py` is copied by hand into each plugin repo, with no single upstream | identical copies in the `*-ops-plugin` repos | A fix made in one copy can miss the others | Change it in one plugin, copy it to the rest, run `build.py --check` in each |
| low | 29 of 45 `SKILL.md` over the 150-line budget (worst: `platform-visual-standards` 852) | `validate-plugin.py` warning | Context cost on every trigger | Move bulk into `references/` during customization |
| low | `AGENTS.md` is about 1.5 MB | `build.py` `agents_md` inlines every skill and command body | Heavy for runtimes that load it whole | Accept (sibling pattern), or inline summaries only |
| low | Routing fixtures 22/24 | `check-corpus.py` warnings | Two prompts route to the wrong skill | Tune descriptions for `animation-recipe-library` and `desktop-app-design` |

### 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|-----------|---------------|-------|-----------------|---------------|
| Upstream content not yet tailored to the user's workflows | Fresh fork | `.agent/` | Generic output | Planned follow-up session |
| Unverified statistics (84 claims) | Inherited corpus | `extract-claims.py` output | Wrong numbers quoted as fact | Source or soften while customizing |
| No script unit tests | Inherited | `scripts/` | Regressions in capture or scrape | Add a smoke test if the scripts change |
| Validator count check skips `SKILL.md` and command bodies | Upstream scope | `validate-plugin.py` `check_counts` | Hardcoded "45 skills / 38 commands" in prose can drift again | Widen the targets if counts keep drifting |

### 3) Security Concerns

| Risk | OWASP category | Evidence | Current mitigation | Gap |
|------|----------------|----------|--------------------|-----|
| Headless browser loads arbitrary URLs | N/A | `scripts/capture.mjs` | User-initiated only | No URL allowlist. Local/intranet URLs could be captured |
| Scraped site content flows into agent context | LLM01 prompt injection | `.agent/agents/scout.md`, `critic.md` | Agents work from measured DNA and screenshots | No explicit "treat as data" instruction `[TODO verify]` |
| Agents granted `Bash` + `Write` | N/A | `.agent/manifest.json` `agents[].tools` | Role prompts scope behavior | No path restriction to `.design-ops/` |

### 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---------|----------|-----------------|-------------|-----------------------|
| Fixed sleeps in capture (about 4 s per site per viewport) | `scripts/capture.mjs` | Slow multi-site capture | Linear in sites × viewports | Measure before changing |
| Large always-loaded `SKILL.md` files | validator | Token use per trigger | Grows with edits | Progressive disclosure |

### 5) Fragile/High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|------|-------------|-------------|----------------------|
| `.agent/manifest.json` | Drives every generated file, including deletions | Central to every change | Edit, run `build.py`, review `git status` before committing |
| Awwwards regex parsers | Third-party markup | — | Exits loudly on 0 results. Fix the regex when it does |
| `tests/baseline.json` | Ratchet freezes current debt | Rebaselined at import | Use `--update-baseline` only for intentional growth |

### 6) `[ASK USER]` Questions

None open.

### 7) Evidence

- `scripts/build.py`, `scripts/validate-plugin.py`, `scripts/check-corpus.py`, `scripts/capture.mjs`
- `.agent/manifest.json`, `tests/baseline.json`, `AGENTS.md`

## Resolved on 2026-10-02

- Untracked content: the repo was re-initialised as `shotcowboystyle/design-ops-plugin` (private). The image-ops history stays in `image-ops-plugin`.
- No generator source: content was ported into `.agent/` and `build.py` extended for agents. The rebuilt layer is body-identical to the pre-port files.
- Licensing: `LICENSE` is now Apache-2.0, and `NOTICE` credits Sumi 4.2.0 and lists the modifications. Remaining `sumi` identifiers were renamed (`design-ops-orchestrator`, `design_ops_corpus.py`, `design-ops-file-schemas.md`).
- `check-corpus.py` SyntaxError and the `design_ops-orchestrator` key typos are fixed.
- The `capture.mjs` `process.env.design - ops_*` ReferenceError is fixed. Hardcoded personal project dirs are removed, and swallowed errors are commented or logged.
- Stale counts (43/37) are fixed. `/inspo`, `/figma` and `/ai-audit` were added to the `/status` and `/next` registries. Upstream version history was removed from `/design-ops`.
- `AGENTS.md` and `README.md` are regenerated for design-ops. The `AUDIT.md` references are trimmed. `.agents/`, `.claude/skills/` and `skills-lock.json` are removed.
- The Awwwards scraper now uses an honest user-agent (same response as the spoofed one).
- `build.py` was synced to the five sibling plugins. In ios-ops and meta-wearables-ops, 864 skill links that pointed back into `.agent/` now point at the generated copies (0 broken). Every README now has an "Editing this plugin" section.
- Corrections to the first pass of these docs: `tests/` existed (the scan skipped test dirs), `capture.mjs` already supported Linux Chrome, and `awwwards.mjs` already exited on zero results.
