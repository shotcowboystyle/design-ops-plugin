# Interview and subject truth

The direction for every site comes from three places: what the user wants, what is true
about the subject, and what is excellent in the live world right now. This file covers the
first two. Sourcing (the third) runs through `/inspo` and is covered in the stage 2 notes
at the end of this file.

There is deliberately no list of approved sites and no stock aesthetic worlds. A
pre-approved canon makes every build drift toward the same ten pages. The interview and
the subject replace it.

## 1. Creative authority

Decide who holds the pen before asking anything else.

- **Delegated.** The user says something like "your call" or "surprise me", or asks for
  a concept with no client. Write the brief yourself, and mark its first line
  `Self-authored under explicit creative delegation`. Still run the subject-truth pass.
  Delegation covers taste, not facts.
- **Shared** (the default). Run the interview below.
- **Locked.** A brand book, an existing `style.json`, or an approved board already decides
  most of the direction. Ask only what they leave open. Their hard rules beat anything in
  this skill.

## 2. The interview

Ask everything in **one message**. Seed it with what design memory already holds
(`brief.json`, `style.json`, `refs/board.json`), and show those values as defaults to
confirm instead of asking again. Use the user's own words in the brief, verbatim.

1. **What is it, and who is it for?** Name the visitor in one sentence.
2. **What must they believe by the end?** One sentence. This is the argument the scroll makes.
3. **The one next action.** One verb phrase. It becomes the only CTA label on the site.
4. **The vibe in 3-5 words**, plus up to three references from any medium: a film, a
   record sleeve, a building, a shop. Don't ask for "sites you like". That is what
   sourcing is for, and asking for them here anchors the design to a copy.
5. **The journey in their words.** Where does the visitor start, and where do they arrive?
6. **The energy curve.** Slow build, or a jolt then calm? Where is the one moment they
   should remember?
7. **The thing no other site does.** This is the seed of the signature move. "I don't
   know" is an acceptable answer, and it means you propose three options at plan time.
8. **Distance from premium-minimal.** On a 1-5 scale, from "quiet and expensive" to
   "loud and maximal".
9. **One world or distinct scenes?** Is it one continuous space the camera moves through,
   or a sequence of separate tableaux?
10. **What assets exist?** Logo files, product photos, packshots, 3D files (GLB, USDZ,
    STEP), footage, brand book, fonts, licensed photography.

Write `.design-ops/scroll/brief.md`:

```markdown
# <Name> — scroll brief
Authority: shared | delegated (self-authored) | locked by <source>
## Verbatim answers
1. …
## Belief at exit
## Next action label: "<label>"
## Feeling curve
act-level words, one per beat, with the PEAK marked
## It's the site where ___
(an experience, not a device: "you walk the factory floor", not "parallax hero")
## Intended silence
(where nothing moves, on purpose)
```

**Gate:** the user approves the brief, or authority is delegated. Do not move on with
"probably fine".

## 3. Subject truth

Before any imagery is planned, find out what is real.

**Existing product, company or person:**

1. Open the official site and docs live, this session. Record:
   - the audience
   - the offer
   - the platforms
   - real destinations (store, app, booking, docs URLs)
   - pricing only if it is published
2. List what you **could not verify**. Those items stay out of the copy, or appear only as
   something the user must confirm.
3. Note the brand's own visual truths: logo lockups, the product's real colours and
   materials, packaging, typography if it is identifiable, and photography style.

**Invented or pre-launch brand:**

- The flow must be honest about its state: a waitlist, launch interest, a concept tour.
- Use no counters, no "trusted by", and no testimonials, because none exist yet.

**Writing rule for both cases:** numbers on the page are either sourced or absent.
Counters and stat blocks are allowed only for verified figures. Put the source next to
each figure in `subject.md`.

Write `.design-ops/scroll/subject.md` in this shape: `Sources opened`, `Facts (with source)`,
`Unverified (do not state)`, `Brand truths`, `Real destinations`.

## 4. Asset provenance

**Open every asset; filenames are not proof.** An icon called `app-logo.png` may depict a
different product. A "transparent" PNG may have a white matte. A packshot may show last
year's label. Look at each file, and write down what it actually shows.

Record every asset in `.design-ops/scroll/assets.json`:

```json
{
  "$design_ops": "1",
  "assets": [
    {
      "id": "hero-product",
      "path": ".design-ops/scroll/assets/hero-product.png",
      "provenance": "authentic | user | generated",
      "source": "brand kit v3 / user upload / kie:seedream/5-pro-image-to-image",
      "shows": "what the file actually depicts, after opening it",
      "alpha": "none | clean | needs-cutout",
      "license": "owned | client-supplied | generated | <license name>",
      "refs": ["hero-product-source.jpg"],
      "taskId": null,
      "plane": "focal",
      "usedIn": ["act-1", "act-4"]
    }
  ]
}
```

- **authentic**: the brand's own files. These are always preferred for the product, the logo
  and the packaging.
- **user**: the user's own photography and footage. Building from it is a first-class route,
  not a fallback. Flat footage gets graded with ffmpeg into an intermediate file; never fix
  it with a CSS filter.
- **generated**: made with Kie or another generator. Allowed for environments,
  atmosphere, foreground framing and staging. Allowed for the product itself only as an
  image-to-image edit that passes the authentic asset in as a reference.

**Gate:** every planned plane has an asset or a generation plan, and every authentic asset
has been opened and described.

## 5. Stage 2 — sourcing for this subject

Run `/inspo`, or hand it to the `scout` agent, with the route derived from the subject and
not from habit:

- **Tags.** Take sector tags from `reference-intelligence/references/awwwards-adapter.md`,
  then add the technique tags the plan is leaning toward: `scrolling`, `parallax`,
  `storytelling`, `3d`, `webgl`, `three-js`, `gsap`. Use 1-2 sector tags and 1-2 technique
  tags.
- **The interview's non-web references** (a film, a building) are not captured. Write one
  line on what to take from each.
- **Capture** each kept reference with `capture.mjs --frames`, so each one has entry,
  midpoint and exit frames for every tall section, and not just four scroll steps.

Then write `.design-ops/scroll/sourcing.md`. Give each kept reference three lines:

```
<site> — <url>
Observed: what physically happens between entry, midpoint and exit (cite frames)
Why it works: the perceptual or narrative reason
Principle to adapt: the transferable idea, phrased so it does NOT name their layout
```

A list of URLs is not evidence. A reference with no observed behaviour gets dropped. The
board's one-trait-per-reference rule and its clone check still apply.
