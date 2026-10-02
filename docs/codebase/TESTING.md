# Testing Patterns

## Core Sections (Required)

### 1) Test Stack and Commands

- Primary test framework: **none**. "Tests" here are deterministic gates over the generated corpus, plus a ratchet against fixtures in `tests/`.
- Assertion/mocking tools: none.
- Commands (all pass at the 2026-10-02 snapshot):

```bash
python3 scripts/build.py --check          # generated layer matches .agent/ (90 files)
python3 scripts/validate-plugin.py        # 45 skills, 195 refs, 38 commands, 0 errors, 5 warnings
claude plugin validate .
python3 scripts/check-corpus.py all       # graph | shape | routing | budget — 0 errors, 6 warnings
python3 scripts/check-corpus.py all --update-baseline   # accept intentional growth
python3 scripts/extract-claims.py --csv   # citation worklist (84 claims), not pass/fail
```

- Coverage: N/A.

### 2) Test Layout

- `tests/baseline.json`: per-file token budgets, per-skill orphan counts, required sections. Rebaselined 2026-10-02 to this repo's corpus. The upstream Sumi baseline failed on 43 files after the rename edits.
- `tests/routing-fixtures.yaml`: 24 prompt → expected-skill cases for the routing check. Currently 22/24. Misses: `motion-gsap-specific`, `desktop-chrome`.
- `tests/retired-commands.txt`, `slash-token-allowlist.txt`, `schema-waivers.txt`: name and schema guards.
- Gates run against the **generated** layer (`skills/`, `commands/`), so build first.

### 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Structural (manifest, frontmatter, names, counts) | yes | `plugin.json`, `SKILL.md`, commands | `validate-plugin.py`. Its count check scans only `plugin.json`/`marketplace.json`/`README.md` |
| Generator drift | yes | `.agent/` → generated layer | `build.py --check` |
| Knowledge graph and budgets | yes | `skills/**`, `commands/` | `check-corpus.py` |
| Routing | partial | skill descriptions | lexical fixture match, not a live session |
| Script unit tests | no | `capture.mjs`, `awwwards.mjs`, `build.py` | smoke-tested by hand: capture of example.com and `awwwards.mjs sotd --limit 2` both succeeded |
| E2E command runs | no | — | `check-corpus.py` header: a green run "is a statement about plumbing" |

### 4) Mocking and Isolation Strategy

- None. Gates read the working tree. Scripts hit the live network.
- Common failure mode: editing a generated file instead of `.agent/`. `build.py --check` catches it.

### 5) Coverage and Quality Signals

- No CI. Run the gates locally before committing.
- Known gaps: there are no automated tests for the scripts, and routing is checked lexically only.

### 6) Evidence

- `scripts/build.py`, `scripts/validate-plugin.py`, `scripts/check-corpus.py`, `tests/`
- Terminal output of each command above
