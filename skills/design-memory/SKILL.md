---
name: design-memory
description: The .design-ops/ design memory contract — which files exist, the canonical style.json schema, which command owns which subtree, read order, and merge rules. Use whenever a command reads or writes .design-ops/, or when design decisions from an earlier command must survive into a later one.
disable-model-invocation: false
allowed-tools: Read, Grep, Glob, Write, Edit
---

# Design Memory — the `.design-ops/` contract

`.design-ops/` is what makes the commands compose. `/style` decides a visual direction
once; `/screen`, `/component`, `/page`, `/fix` and a dozen others consume it
instead of re-inventing a palette every invocation.

That only works if every command agrees on the file shape. Until v4.1.0 none was
written down, and four commands wrote `.design-ops/style.json` in four different
shapes while other commands read whichever they assumed. This skill is the
single definition.

## Constants

The canonical `.design-ops/style.json`. Every writer emits this envelope; nobody
invents keys.

```json
{
  "$design_ops": "1",
  "meta": {
    "generated": "ISO-8601 timestamp",
    "updatedBy": ["/style"],
    "sector": "fintech",
    "mood": "professional",
    "platform": "web"
  },
  "project": {
    "framework": "react | vue | svelte | vanilla | swiftui",
    "styling": "tailwind | css | styled-components | swiftui",
    "typescript": true
  },
  "tokens": {
    "$schema": "https://design-tokens.github.io/community-group/format/",
    "color": {},
    "typography": {},
    "space": {},
    "radius": {},
    "shadow": {},
    "duration": {},
    "easing": {},
    "z": {},
    "$themes": { "light": {}, "dark": {} }
  },
  "tone": {
    "formality": "",
    "traits": [],
    "wordsToUse": [],
    "wordsToAvoid": []
  },
  "references": [{ "app": "", "platform": "", "stealThis": "", "takeaway": "" }]
}
```

Everything under `tokens` is W3C DTCG. Everything outside it is Design Ops' own
envelope, because DTCG has no way to express a sector, a tone of voice, or a
list of reference apps.

## The file set

| File                                  | Written by                                        | Holds                                                                                                        |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `.design-ops/style.json`              | `/style`, `/palette`, `/type`, `/tokens`, `/dark` | the schema above                                                                                             |
| `.design-ops/brief.json`              | `/brief`                                          | persona, HMW questions, constraints, success criteria                                                        |
| `.design-ops/map.json`                | `/map`                                            | sitemap, screen inventory, content hierarchy                                                                 |
| `.design-ops/vision.json`             | `/grade`                                          | visual direction, designer-DNA match, score                                                                  |
| `.design-ops/wireframe-<screen>.json` | `/wireframe`                                      | layout structure, component map                                                                              |
| `.design-ops/generated-<asset>.json`  | `/generate`                                       | generation records, prompts, model, score                                                                    |
| `.design-ops/refs/`                   | `/inspo`                                          | sourced references, captures, `board.json`. Schema in `reference-intelligence/references/board-synthesis.md` |
| `.design-ops/scroll/`                 | `/scroll`                                         | brief, subject truth, `plan.json`, `assets.json`, verify frames. Schema in `design-ops-file-schemas.md`      |
| `.design-ops/decisions.log`           | any command                                       | append-only NDJSON: `{ts, command, decision, reason, overrides}`                                             |

## Ownership

A writer touches its own subtree and nothing else. This is what allows four
commands to share one file without clobbering each other.

| Command         | Owns                                                       |
| --------------- | ---------------------------------------------------------- |
| `/style`        | the whole file — it is the only command that may create it |
| `/palette`      | `tokens.color`                                             |
| `/type`         | `tokens.typography`                                        |
| `/tokens`       | `tokens.*` (serialization only; it does not decide)        |
| `/dark`         | `tokens.$themes.dark`                                      |
| `/inspo`        | `.design-ops/refs/` only                                   |
| `/scroll`       | `.design-ops/scroll/`, and appends to the global `~/.design-ops/fingerprints.ndjson` |
| everything else | **read-only**                                              |

## Read order

Broad to specific. Later files override earlier ones where they overlap.

1. `brief.json` — who it is for and what problem it solves
2. `map.json` — what screens exist
3. `refs/board.json` — what the references say it should look like
4. `style.json` — what it looks like (the decision; wins over the board)
5. `vision.json` — the visual bar and DNA match
6. `wireframe-<screen>.json` — the layout of the screen actually in play
7. `decisions.log` — the running override log; the last entry wins

## Merge rules

1. **Read-modify-write, never replace.** Load the file, deep-merge your subtree,
   write it back. Append your command name to `meta.updatedBy` and refresh
   `meta.generated`. A whole-file replacement destroys three other commands'
   work and is the specific bug this contract exists to prevent.
2. **Precedence: explicit user instruction > design memory > defaults.** An
   instruction in the current turn wins immediately and appends to
   `decisions.log` with its reason.
3. **Absent is not empty.** No file means "not decided yet" — generate a value
   and offer to persist it. A file present but partial means "decided" for the
   sections that exist; fill only the gaps.
4. **Never invent a token when `style.json` exists.** If the palette is on disk,
   use it. Inventing a second palette mid-session is the most visible way to
   break the illusion that the commands are one system.
5. **Conflict: ask once.** If your write would change a value another command set
   in a previous session, surface both values in one line and ask. Do not ask
   twice in a session, and do not silently overwrite.

## Routing

For **the full JSON Schema of every file**, worked merge examples, and the
migration note for pre-v4.1.0 files: read `references/design-ops-file-schemas.md`.

## Cross-References

- `design-systems-architecture` — the DTCG token tiers `tokens` serializes
- `design-token-presets` — vetted starting token sets to seed `tokens` from
- `design_ops-orchestrator` — pipelines that span several commands, which is when
  design memory earns its keep
