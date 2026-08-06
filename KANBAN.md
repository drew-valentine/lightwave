# Lightwave — Project Kanban Board

A browser-playable puzzle game about the properties of light.

**Active branch:** none — `main` @ `v0.5.0` (last merge: `feature/radial-start-orientations`)
**Last updated:** 2026-08-05

---

## In Progress

_(empty — core game epic complete; next items pulled from Backlog after v0.1.0 lands)_

---

## In Review

_(empty)_

---

## Ready

_(empty)_

---

## Refinement

- [ ] **Mirrors & filters as new component types** | Priority: P1 | Created: 2026-08-05 | Owner: unassigned
  Mirrors reflect at 45°/90°; filters subtract channels (the subtractive counterpart to condensers). Needs generator support so levels stay solvable-by-construction.
  *Open questions: do filters make prisms redundant? Does the mirror change the beam-cycle model?*

- [ ] **Level sharing via seed** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
  Shareable URL encodes the generator seed + difficulty tier so a link reproduces an exact board. Seeds are already deterministic in `js/rng.js` / `js/gen.js`, so this is encode/decode + routing only.
  *Open question: seed-only, or full board serialization for hand-authored levels?*

---

## Backlog

- [ ] **Sound design: ambient hum, beam tones per color, completion chime** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Mobile touch polish: tap-to-rotate, larger hit targets, responsive board sizing** | Priority: P1 | Created: 2026-08-05 | Owner: unassigned
  *Note: v0.1.0 ships basic pointer events only; mobile viewport renders correctly but touch ergonomics are unpolished.*
- [ ] **Hint system: reveal one correct component placement** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
  *Note: v0.1.0 HUD shows static per-level hint text only — no solver-driven reveal.*
- [ ] **Undo: step back one placement/rotation (currently reset-only)** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Move counter + par score per level** | Priority: P3 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Accessibility: colorblind-safe mode (shape/pattern encoding alongside hue), keyboard control, reduced-motion** | Priority: P1 | Created: 2026-08-05 | Owner: unassigned
  *Partially addressed by UX-1 (v0.3.0): hover color labels name the color of any emitter or goal well, so hue is no longer the only channel on hover. Still open: persistent per-color shape/pattern encoding that does not require hovering, keyboard control, and reduced-motion support.*
- [ ] **Hand-authored showcase levels for the tutorial arc** | Priority: P3 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Level editor (sandbox mode)** | Priority: P3 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Performance pass: beam propagation + render budget on large boards** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Deploy: static build + hosting** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Scale solvability harness toward the 1000-seed AC** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
  v0.2.0 ships 10 seeds × 60 levels (600 levels), all passing. Widen seed coverage further and wire it into CI.

---

## Done

### v0.5.0 — Radial starting orientations

- [x] **UX-3 — Rotatable pieces start aimed radially outward from board center** | Priority: P1 | S | Requested: 2026-08-05 (player) | Completed: 2026-08-05 | Owner: @claude | Branch: `feature/radial-start-orientations` → `main` @ `v0.5.0`
  Every rotatable component — emitters, condensers, prisms — now begins each level pointing radially outward from the center of the board, so a fresh level opens as a calm, uncluttered starburst instead of a tangle of random angles.

  **Details:**
  - Applies to all rotatable component types; non-rotatable pieces are unaffected.
  - The never-starts-solved guarantee is unchanged: the radial orientation is simulation-checked, and an escalating-jitter fallback nudges pieces off radial only if a board would otherwise open solved.
  - That fallback never fired across a 200-level sweep — radial is compatible with unsolved starts in practice.

  **Verified:**
  - 200-level sweep — zero pre-solved boards, zero fallbacks.
  - Solvability harness still green.
  - Browser screenshot verified; zero console errors.

### v0.4.0 — Level selector

- [x] **UX-2 — Level selector dialog from the level badge** | Priority: P1 | M | Requested: 2026-08-05 (player) | Completed: 2026-08-05 | Owner: @claude | Branch: `feature/level-selector` → `main` @ `v0.4.0`
  The top-right level badge is now a button. Pressing it opens a dialog overlay showing a roman-numeral grid of every unlocked level, with the current level highlighted; picking a cell jumps straight to that level.

  **Details:**
  - Highest level reached is tracked in `localStorage` as `lw_max`, and is preserved when replaying earlier levels — so unlocks never regress.
  - Dismiss via Esc or click-outside; focus moves into the dialog on open and returns to the badge on close.
  - ARIA dialog semantics on the overlay.

  **Verified:**
  - Playwright flow test — 9 checks: open, cell count, current-level highlight, jump, close, max preservation, reopen, escape.
  - Zero console errors.
  - Solvability harness still green.

### v0.3.0 — Hover color labels

- [x] **UX-1 — Hover color labels on emitters and goal wells** | Priority: P1 | S | Requested: 2026-08-05 (player) | Completed: 2026-08-05 | Owner: @claude | Branch: `feature/hover-color-labels` → `main` @ `v0.3.0`
  Player feedback: colors were hard to tell apart, especially the secondaries. Hovering any emitter or goal well now fades in a subtle letterspaced caption naming its color, drawn in that component's own hue so the label and the light read as one.

  **Verified:**
  - Playwright hover test — labels appear on emitters and goal wells with the correct color name.
  - Zero console errors.
  - Solvability harness still green.

  *Partially addresses the Accessibility item in Backlog (colorblind support); the full item — per-color shape/pattern encoding, keyboard control, reduced-motion — stays open.*

### v0.2.0 — Machinery-required goals

