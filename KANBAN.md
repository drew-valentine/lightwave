# Lightwave — Project Kanban Board

A browser-playable puzzle game about the properties of light.

**Active branch:** `feature/light-puzzle-game`
**Last updated:** 2026-08-05

---

## In Progress

### EPIC: Core Game — Additive Light Puzzle | Priority: P0 | Started: 2026-08-05 | Owner: @claude | Branch: `feature/light-puzzle-game`

Playable end-to-end game: place/rotate components, route colored beams, satisfy every goal. Levels are generated, always solvable, never pre-solved, and get harder as you go.

**Definition of done:** Given a fresh browser load, when the player completes level 1, then levels advance continuously with no dead-ends, no unsolvable boards, and no level that starts already solved.

- [ ] **CG-1 — Color model & additive mixing** | S | Owner: @claude
  R/G/B primaries as a 3-bit mask; C/M/Y as pairs; W as all three. Union = mix, subset = split.
  *AC: Given any two beam colors, when combined, then the result is their bitwise union (R+G→Y, R+G+B→W).*

- [ ] **CG-2 — Grid, beam propagation & raycasting** | M | Owner: @claude | Depends: CG-1
  Beams travel in straight lines until they hit a component or the board edge. Deterministic re-solve on every board change; cycle-safe.
  *AC: Given a board mutation, when propagation runs, then it terminates with a stable beam set even if beams form a loop.*

- [ ] **CG-3 — Emitter component** | S | Owner: @claude | Depends: CG-2
  Emits one directional beam of a fixed spectrum color.

- [ ] **CG-4 — Condenser component** | M | Owner: @claude | Depends: CG-1, CG-2
  Accepts multiple input beams, emits one beam of the additive-combined color.

- [ ] **CG-5 — Prism component** | M | Owner: @claude | Depends: CG-1, CG-2
  Splits an incoming beam into its constituent primary components along separate output directions.

- [ ] **CG-6 — Goal component & win detection** | S | Owner: @claude | Depends: CG-2
  Each goal accepts exactly one color. All goals satisfied → level complete.
  *AC: Given a goal expecting M, when it receives W, then it is NOT satisfied (exact match, not superset).*

- [ ] **CG-7 — Procedural level generator (solvable by construction)** | XL | Owner: @claude | Depends: CG-3..CG-6
  Build backwards from a solved state, then scramble. Guarantees: solvable, not pre-solved, unique per seed, difficulty scales with component count//depth.
  *AC: Given 1000 generated seeds, when each is checked, then 100% are solvable and 0% start solved.*

- [ ] **CG-8 — Difficulty curve & progressive disclosure** | M | Owner: @claude | Depends: CG-7
  First levels introduce one component type at a time (emitter → goal → condenser → prism), then compose.

- [ ] **CG-9 — Canvas renderer: glowing beams** | L | Owner: @claude | Depends: CG-2
  Additive-blend glow, bloom falloff, beams read as light rather than lines. Dark field, high contrast.

- [ ] **CG-10 — Phyllotaxis / golden-ratio layout & visual system** | L | Owner: @claude | Depends: CG-9
  Component placement and UI spacing on φ / Fibonacci intervals. Typography and chrome to match.

- [ ] **CG-11 — Player interaction (place, rotate, reset)** | M | Owner: @claude | Depends: CG-3..CG-6
  Click/drag to place, rotate to aim, undo and reset level.

- [ ] **CG-12 — Level flow & progression shell** | M | Owner: @claude | Depends: CG-7, CG-11
  Level complete → transition → next level. Progress persisted to localStorage.

- [ ] **CG-13 — Generator + solver test suite** | M | Owner: @claude | Depends: CG-7
  Property tests over many seeds for solvability, non-pre-solved, and determinism.

---

## In Review

_(empty)_

---

## Ready

_(empty — next items pulled from Backlog after core game lands)_

---

## Refinement

- [ ] **Mirrors & filters as new component types** | Priority: P1 | Created: 2026-08-05 | Owner: unassigned
  Mirrors reflect at 45°/90°; filters subtract channels (the subtractive counterpart to condensers). Needs generator support so levels stay solvable-by-construction.
  *Open questions: do filters make prisms redundant? Does the mirror change the beam-cycle model?*

- [ ] **Level sharing via seed** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
  Shareable URL encodes the generator seed + difficulty tier so a link reproduces an exact board.
  *Open question: seed-only, or full board serialization for hand-authored levels?*

---

## Backlog

- [ ] **Sound design: ambient hum, beam tones per color, completion chime** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Mobile touch polish: tap-to-rotate, larger hit targets, responsive board sizing** | Priority: P1 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Hint system: reveal one correct component placement** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Move counter + par score per level** | Priority: P3 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Accessibility: colorblind-safe mode (shape/pattern encoding alongside hue), keyboard control, reduced-motion** | Priority: P1 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Hand-authored showcase levels for the tutorial arc** | Priority: P3 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Level editor (sandbox mode)** | Priority: P3 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Performance pass: beam propagation + render budget on large boards** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Deploy: static build + hosting** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned

---

## Done

_(empty)_

---

## Blockers

_None currently._

---

## Conventions

- **Priority:** P0 critical · P1 high · P2 medium · P3 low
- **Complexity:** S · M · L · XL
- **Branching:** all work on a feature branch; merge to `main` + semantic version tag when complete and stable.
