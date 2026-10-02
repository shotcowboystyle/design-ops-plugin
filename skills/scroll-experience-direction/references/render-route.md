# Choosing the render route

Pick the cheapest route that does what the subject needs. A heavier route has to earn its
weight in the experience it creates, not in its novelty. Record the choice and the reason
in `plan.json` `acts[].route`.

## Decision tree

Ask these questions in order. The first "yes" decides the route.

1. **Does the subject need to rotate, respond to light, or show a changing shadow, in a
   way that materially improves understanding or desire?** Use **real 3D**. Typical cases:
   - a product with material depth (watch, sneaker, speaker, bottle)
   - an architectural mark
   - a sculpture that represents an abstract product
2. **Is there authored footage, or does the shot need continuous camera movement through
   a space that planes cannot fake?** Use **video scrub**.
3. **Does the subject transform in many discrete steps, such as assembly, exploded view,
   or a 360° turn shot from real photos?** Use an **image sequence** on a canvas.
4. **Is it a photographic scene with a subject, a ground and an environment?** Use
   **photographic compositing**: alpha planes in HTML/CSS. This is the default for most
   heroes.
5. **Is the content typographic or structural?** Use **CSS only**, with scroll-driven
   transforms and no media pipeline.

Mixing routes is normal. A composited hero, a 3D peak and a CSS close is a common shape.
Spend the heavy route on the peak.

## Photographic compositing

- Native `position: sticky` stages with independently transformed planes give real depth
  without WebGL. Plane rules are in `depth-and-states.md`.
- Sources:
  - authentic cutouts
  - user photography
  - Kie stills generated with their empty space planned, then cut out with
    `kie.mjs cutout` (Recraft background removal)
- A solid-colour plate (for example magenta) needs keying *and* spill removal. Prefer
  background removal on a neutral backdrop.
- Export WebP or AVIF at 1× and 2× through `<picture>`. Cutouts stay PNG or WebP with alpha.

## Real 3D

- **Inside React:** use R3F plus drei. Use `ScrollControls` or a ScrollTrigger-driven
  progress value (see `animation-recipe-library/references/cursor-text-3d-effects.md`,
  R3F recipes). **Outside React:** use vanilla Three.js with a ScrollTrigger `onUpdate`
  that feeds progress.
- **Model the actual object.** Use the user's GLB, USDZ or CAD file (convert STEP to GLB
  with their toolchain), or model the real mark from its vector logo by extruding the SVG.
  **A generic primitive standing in for the product is a fail.** If the real object cannot be
  modelled faithfully, switch to compositing.
- Optimise models with `gltf-transform` (Draco or Meshopt, KTX2 textures) when available.
  Budget: aim for a hero GLB under 2-3 MB. Treat that as a target to measure, not a promise.
- **Runtime rules:**
  - Pause the render loop when offscreen or when the tab is hidden.
  - Cap `devicePixelRatio` at 2 (1.5 on phones).
  - Never leave `preserveDrawingBuffer` on permanently; enable it only to capture posters.
  - Render exact desktop and phone **posters** from the final scene. They are the no-WebGL
    and reduced-motion fallback, and the LCP image.
  - Detect WebGL failure and swap to the poster. Test with WebGL disabled.
  - When computing custom progress, guard `elementHeight - viewportHeight === 0`. Dividing
    by it causes a one-pixel scene jump.
- Lighting is part of the direction. Name the key, fill and rim in the plan, the same way a
  generation preamble does.

## Video scrub

- Use authored or generated clips (Kie `shot`): one continuous camera move per clip.
- **Encoding for scrubbing.** Keyframes must be dense or seeking stutters:

```bash
# desktop 1080p
ffmpeg -i in.mp4 -an -c:v libx264 -preset slow -crf 20 -g 8 -keyint_min 8 -sc_threshold 0 \
  -pix_fmt yuv420p -vf "scale=1920:-2" -movflags +faststart act3-desktop.mp4
# phone 720p, portrait source
ffmpeg -i in-9x16.mp4 -an -c:v libx264 -preset slow -crf 24 -g 4 -keyint_min 4 -sc_threshold 0 \
  -pix_fmt yuv420p -vf "scale=720:-2" -movflags +faststart act3-phone.mp4
# poster = the clip's own first frame (never a separate generation)
ffmpeg -i act3-desktop.mp4 -frames:v 1 -q:v 2 act3-desktop-poster.jpg
```

- **Playhead:** never set `currentTime` straight from the scroll handler. Lerp toward the
  target in a single `requestAnimationFrame` loop (factor about 0.15-0.2), skip seeks below a
  small deadband, and coalesce seeks while one is still pending.
- **iOS:** use `muted playsinline preload="auto"`. Prime each clip with `play()` then `pause()`
  on first touch. Fetching the file as a Blob and setting it as `src` improves seek
  reliability; verify on a real device.
- **Chained clips:** lock the seams. Generate clip N+1 from clip N's *encoded* last frame,
  extracted from the mp4 and not from the source:
  `ffmpeg -sseof -0.1 -i act3-desktop.mp4 -frames:v 1 seam-3-4.png`.
  Kie first-and-last-frame mode can pin both ends; see `kie-ai.md`.
- Never use audio.

## Image sequence

- Draw frames to a `<canvas>` from a progress value. Pre-decode with `createImageBitmap`.
- **Preload budget:**
  - 60-120 frames on desktop and 40-60 on phones, as WebP. Say "needs measurement"
    before promising a total weight.
  - Load the first frame eagerly, the next ~10 % at high priority, and the rest when idle.
- Draw the nearest loaded frame while the rest are still loading. Never show a blank canvas.
- Phones get a separate portrait set; do not crop the desktop frames in the browser.

## CSS only

- Use `animation-timeline: scroll()` or `view()` with `animation-range` for reveals,
  progress and simple parallax. Wrap it in `@supports (animation-timeline: view())` and fall
  back to static layout or a small GSAP path.
- Use this route for the typographic grammars and for every act that needs no media
  timeline.
