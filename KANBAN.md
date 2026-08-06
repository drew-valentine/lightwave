# Lightwave — Project Kanban Board

A browser-playable puzzle game about the properties of light.

**Active branch:** `feature/light-puzzle-game` — complete, merging to `main` as `v0.1.0`
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
- [ ] **Hand-authored showcase levels for the tutorial arc** | Priority: P3 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Level editor (sandbox mode)** | Priority: P3 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Performance pass: beam propagation + render budget on large boards** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Deploy: static build + hosting** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Scale solvability harness toward the 1000-seed AC** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
  v0.1.0 ships 3 seeds × 40 levels, all passing. Widen seed coverage and wire it into CI.

---

## Done

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
