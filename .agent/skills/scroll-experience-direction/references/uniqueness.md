# Uniqueness — every site is its own species

Premium scroll sites tend to converge: a dark hero, a pinned product, three feature cards,
a horizontal gallery, a footer. Convergence comes from defaults. This file replaces the
defaults with a few explicit choices:

- a **grammar**
- an **information order**
- **controls tied to the offer**
- a **signature move**
- an **ending**

Then it gates the result against every earlier build.

## 1. Feeling curve first

Write the curve before choosing any device. In `plan.json` under `curve`, give each beat
one word (*held, curious, tense, released, sure*), and mark exactly **one** `PEAK`.

- Two adjacent acts with the same feeling means one of them is filler. Cut it or change it.
- The peak gets the largest scroll span, the heaviest render route, and the biggest share
  of the asset budget, with a quieter act just before it.
- **"It's the site where ___"** must describe an experience, not a device. "You stand inside
  the speaker cone" passes. "Has a 3D speaker" fails.

## 2. Beats and information order

There are 4-7 beats. Typical roles are recognition, tension, turn, substance, range and
commitment, but the order is decided by **what this visitor needs to believe, in what
order**, not by a page template.

- A skeptical buyer of a technical product needs **proof** early: substance comes before range.
- A mood-led consumer product earns **desire** before detail: range comes before substance.
- Something that has to be tried, like a tool, a configurator or a menu, needs a
  **working surface** early: a control comes before the explanation.

Write the order and a one-line reason for it in `plan.json` `informationOrder`. Every
section has to serve a beat; a section that serves no beat is cut.

**Score table** (in `plan.json` `score`): beat | device | why this device carries this
beat. Pre-build checks:

- use 4 or more device families
- never use the same family in two adjacent acts
- use at most 2 scrubs
- the peak has the largest span
- avoid a uniform rhythm where every act is the same height

## 3. Grammars

A grammar is a coherent set of decisions about **navigation, the hero, the information
order and the close**, plus what it **bans**. The bans matter more than anything else,
because they are what keep the site from sliding back to the default. The eight below are
a starting vocabulary, not a menu of templates. Inventing a ninth for the subject is
encouraged; write down its nav, hero, order, close and bans the same way.

| Grammar | Navigation | Hero | Information order | Close | Bans |
| --- | --- | --- | --- | --- | --- |
| **Single take** | Near-invisible bar; progress shown by the scene itself | Establishing shot of one continuous space | The camera's path *is* the argument | Arrival: the CTA is an object in the scene | Hard cuts, card grids, section headers |
| **Editorial chapters** | Folio in the margin: chapter names, current one marked | A title page, type-led | Thesis → evidence chapters → colophon | Colophon; the CTA set as running text | Video scrub, pointer effects, centered everything |
| **Working surface** | The product's real chrome is the navigation | The product UI already mid-task | Try → understand → trust | A real input that works (no fake form) | Cinematic scrub, kinetic type, stock imagery |
| **Spatial map** | A clickable map or plan of the world | Position marker on the map | Places, visited in any order; scroll is one tour | Arrival at the destination; CTA is that place | Numbered chapters, linear-only progress |
| **Typographic poster** | The wordmark at composition scale, or no nav | One word at extreme scale | Statement → qualification → proof, all type-led | The smallest type on the page | Photographic hero, video, gradients |
| **Specimen catalog** | Jumpable index of objects | Object one, already labelled like a specimen | Object by object; each is complete | Last specimen, or an inquiry styled as a label | Long pinned scrubs, marketing superlatives |
| **Split stage** | The divider itself is the chrome | Two halves in tension (before/after, them/us, raw/made) | Argument and counter-argument alternate | The divider collapses toward the winner | Full-bleed media, centred single column |
| **Cut rhythm** | Loud, fixed, always present | Cut in within one viewport | Short, punchy acts on a beat | Abrupt full-bleed CTA | Pinning, any act over ~1.4 viewports, slow fades |

Rules:

- **Explain the choice.** Write in `plan.json` `grammar.whyOthersLost` why each other
  grammar lost, one line each. If Single take is chosen, it must beat all seven others
  explicitly, because it is the most over-used grammar.
- **Move the peak, not the ban.** When a grammar bans the device the peak wants, move the
  peak out of the act stack (into the close, or into a control) instead of breaking the ban.

## 4. Useful controls

Controls belong to the offer and are not decoration. The visitor's selection should carry
**through** to the close instead of resetting there. Examples:

- A finish picker whose choice appears on the product in the final act, and gets pre-filled
  into the inquiry.
- A route planner whose result becomes the downloadable itinerary at the end.
- A "build your kit" tray that becomes the order summary.
- A comparison slider whose final position is quoted back in the CTA copy.

Every control is keyboard operable, labelled, and has every state styled. A control that
changes nothing downstream is cut.

## 5. The signature move

This is one bespoke interaction written in page JS for this site only. Changing a
parameter on a library recipe does not count.

- Seed it from interview answer 7 ("the thing no other site does"). If that answer was
  blank, propose three and let the user pick.
- **Test:** describe the move in one sentence to someone who has seen the earlier builds.
  If they would say "like the last one", it fails.
- It gets a reduced-motion form, usually a still image or a direct control.

## 6. Endings

The close **resolves and holds**. It is the exit state of the whole film, and it carries
anything the visitor chose. It never fades to empty, and it is never just a footer. The
footer goes after the close.

## 7. Fingerprint gate

The registry is global, so uniqueness holds across projects:
`${DESIGN_OPS_HOME:-~/.design-ops}/fingerprints.ndjson`. It is append-only, with one row per
shipped site:

```json
{"ts":"2026-10-02T12:00:00Z","project":"/abs/path/or/name","site":"Aster Gin","grammar":"specimen-catalog","nav":"jump-index","hero":"labelled-cutout-on-plinth","actShape":"pin>parallax>flow>sequence>pin","close":"label-styled-inquiry","signature":"botanical tray fills the bottle as you scroll","route":"composite+sequence","phone":"index becomes bottom sheet"}
```

**Gate:**
- Before plan approval, compare the plan against **every** row.
- The six gated dimensions are `grammar`, `nav`, `hero`, `actShape`, `close` and
  `signature`. The plan must differ on **at least 4 of 6** from each row.
- Report the result per row: `vs Aster Gin: 5/6 differ — pass`.
- If a row fails, change the plan. Never edit or delete rows. The log is the memory.
- If the registry doesn't exist yet, the gate passes; say so.
- Also run the board's clone check (`reference-intelligence/references/board-synthesis.md`).
  A plan recognisable as one reference fails even when it passes the registry gate.

Append the row in stage 7 only, after the site ships. Plans that never ship don't
consume fingerprints.
