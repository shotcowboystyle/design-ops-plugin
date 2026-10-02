# External Integrations

The plugin ships **no** MCP config (`.mcp.json` absent) and no credentials. Every integration below is either a public website scraped by a script, or an MCP server the user must configure themselves.

## Core Sections (Required)

### 1) Integration Inventory

| System | Type | Purpose | Auth model | Criticality | Evidence |
|--------|------|---------|------------|-------------|----------|
| awwwards.com | Public HTML scrape (Node `fetch`) | Award-winning site listings (live URL, jury score, tags) | None. Honest `design-ops-plugin` user-agent. Listing and `/sites/` paths are allowed by robots.txt | Med. Feeds `/inspo` and the critic baseline | `scripts/awwwards.mjs:16-62` |
| Arbitrary live sites | Headless Chrome via `puppeteer-core` | Screenshots + measured design DNA (`dna.json`) | None | High for `/inspo` and the critic | `scripts/capture.mjs` |
| Mobbin MCP | MCP server (`mcp__mobbin__*`) | Real app screens and flows for the scout and ux-architect | MCP auth (`mcp__mobbin__authenticate`) | Med | `agents/scout.md:21`, `agents/ux-architect.md` |
| MotionSites | Web (via the agent's `WebFetch`) | Motion recipes | None | Low | `agents/scout.md:3`, `skills/reference-intelligence/references/motionsites-adapter.md` |
| Figma MCP (`figma-mcp` / `figma-developer`) | MCP | Design-to-code import | User's Figma token | Low (opt-in) | `commands/generate.md:70-73`, `commands/figma.md` |
| Stitch, Fal.ai (FLUX/Imagen/Recraft/Veo), GPT-image | MCP / API | AI asset and mockup generation | API keys (`FAL_KEY`, `STITCH_API_KEY`, `RECRAFT_API_KEY`) held by the user's MCP setup | Low (opt-in) | `commands/generate.md:3,36`, `skills/ai-design-generation/references/mcp-design-tools.md` |

### 2) Data Stores

| Store | Role | Access layer | Key risk | Evidence |
|-------|------|--------------|----------|----------|
| `.design-ops/` in the user's project | Design memory (JSON + NDJSON log) | Commands, via prose instructions | No schema validation. Concurrent writers rely on the ownership convention | `skills/design-memory/SKILL.md` |
| `.design-ops/refs/` | Scraped listings, captures, `board.json` | `awwwards.mjs`, `capture.mjs`, agents | Caches reused under 7 days, stale after that | `agents/scout.md:20-21` |
| `.design-ops/cache/` | Mentioned once `[TODO]` purpose | — | — | grep across skills/commands |

No databases.

### 3) Secrets and Credentials Handling

- Credential sources: none in the plugin. Third-party keys appear only as names in skill prose describing how users configure their MCP servers.
- Hardcoding check: grep found no literal keys. `AWS_SECRET_ACCESS_KEY`, `ANTHROPIC_API_KEY` and similar appear only as example names in reference docs.
- Rotation: N/A.

### 4) Reliability and Failure Behavior

- Retry/backoff: **none**. `awwwards.mjs` throws on non-2xx (`get`, line 59), uses a fixed 600 ms delay between detail pages (line 133) and caps detail fetches with `--limit`.
- Timeouts: no explicit `fetch` timeout in `awwwards.mjs`. `capture.mjs` uses fixed sleeps (2500 ms for preloaders, line 520) plus puppeteer navigation defaults `[TODO verify goto timeout]`.
- Fallback: `capture.mjs` tries several candidate directories for `puppeteer-core` and Chrome. The scout agent states unavailable sources plainly ("Mobbin not authenticated") instead of inventing results (`agents/scout.md:35`).
- Scraper fragility: Awwwards parsing is regex over HTML (`parseListing`, `parseDetail`). Zero listing results exit 1 with a "No sites found" message. Per-site detail failures are recorded as `{slug, error}` entries rather than aborting.

### 5) Observability for Integrations

- Logging: `console.error` on failures in both `.mjs` scripts. Agents write reports into `.design-ops/refs/_build/critique-<date>.md`.
- Metrics/tracing: none.
- Gaps: navigation timeouts log a warning and capture whatever loaded. Consent-banner dismissal stays best-effort and silent by design.

### 6) Evidence

- `scripts/awwwards.mjs`, `scripts/capture.mjs`
- `agents/scout.md`, `agents/ux-architect.md`, `agents/critic.md`
- `commands/generate.md`, `commands/figma.md`, `commands/inspo.md`
- `skills/design-memory/SKILL.md`, `skills/reference-intelligence/references/*-adapter.md`