- [x] **BUG-1 — Condensers/prisms bypassable by aiming emitters directly at goals** | Priority: P0 | M | Reported: 2026-08-05 (player) | Completed: 2026-08-05 | Owner: @claude | Branch: `fix/machinery-required-goals` → `main` @ `v0.2.0`
  Players could skip the intended puzzle entirely by pointing an emitter straight at a goal, making condensers and prisms decorative rather than necessary.

  **Fix:**
  - Wells now accept exactly one beam — a second incoming beam is an overload, not a merge, so beams can no longer be casually stacked into a goal.
  - The generator guarantees every machinery-fed goal wears a color that no emitter on the board emits, so reaching it *provably* requires a prism or condenser. Solvable-by-construction still holds.

  **Verified:**
  - 600-level generator sweep — 10 seeds × 60 levels, zero failures and zero fallbacks.
  - Full browser regression — 29/29 checks passing, plus targeted level 5–7 machinery checks confirming direct-aim no longer solves.

### EPIC: Core Game — Additive Light Puzzle | Priority: P0 | Started: 2026-08-05 | Completed: 2026-08-05 | Owner: @claude | Branch: `feature/light-puzzle-game` → `main` @ `v0.1.0`

Playable end-to-end game: place/rotate components, route colored beams, satisfy every goal. Levels are generated, always solvable, never pre-solved, and get harder as you go.

**Definition of done — met:** fresh browser load plays level 1 onward with no dead-ends, no unsolvable boards, and no level that starts already solved. Verified by the Node solvability harness (3 seeds × 40 levels, 100% pass) and browser E2E via Playwright (29/29 checks, zero console errors, mobile viewport renders correctly).

- [x] **CG-1 — Color model & additive mixing** | S | Completed: 2026-08-05 | Owner: @claude
  R/G/B primaries as a 3-bit mask; C/M/Y as pairs; W as all three. `js/color.js`.

- [x] **CG-2 — Grid, beam propagation & raycasting** | M | Completed: 2026-08-05 | Owner: @claude
  Fixed-point additive light simulation with interception; deterministic re-solve on every board change, cycle-safe termination. `js/engine.js`.

- [x] **CG-3 — Emitter component** | S | Completed: 2026-08-05 | Owner: @claude

- [x] **CG-4 — Condenser component** | M | Completed: 2026-08-05 | Owner: @claude
  Multiple inputs → one additively combined output beam.

- [x] **CG-5 — Prism component** | M | Completed: 2026-08-05 | Owner: @claude
  Splits an incoming beam into primary components along separate output directions.

- [x] **CG-6 — Goal component & win detection** | S | Completed: 2026-08-05 | Owner: @claude
  Exact-match color acceptance (superset does not satisfy); all goals satisfied → level complete.

- [x] **CG-7 — Procedural level generator (solvable by construction)** | XL | Completed: 2026-08-05 | Owner: @claude
  Builds solution graphs backwards from goals, embeds via phyllotaxis, verifies solvability against the engine, then applies verified-unsolved scrambles. Deterministic per seed; all generated levels distinct. `js/gen.js`, `js/rng.js`.

- [x] **CG-8 — Difficulty curve & progressive disclosure** | M | Completed: 2026-08-05 | Owner: @claude
  Levels 1–4 templates introduce one component type at a time, then compose.

- [x] **CG-9 — Canvas renderer: glowing beams** | L | Completed: 2026-08-05 | Owner: @claude
  Additive-blend glow with brightness polish; beams read as light on a dark field. `js/render.js`.

- [x] **CG-10 — Phyllotaxis / golden-ratio layout & visual system** | L | Completed: 2026-08-05 | Owner: @claude
  Phyllotaxis component embedding plus matching UI spacing and typography. `css/style.css`.

- [x] **CG-11 — Player interaction (place, rotate, reset)** | M | Completed: 2026-08-05 | Owner: @claude
  Pointer-event place/rotate plus HUD reset. *Undo split out to Backlog; touch polish split out to Backlog.*

- [x] **CG-12 — Level flow & progression shell** | M | Completed: 2026-08-05 | Owner: @claude
  Level complete → transition → next level; progress persisted to `localStorage`. HUD ships goal chips, per-level hint text, component legend, and reset. `js/main.js`.

- [x] **CG-13 — Generator + solver test suite** | M | Completed: 2026-08-05 | Owner: @claude
  Node harness over 3 seeds × 40 levels asserting solvability, non-pre-solved, distinctness, and determinism — all passing. `test/solvability.js`. *Widening to the 1000-seed AC tracked in Backlog.*

---

## Blockers

_None currently._

---

## Conventions

- **Priority:** P0 critical · P1 high · P2 medium · P3 low
- **Complexity:** S · M · L · XL
- **Branching:** all work on a feature branch; merge to `main` + semantic version tag when complete and stable.

---

## Release log

- **v0.1.0** — 2026-08-05 — Core Game epic (CG-1 … CG-13) from `feature/light-puzzle-game`.
- **v0.2.0** — 2026-08-05 — BUG-1: single-beam wells + machinery-required goal colors, making prisms/condensers provably necessary. From `fix/machinery-required-goals`.
- **v0.3.0** — 2026-08-05 — UX-1: hover color labels on emitters and goal wells, addressing color-distinguishability feedback. From `feature/hover-color-labels`.
- **v0.4.0** — 2026-08-05 — UX-2: level selector dialog behind the level badge — roman-numeral grid of unlocked levels, `lw_max` persistence, Esc/click-outside close, focus management, ARIA dialog semantics. From `feature/level-selector`.
- **v0.5.0** — 2026-08-05 — UX-3: radial starting orientations for all rotatable pieces (emitters/condensers/prisms), giving each level a calm starburst opening; never-starts-solved guarantee preserved via simulation check + escalating-jitter fallback. From `feature/radial-start-orientations`.
