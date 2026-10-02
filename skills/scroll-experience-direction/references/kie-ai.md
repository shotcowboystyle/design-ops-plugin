# Kie AI — generating what the subject still lacks

Kie (kie.ai) is one API key in front of many image and video models. Design Ops uses it for
environment plates, atmosphere, foreground framing, portrait variants, camera-move clips and
background removal. Everything goes through `scripts/kie.mjs`, which wraps
Kie's market API: create a task, poll it, download the result, and write a provenance
sidecar next to it.

Generation runs in **stage 4 only**, after the plan is approved. Every output is looked at
before it is used.

## Setup

```bash
export KIE_AI_API_KEY=…            # or put it in the project's .env (never commit it)
node "$KIE" probe                  # → {"credits": N}; run before and after a batch
```

**No key:** do not stop and do not fail silently. Print each planned generation as a spec
(model, input JSON, preamble, scene prompt, target file) so the user can run it in the Kie
playground. Then continue with the authentic and user assets that exist.

## Commands

| Command  | Default model                                                       | Use for                                                                    |
| -------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `still`  | `seedream/5-pro-text-to-image`; `seedream/5-pro-image-to-image` with `--ref` | Plates, environments, staging; product shots built *from* the authentic asset |
| `shot`   | `kling-3.0-omni/image-to-video`                                     | One camera move from a first frame; `--tail` pins the last frame           |
| `cutout` | `recraft/remove-background`                                         | Alpha planes from stills or authentic photos                               |
| `status` | —                                                                   | Re-check a task that timed out locally                                     |

Common flags:
- `--model <id>` overrides the default. Any market model ID works: Nano Banana, GPT Image,
  Imagen 4, Flux-2, Hailuo, Wan, Seedance, Veo.
- `--out` and `--name` set where the file is saved and what it is called.
- `--preamble file` prepends the world preamble verbatim.
- `--dry-run` prints the request body and spends nothing.

The model IDs and input fields were checked against docs.kie.ai on 2026-10-02.
- **Seedream 5 Pro** `aspect_ratio` is one of `1:1 4:3 3:4 16:9 9:16 2:3 3:2 21:9`. 4:5 is not
  accepted; use 3:4 instead.
- **Kling 3.0 Omni** takes `image_urls` as `[first]` or `[first, last]`, `duration` 3-15, and
  `resolution` 720p, 1080p or 4k.

When a call is rejected, check the model's page under docs.kie.ai first. Field names change
between model versions.

**Uploads.** Local `--ref`, `--image` and `--tail` files are uploaded through Kie's base64
upload. Uploaded files expire after 3 days, so re-run with local paths rather than reusing old
upload URLs.

**Cost.** Kie prices per model and changes its prices. Do not quote credit figures from memory.
Run `probe` before and after, and report the difference. If several builds share a key at the
same time, that difference is approximate. Every sidecar records `creditsConsumed` when Kie
returns it.

## The world preamble (written per project)

One preamble per site, reused **verbatim** at the top of every still and shot prompt, keeps
the generated set looking like one photographer shot it. Write it in stage 3 from the
interview, the subject truth and the board. Never take it from a stock list. Store it at
`.design-ops/scroll/preamble.txt` and pass it with `--preamble`.

Formula, five parts:

1. **Medium and lens.** "Medium-format photograph, 80mm, f/5.6, eye level."
2. **Light.** Count the sources and place them. "One soft key from high camera-left, a
   faint warm rim from behind right, no fill."
3. **Grade in three words.** "Cool, dense, quiet."
4. **Texture.** "Fine grain, slight halation on highlights, matte blacks."
5. **Negatives.** "Not a 3D render, not CGI, no plastic sheen, no text, no watermark, no
   logos except the supplied one."

Check the preamble against the board's direction. Its palette and contrast must be able to
produce the planned token colours behind type.

## Scene prompts

`<preamble>` + blank line + scene. Every scene prompt must:

- **Name the empty space.** Say where the type will go, for example "large empty shadowed
  area across the upper left third". A prompt without planned negative space produces a frame
  that type cannot sit on.
- **Contain the whole subject** with generous safe margins. Regenerate any frame where the
  subject is cropped.
- **Match the light in the preamble.** A plate lit from the right under a subject lit from the
  left breaks the composite.
- **Contain no text.** Type is HTML.
- **Generate plates empty.** The far and mid plates leave out the focal subject entirely (see
  `depth-and-states.md`).
- **Pass the authentic product** as `--ref` on **every** prompt that shows it. A label that
  drifts between shots is the first thing a client notices. If image-to-image distorts the
  product, composite the authentic cutout over a generated plate instead.

For phones, generate 9:16 natively with `--aspect 9:16` (see `phone-direction.md`).

## Camera-move prompts (`shot`)

- Use one continuous move in one direction, for example "slow dolly forward toward the
  bottle, constant speed". Make it slower than feels right; scroll stretches it further.
- Keep the subject in frame the whole time. Nothing enters or leaves the frame. No cuts.
- Kling Omni has no negative-prompt field, so put the negatives in the scene prompt: "no
  warping, no morphing, no flicker, no new objects, no text".
- **Chained clips:** extract the *encoded* last frame of clip N (`render-route.md`) and pass
  it as `--image` for clip N+1. Where both ends must match the plan, also pass `--tail`.

## After every call

1. **Open the file and look at it.** Check:
   - Is the subject whole?
   - Is the empty space where it was asked for?
   - Is the light consistent?
   - Did the product drift from the reference?
2. Cut out planes with `cutout`. Check the edges over both light and dark backgrounds.
3. Add the asset to `.design-ops/scroll/assets.json` with `provenance: "generated"`, the
   model, the `taskId`, and what the file actually shows. Use `kie.mjs`'s own sidecar as the
   source for those values.
4. Encode clips for scrubbing (`render-route.md`) and take each poster from the clip's own
   first frame.

## When Kie is the wrong tool

- **Vector marks and icons:** use Recraft V3 via `ai-design-generation`, or the brand's own SVG.
- **UI screens:** use Stitch via `ai-design-generation`.
- **The real product:** use the authentic asset. Generate around it, not instead of it.
