# Coding Conventions

## Core Sections (Required)

### 1) Naming Rules

| Item | Rule | Example | Evidence |
|------|------|---------|----------|
| Files (content) | kebab-case `.md`. Skills live as `skills/<kebab>/SKILL.md` | `skills/typography-pairing-recipes/SKILL.md` | `validate-plugin.py` `KEBAB` regex |
| Skill `name` | Must equal the directory name. Comes from the manifest | `design-ops-orchestrator` | `validate-plugin.py` |
| Python scripts | Kebab-case CLIs, snake_case importable modules | `check-corpus.py` vs `design_ops_corpus.py` | `scripts/` |
| Functions/methods | Python snake_case, JS camelCase | `check_counts`, `loadPuppeteer` | `validate-plugin.py`, `capture.mjs` |
| Constants/env vars | UPPER_SNAKE | `SPEC_FIELDS`, `DESC_CAP`, `DESIGN_OPS_CHROME` | `validate-plugin.py:28-40`, `capture.mjs:13` |
| Memory files | `.design-ops/<artifact>.json`, `wireframe-<screen>.json`, `generated-<asset>.json` | `.design-ops/style.json` | `skills/design-memory/SKILL.md` |

### 2) Formatting and Linting

- Formatter: none configured (scan: "No linting or formatting config files found"). The JS looks Prettier-shaped (trailing commas, wrapped args), but no config is checked in `[TODO]`.
- Linter: none. `# noqa: E402` comments suggest flake8/ruff were used upstream (`check-corpus.py:29`).
- Enforced content rules (via `validate-plugin.py`):
  1. Frontmatter fields limited to the Agent Skills spec (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`). Claude-Code-only keys are flagged because they block claude.ai distribution.
  2. Description cap is 1536 chars (`DESC_CAP`).
  3. Numeric claims ("N skills / N commands") in `plugin.json`, `marketplace.json` and `README.md` must match the tree.
- Generated frontmatter: skills get `name`, `description`, `disable-model-invocation`, `allowed-tools`. Commands get `description`, `argument-hint`. Agents get `name`, `description`, `tools`. Edit these in `.agent/manifest.json`, never in the generated file.
- Run: `python3 scripts/build.py --check && python3 scripts/validate-plugin.py && claude plugin validate .`

### 3) Import and Module Conventions

- Python: stdlib only. Optional `yaml` with graceful fallback. Sibling import through a `sys.path.insert` of `scripts/`.
- JS: Node ESM, `node:`-prefixed builtins only. External `puppeteer-core` is resolved dynamically through `createRequire` over candidate dirs (`capture.mjs:57-77`).
- Markdown cross-references: three syntaxes, all resolved by `design_ops_corpus.py`: `references/x.md`, `other-skill/references/x.md`, and bare `` `x.md` `` under a "Reference Files" heading.

### 4) Error and Logging Conventions

- Python CLIs collect `errors`/`warnings` lists, print `warn`/`FAIL` lines, and exit 1 on any error (`validate-plugin.py` `main`).
- `build.py` hard-exits with `sys.exit("error: ...")` on manifest inconsistencies.
- JS: `console.error` plus `process.exit(1|2)`. Every swallowed error in `capture.mjs` either has a justification comment (the probe loop, the best-effort consent dismissal) or logs a warning (navigation timeout).
- Redaction: N/A. No secrets are handled by the code.

### 5) Testing Conventions

- No unit tests. Structural gates plus the `tests/` ratchet. See TESTING.md.

### 6) Evidence

- `scripts/validate-plugin.py`, `scripts/check-corpus.py`, `scripts/design_ops_corpus.py`, `.agent/manifest.json`
- `scripts/capture.mjs`, `scripts/build.py`
- `skills/design-memory/SKILL.md`
- scan output: LINTING AND FORMATTING CONFIG section
