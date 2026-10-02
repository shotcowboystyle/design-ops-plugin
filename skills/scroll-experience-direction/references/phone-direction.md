# Phone direction

A phone is a different frame, not a smaller one. A 16:9 composition squeezed into 9:19.5
loses its subject, its empty space and its depth all at once. Plan the phone version in
stage 3, next to the desktop version. Store it in `plan.json` `acts[].phone`.

## Recompose, per act

For each act, decide all of these again:

| Decision              | Desktop habit               | Phone question                                                          |
| --------------------- | --------------------------- | ----------------------------------------------------------------------- |
| Crop                  | Wide, subject off-centre    | Which part of the subject survives a tall crop? Generate 9:16 if none does |
| Contact pivot         | Subject's base at the 92% mark | Does the anchor still sit on its support in the tall frame? Move the pivot |
| Type position         | Beside or behind the subject | Above or below. Type may sit over the subject on desktop and above it on phone |
| Layer order           | Foreground overtakes subject | Is the foreground now covering the face or label? Drop or re-cut it      |
| Plane count           | 4-5 planes                  | Usually 2-3. Fewer planes, clearer depth                                |
| Travel and duration   | Long pinned spans           | Shorter spans; thumbs scroll faster and further than wheels             |
| Controls              | Hover, side rails           | Bottom sheet, segmented control, large hit areas (44×44 CSS px minimum) |
| Signature move        | Pointer-driven              | Touch, tilt-free equivalent, or a direct control                        |

## Assets

- Use native portrait sources: generate 9:16 stills and clips with Kie (`--aspect 9:16`),
  or use the user's portrait photography. Do not crop desktop art in the browser.
- Serve them through `<picture>` with `media="(max-width: 700px)"` sources, plus separate phone
  video `src` and posters chosen at runtime by `matchMedia`.
- Image sequences get their own portrait frame set.

## Layout mechanics

- Use `100svh` (not `100vh`) for pinned stages, so the moving browser toolbar cannot cause
  layout jumps.
- **Sticky offsets:** when a sticky header exists, pinned stages need `top: <header height>`,
  or the header covers the top of every pinned frame.
- Reset desktop-only transforms at the phone breakpoint, for example `rotate: 0deg` and
  `scale: 1`.
- Step the hero type down below about 700px. Use `clamp()` from the type scale, with no
  orphaned single words.
- Horizontal pan sections become native `overflow-x` with `scroll-snap-type: x mandatory`.
  Do not scroll-jack them.
- When keyboard focus lands inside a horizontal rail, it must scroll that panel into view.
- In GSAP, put desktop and phone timelines in `gsap.matchMedia()` so each one cleans up
  after itself (see `animation-recipe-library/references/gsap-scrolltrigger-recipes.md`,
  the matchMedia recipe).
- Lenis: keep `syncTouch` off unless measured on a real device. Native touch momentum
  usually feels better.

## Verify

- Capture both 390×844 and 360×640; the compact size is where type collides.
- Check:
  - the contact anchor
  - type overlap with the subject
  - CTA reachability in the bottom third
  - horizontal overflow (the page must never scroll sideways)
- A real phone is not covered by headless capture. Say so in the report, and offer a LAN
  URL so the user can check it on their phone.
