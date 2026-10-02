# Depth planes, contact anchors, and act states

A flat hero with a slow zoom reads as a stock template. Depth comes from **independent
planes** moving at different rates, a **subject that rests on something**, and
**states that change meaning** as the visitor scrolls. Plan all three on paper before
generating a single asset, because the assets are cut to fit the plan.

## 1. The layer contract

Write this table for every layered scene, inside `plan.json` under
`acts[].layers`. Use only the planes the scene needs. Several elements that move together
count as **one** plane.

| Plane            | Typical asset                                     | Relative motion                 | Rule                                                             |
| ---------------- | ------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| Far              | Clean background plate (sky, wall, horizon)       | Smallest                        | Must not contain the focal subject; plates are generated *empty* |
| Mid              | Architecture, landscape, a table, a product shelf | Moderate                        | Establishes scale and the ground the subject stands on           |
| Focal subject    | Authentic product cutout, person, or 3D object    | Deliberate travel or rotation   | Stays on its contact anchor while grounded                       |
| Near foreground  | Framing cutout: foliage, a doorframe, a hand      | Strongest, but restrained       | Frames the subject; never covers the headline or primary action  |
| Atmosphere       | Light shafts, haze, dust, grain                   | Slow, on its own clock          | Separates planes without washing them out                        |
| Type and controls | Semantic HTML                                    | Stable, or staged in and out    | Stays readable at every sampled frame                            |

**Plate hygiene:**
- Generate the far and mid plates with the subject absent. A clean plate behind a cutout of
  the same subject leaves a ghost duplicate as soon as the layers separate.
- Every cutout must be solid below its silhouette.
- Fade each section's floor over 200-300px so plane edges never show.
- Check cutout edges over both a light and a dark background. Halos and magenta spill are
  defects.

## 2. Contact anchors

A **contact anchor** is the physical point where the subject meets what supports it, for
example:
- the wheel and the road
- the bottle and the plinth
- the climber's boots and the rock
- the phone and the hand

When layers move at different rates, anything resting on something else will drift off it
unless that contact is planned.

- **Group what is physically connected.** The subject and its contact shadow, the vase and its
  reflection, a window frame and the landscape seen through it. A group moves as one plane.
- **Pivot at the contact point.** When the subject scales or rotates, set `transform-origin`
  (or the 3D pivot) at the anchor, not at the image centre. Then a scale change grows the
  subject *up from its base* instead of lifting it off.
- **Share translation, vary scale.** The support and the subject can scale at different
  rates if they share a translation and a contact pivot. That reads as depth without floating.
- **Record it.** `acts[].layers[].anchor` names what the subject rests on and the pivot in
  plane coordinates, for example `"anchor": {"on": "plinth-top", "pivot": "50% 92%"}`.
  Phones may move the pivot (see `phone-direction.md`).

**Floating test:** at the midpoint frame, is any grounded subject's base visibly off its
support, or casting a shadow that does not touch it? If yes, it fails.

## 3. Opening, midpoint, exit

Every act gets three sentences, written in plain language before any build work:

```json
"states": {
  "opening": "The bottle stands alone on a dark plinth; the room is invisible.",
  "midpoint": "Light finds the room: shelves of raw botanicals appear behind it, far plane drifting slower.",
  "exit": "The camera has passed the bottle; the shelf is now foreground framing the next act's headline."
}
```

Rules:
- **Scrolling must change the meaning, not just the position.** Examples: outside becomes
  inside, scattered becomes ordered, a near detail passes the viewer, one becomes many, the
  object reveals what it is for. "It moves up" is not a state change.
- **The opening is compelling before any scroll.** The first frame is a finished
  composition. Never show half-loaded planes waiting for input.
- **The exit hands off.** The exit frame of one act should set up the opening of the next,
  through a shared colour, a shared object, or a plane that becomes the next background.
- **The final act holds.** The closing state resolves and stays. It does not fade to empty.
- These three sentences are what verification checks. Frames captured at each state are
  compared against them (see `verify-and-package.md`).

## 4. Parallax numbers

- **Separation:** adjacent planes differ by 10-30% in rate.
  - A workable starting point: far moves at about 0.7× scroll, mid 0.83×, focal 0.8×,
    foreground and type at 1×. Then tune by eye on the captured frames.
- **Ordering:** place the focal subject between mid and foreground in z-order so that the
  foreground *overtakes* it. Cut the foreground so it dips where the subject is, and never
  crosses the subject's face or label.
- **Implementation:** with GSAP use `yPercent` / `y` tweens on a `scrub` ScrollTrigger per plane
  (see `animation-recipe-library/references/gsap-scrolltrigger-recipes.md`, the parallax
  recipe). With CSS, use `animation-timeline: view()` on transforms.
- **Plane CSS:**
  - Planes are `position: absolute` inside a `position: sticky` stage, with `max-width: none`
    and `will-change: transform` only while the stage is active.
  - Never put `transition: transform` on a scrubbed plane; it fights the scrub.
  - Animate only `transform` and `opacity`, never layout properties.
- **Cache busting:** new art gets a new filename. Never overwrite a plane image in place,
  because a cached old plane with a new one beside it shows a mismatched seam.
- **Restraint:** use at most two embodiment effects per page, such as pointer tilt or a
  magnetic CTA. Gate pointer effects behind `(hover: hover) and (pointer: fine)`.
