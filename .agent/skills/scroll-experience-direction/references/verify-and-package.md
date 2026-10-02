# Verify and package

A scroll site can pass every build, lint and unit test and still look broken. Planes float,
type sits on a bright highlight, a pinned act goes dead on phones, or the close turns into
a white void. The only evidence is a **captured frame**: frames at the states the plan
promised, across every pass, read by eye and checked by machine.

## 1. Capture the frames

```bash
node "$DESIGN_OPS/scripts/capture.mjs" http://localhost:5173 --frames --out .design-ops/scroll/verify
```

`--frames` builds on the normal reference capture, which keeps its `dna.json` so the critic
can compare against the board. It adds a frame set per pass under
`<slug>/frames/<pass>/` and a `frames/report.json`.

**Passes** (all six by default; narrow them with `--passes`):

| Pass      | Viewport and condition                          | What to look for                                                  |
| --------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `desktop` | 1440×900                                        | Every act's opening, midpoint and exit match `plan.json` `states` |
| `phone`   | 390×844, touch, mobile UA                       | The phone plan: crop, contact pivot, type position                |
| `compact` | 360×640                                         | Type collisions, CTA reachability, overflow                       |
| `reduced` | `prefers-reduced-motion: reduce`                | Fewer and gentler moves; every act's content still complete      |
| `nojs`    | JavaScript disabled                             | Content readable in order, posters visible, forms usable          |
| `nowebgl` | WebGL contexts return `null`                    | 3D acts fall back to their posters; no blank canvas               |

**Acts and states:**
- Acts are the elements marked `data-act="<beat-id>"`. Mark every act with it, using the
  beat IDs from `plan.json`. Without the attribute, top-level sections are used instead.
- Tall acts (pinned or scrubbed) are sampled at `entry`, `midpoint` and `exit`. Short acts
  get one `view` frame.
- A GSAP pin-spacer is measured in place of the pinned element.
- Scrolling uses real wheel input, so Lenis and ScrollTrigger respond as they do for a
  visitor.

**Machine flags in `report.json`:**
- **dead scroll**: a frame identical to the previous state in the same act, on a pass where
  motion is expected. An intended hold is marked with `data-verify-hold="true"`.
- **scroll blocked or jacked**: the page could not reach the requested position.
- **horizontal overflow**: content wider than the configured viewport.
- **console errors** and **failed requests**.

With ffmpeg on PATH, each pass also gets a `sheet.jpg`, so a whole pass can be read in one
image.

For **references**, sample only what you need, because each pass costs a full scroll:
`capture.mjs --from … --pick a,b --frames --passes desktop,phone`.

## 2. Read the frames

The machine flags are the floor, not the verdict. Open every sheet and check:

1. **States.** Does each act's opening, midpoint and exit say what `plan.json` `states`
   promised? A promised "outside becomes inside" that reads as "image slides up" fails.
2. **Depth.**
   - Do the planes separate visibly between entry and exit?
   - Are there no duplicate subjects (a ghost on the plate) and no halos?
   - Do grounded subjects stay on their contact anchors at the midpoint?
3. **Contrast on the composite.** Check each line of type against the **brightest** (for
   light text) or **darkest** (for dark text) pixels actually behind it in the frame, not
   against the CSS colour pair. The minimum is 4.5:1 for body, and 3:1 for large text and
   controls. Fix it by recomposing the empty area, adding a local scrim, or regrading the
   plate. Never fix it with a full-frame dark overlay.
4. **The close.** It resolves and holds on desktop *and* on phones. If the close trails off,
   the build fails.
5. **The phone plan.** The phone frames match `acts[].phone`, and are not the desktop layout
   squeezed.

## 3. The scroll lens on the grade

Run `/grade` with the board present, so the build is scored side by side with the
references (`reference-intelligence/references/comparison-protocol.md`). Then add these
scroll-specific checks to the Motion and Craft dimensions. Each failed check caps that
dimension at 6:

| Check                                                                 | Dimension |
| --------------------------------------------------------------------- | --------- |
| Exactly one peak, and it has the largest span                         | Motion    |
| No device family appears in two adjacent acts; at most 2 scrubs       | Motion    |
| Every act's frames show a state change in meaning, not just position  | Motion    |
| Reduced-motion pass is complete (content present, gentler, not empty) | Motion    |
| Planes separate; no floating subjects; no halos or ghost duplicates   | Craft     |
| Phone frames show a recomposition, not a scale-down                   | Craft     |
| No-WebGL and no-JS passes keep content and posters                    | Craft     |
| The signature move is visible in the frames and is unique to this site | Craft    |

The `critic` agent can run the capture and the side-by-side comparison. Route its fixes:
direction problems go to the plan, and build problems go to the code.

## 4. The cold feel check

After the fixes, look at the desktop sheet as if seeing it for the first time:

- Write **one word per act** for how it feels.
- Diff those words against the feeling curve in `brief.md`.
- **Where they disagree, the page is wrong, not the brief.** Fix the act and re-capture.
  Record the diff in the final report.

## 5. Manual passes (headless cannot cover these)

- **Keyboard.** Tab through the whole page. Focus must be visible and its order must follow
  the information order. Focus inside a horizontal rail must scroll the rail. Menus and
  drawers must trap and restore focus.
- **Pointer states.** Hover and press every control. Pointer effects only run on
  `(hover: hover) and (pointer: fine)`.
- **Real controls.** Exercise each control that belongs to the offer:
  - The selection must carry through to the close.
  - Downloads must contain what they claim.
  - Validation messages must be useful.
  - Submissions must persist where the plan says they do.
- **Forms without JS.** A no-JS form must never fall back to `GET` with personal data in the
  URL. Use `method="post"` with a real endpoint, or disable submission without JS and say so
  in the form.
- **A real phone.** Headless capture is not a phone. Say this in the report, and offer a LAN
  URL (for example `vite --host`) so the user can check iOS video priming, the toolbar's
  effect on `100svh`, and how momentum scrolling feels.

Keep the evidence from failed runs: rename the old `verify/` folder to a dated sibling
before re-capturing. A fix that cannot show its "before" frame is unproven.

## 6. Package

- **Ship only what is used.** Include the referenced assets in their encoded forms, the
  posters, the fonts with their licenses, and a `LICENSES.md` that lists generated assets
  (model, date) and client-supplied assets.
- **Never ship:**
  - `.env` files or API keys
  - `.design-ops/` (third-party reference captures are study material and stay local)
  - raw generation sources or unencoded masters
  - private submissions or test data
- **Test the package itself.** Serve the built output from its root, or from the base path
  it will deploy to, and open it there. Then re-run `capture.mjs --frames --passes
  desktop,phone` against that URL. A site that only works from the dev server is not
  delivered.
- **Then log it:**
  - Append the fingerprint row (`uniqueness.md`).
  - Append one line to `.design-ops/decisions.log`.
  - Write the final report: grammar and why the others lost, the signature move, the gate
    result per registry row, the curve and the feel diff, the grade against the board, what
    was generated (with credits), what was verified, what was not (real phone), and the
    local URL.
