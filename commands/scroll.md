---
description: Cinematic scroll site — interview, brand truth, live references, depth-plane plan, Kie AI assets, GSAP build, and frame-verified delivery graded against the board.
argument-hint: "[subject — product, brand, or place] [--continue | --stage N | --you-decide]"
---

# Scroll — Cinematic Scroll Site, Directed for Its Subject

## Before running

This command needs a subject: the product, brand, place or person the site is for.

If the user invoked it with nothing, and no subject is evident from the conversation,
`.design-ops/brief.json` or open files, ask for it in one plain-language question and stop.
Do not invent a subject. A cinematic site about something imaginary is worthless, and its
invented facts read as real.

If a subject is evident from context, use it and say which one you picked.

Load the `scroll-experience-direction` skill and follow its stage loop. Each stage ends at a
gate. Say which stage is running, and never start the next stage until its gate holds.

Resolve the plugin scripts once:

```bash
DESIGN_OPS="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(dirname "$(find ~/.claude/plugins -path '*design-ops*/scripts/capture.mjs' -print -quit)")")}"
KIE="$DESIGN_OPS/skills/scroll-experience-direction/scripts/kie.mjs"
```

**Flags in `$ARGUMENTS`:**

- `--continue`: resume at the first stage whose output is missing in `.design-ops/scroll/`.
- `--stage <n>`: re-run one stage. Downstream outputs are marked stale but not deleted.
- `--you-decide`: explicit creative delegation (the interview's delegated mode).

---

## Stage 0 — Interview

1. Read design memory in its contract order: `brief.json` → `map.json` → `refs/board.json`
   → `style.json` → `decisions.log`. Read an existing `.design-ops/scroll/` too, because this
   may be a revision.
2. Settle creative authority, then run the one-message interview from
   `scroll-experience-direction/references/interview-and-subject.md`. Show values that
   design memory already holds as defaults to confirm.
3. Write `.design-ops/scroll/brief.md`. **Gate:** the user approves it, or authority was
   delegated.

## Stage 1 — Subject truth

1. Open the official sources live: site, docs, store or app listing.
2. Write `scroll/subject.md` with sourced facts, the unverified list, brand truths and real
   destinations.
3. Open every supplied asset, describe what it actually shows, and record it in
   `scroll/assets.json` with its provenance.

**Gate:** nothing on the planned page depends on an unverified fact.

## Stage 2 — Sourcing

1. Run the `/inspo` flow, or delegate it to the `scout` agent. Derive tags from the subject
   (the sector map in `reference-intelligence/references/awwwards-adapter.md`) plus 1-2
   technique tags such as `scrolling`, `parallax`, `storytelling`, `three-js` or `webgl`.
2. The user keeps 3-5 references.
3. Capture the kept references with frames:

```bash
node "$DESIGN_OPS/scripts/capture.mjs" --from .design-ops/refs/awwwards-<tag>.json --pick a,b,c --frames --passes desktop,phone
```

4. Read the frames. Write `scroll/sourcing.md` with *observed / why it works / principle to
   adapt* for each reference.
5. Build or extend the board (`reference-intelligence/references/board-synthesis.md`).

**Gate:** every kept reference has observed behaviour that cites a frame.

## Stage 3 — Plan

Write `.design-ops/scroll/plan.json`:

```json
{
  "$design_ops": "1",
  "site": "Aster Gin",
  "beliefAtExit": "…",
  "ctaLabel": "Reserve a bottle",
  "curve": [{"beat": "recognition", "feel": "held"}, {"beat": "turn", "feel": "released", "peak": true}],
  "itsTheSiteWhere": "…",
  "informationOrder": {"order": ["recognition", "substance", "range", "commitment"], "why": "…"},
  "grammar": {"name": "specimen-catalog", "whyOthersLost": {"single-take": "…"}},
  "nav": "jump-index",
  "signature": {"move": "…", "reducedMotion": "…"},
  "controls": [{"control": "…", "carriesTo": "close"}],
  "close": "…",
  "preamble": ".design-ops/scroll/preamble.txt",
  "acts": [
    {
      "id": "recognition",
      "device": "pin",
      "route": "composite",
      "span": "1.6vh",
      "states": {"opening": "…", "midpoint": "…", "exit": "…"},
      "layers": [{"plane": "focal", "asset": "hero-product", "rate": 0.8, "anchor": {"on": "plinth-top", "pivot": "50% 92%"}}],
      "phone": {"crop": "…", "pivot": "50% 88%", "type": "above subject", "planes": 2}
    }
  ],
  "score": [{"beat": "recognition", "device": "pin", "why": "…"}],
  "fingerprint": {"grammar": "…", "nav": "…", "hero": "…", "actShape": "pin>parallax>flow>sequence>pin", "close": "…", "signature": "…"},
  "gate": [{"vs": "Earlier Site", "differ": 5, "pass": true}]
}
```

1. Follow `uniqueness.md` (curve, beats, order, grammar, controls, signature, close),
   `depth-and-states.md` (layers, anchors, states), `render-route.md` (route per act) and
   `phone-direction.md` (phone per act).
2. Write the world preamble to `scroll/preamble.txt` using the formula in `kie-ai.md`.
3. Run the fingerprint gate against `${DESIGN_OPS_HOME:-~/.design-ops}/fingerprints.ndjson`,
   and run the board's clone check.
4. Present the plan in one screen: curve, acts, grammar and why, signature, gate result, and
   the generation list with its counts.

**Gate:** the user approves. No generation before this point.

## Stage 4 — Assets

1. Authentic and user assets first.
2. For each gap, run `node "$KIE" still|shot|cutout …` with `--preamble`, and pass `--ref`
   on every prompt that shows the product. Run `probe` before and after.
3. Look at every output. Regenerate a still when:
   - the subject is cropped
   - the empty space is in the wrong place
   - the light is inconsistent
   - the product drifted from the reference
4. Cut out the planes, check their edges over light and dark, and encode the clips
   (`render-route.md`).
5. Update `scroll/assets.json` from each sidecar.

If `KIE_AI_API_KEY` is missing, print every generation spec and continue with what exists.

**Gate:** every planned plane has a final, viewed asset with recorded provenance.

## Stage 5 — Build

- **Stack:** `style.json` `project`. If there is none, ask once. The default is the project's
  framework with GSAP ScrollTrigger + Lenis, and R3F or Three.js only for the acts whose
  route is `3d`.
- **Code:** take it from `animation-recipe-library/references/gsap-scrolltrigger-recipes.md`
  (Lenis provider, pin and scrub, parallax, matchMedia, framework integration) and
  `cursor-text-3d-effects.md` (R3F). The signature move is bespoke page code.
- **Tokens:** if `style.json` exists, use its tokens and invent none. If it doesn't, suggest
  `/style` first, or build with a local token block derived from the board and say so.
- **Markup:**
  - Mark each act `data-act="<beat-id>"`, and mark intended holds `data-verify-hold="true"`.
  - Every act has its reduced-motion form and its no-JS content.
  - 3D acts have their posters.

**Gate:** it runs locally with no console errors.

## Stage 6 — Verify

```bash
node "$DESIGN_OPS/scripts/capture.mjs" http://localhost:<port> --frames --out .design-ops/scroll/verify
```

Follow `scroll-experience-direction/references/verify-and-package.md`:

1. Clear the machine flags.
2. Read every sheet against the plan's states.
3. Check contrast on the composite.
4. Run `/grade` against the board with the scroll lens (the `critic` agent can run it).
5. Do the cold feel check and the manual passes.
6. Fix, then re-capture, keeping the failed evidence.

**Gate:** no open flags, the grade clears the wall, and the feel diff agrees.

## Stage 7 — Package

1. Build the delivery package, open it at its root or base URL, and re-run the frame capture
   there.
2. Append the fingerprint row to the global registry.
3. Append one line to `.design-ops/decisions.log`.
4. Write the final report.

---

## Output Format

Each stage ends with a short status block:

```
Stage N — <name> ✓   wrote → .design-ops/scroll/<file>
Gate: <the condition, and why it holds>
Next: Stage N+1 — <name>  (or: waiting on your approval)
```

The final report (stage 7) contains:

- the grammar, and why the others lost
- the signature move
- the gate result per registry row
- the journey and curve, and the feel diff
- the grade against the board
- the generated assets, with credits used
- what was verified, and what was not (always: a real phone)
- the local and package URLs

## Quality Gates

The output MUST include:

- [ ] An approved brief, or a brief marked self-authored under explicit delegation, before any planning
- [ ] A subject file that separates sourced facts from unverified ones, with every asset opened and described
- [ ] 3-5 live references, each with observed behaviour cited from captured frames
- [ ] A plan with a layer contract, contact anchors, and opening/midpoint/exit for every act
- [ ] A phone plan per act that recomposes rather than scales
- [ ] A render route per act, with a reason
- [ ] A fingerprint gate result against every registry row, plus the board clone check
- [ ] User approval of the plan before the first generation call
- [ ] Frame captures across desktop, phone, compact, reduced motion, no-JS and no-WebGL, actually read
- [ ] A side-by-side grade against the board, with the scroll lens applied
- [ ] A delivery package tested at its own root, and the fingerprint row appended

The output MUST NOT include:

- Invented statistics, testimonials, prices, availability or dates
- A generated stand-in for the real product or logo when an authentic asset exists
- Text baked into generated imagery
- A generic 3D primitive presented as the product
- A desktop composition scaled down as the phone version
- A close that fades to empty or becomes the footer
- Any generation before the plan is approved
- `.env` files, API keys or third-party reference captures in the package

---

## Cross-References

- `scroll-experience-direction` — the stage loop, and every reference this command follows
- `reference-intelligence` — scouting, capture, the board, and the comparison protocol
- `animation-recipe-library` — GSAP ScrollTrigger, Lenis and R3F recipes for the build
- `ai-design-generation` — other generators when Kie is not the right tool
- `visual-design-mastery` — the 10-dimension rubric behind the grade
- `design-memory` — the `.design-ops/scroll/` subtree this command owns
- `accessibility-inclusive-design` — keyboard, focus, contrast and reduced motion

---

## Next Steps

```
Site packaged → <path> · fingerprint appended · grade X.X vs board median Y.Y
```

- `/grade` — re-score after any later change, against the same board
- `/a11y` — a full WCAG pass beyond the delivery gate
- `/preflight` — SEO, analytics, legal and monitoring before launch
- `/design-ops` — see the full command list
