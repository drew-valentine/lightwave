# Lightwave — Project Kanban Board

A browser-playable puzzle game about the properties of light.

**Active branch:** none — `main` @ `v0.7.0` (last merge: `feature/win-affirmations`)
**Live site:** https://drew-valentine.github.io/lightwave/ — GitHub Pages, deployed from `main` by the **legacy branch builder** (source: `main` @ `/`, with `.nojekyll` bypassing Jekyll), with builds **requested via the Pages API** by `.github/workflows/request-pages-build.yml` on every push to `main`. Push-triggered builds fail server-side for this repo; API-requested builds succeed. The `.github/workflows/pages.yml` Actions workflow is retained as a `workflow_dispatch`-only manual fallback — see OPS-4.
**⚠ `main` is production:** every push to `main` auto-deploys to the live site. Feature-branch-then-merge is now a release gate, not just hygiene.
**Last updated:** 2026-08-06

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
- [ ] **Hint system: reveal one correct component placement** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
  *Note: v0.1.0 HUD shows static per-level hint text only — no solver-driven reveal.*
- [ ] **Undo: step back one placement/rotation (currently reset-only)** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Move counter + par score per level** | Priority: P3 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Accessibility: colorblind-safe mode (shape/pattern encoding alongside hue), keyboard control, reduced-motion** | Priority: P1 | Created: 2026-08-05 | Owner: unassigned
  *Partially addressed by UX-1 (v0.3.0) and UX-4 (v0.6.0): color labels name the color of any emitter or goal well — on hover with a mouse, on tap with touch — so hue is no longer the only channel. Still open: persistent per-color shape/pattern encoding that requires no interaction at all, keyboard control, and reduced-motion support.*
- [ ] **Hand-authored showcase levels for the tutorial arc** | Priority: P3 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Level editor (sandbox mode)** | Priority: P3 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Performance pass: beam propagation + render budget on large boards** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
- [ ] **Scale solvability harness toward the 1000-seed AC** | Priority: P2 | Created: 2026-08-05 | Owner: unassigned
  v0.2.0 ships 10 seeds × 60 levels (600 levels), all passing. Widen seed coverage further and wire it into CI.

---

## Done

### OPS — Live deployment

- [x] **OPS-1 — Deploy: static build + hosting** | Priority: P2 | S | Created: 2026-08-05 | Completed: 2026-08-05 | Owner: @claude
  The game is live: **https://drew-valentine.github.io/lightwave/**

  **Details:**
  - Hosted on GitHub Pages from the public repo `drew-valentine/lightwave`.
  - Pages serves the `main` branch at repo root — no build step, the static site *is* the repo.
  - Legacy branch build retained.

  **Verified:**
  - Live site loaded and played via Playwright against the public URL; zero console errors.

  **Operational note (updated by OPS-2):** `main` is production. Every push to `main` triggers the `.github/workflows/pages.yml` GitHub Actions workflow, which deploys the repo root to Pages — merges are user-visible immediately, with no separate release step gating them. **If the live site looks stale, check the repo's Actions tab first:** a failed or skipped workflow run means production is still serving the previous commit.

- [x] **OPS-2 — Migrate GitHub Pages deploys from the legacy Jekyll builder to GitHub Actions** | Priority: P0 | S | Created: 2026-08-06 | Completed: 2026-08-06 | Owner: @claude
  **⚠ Superseded by OPS-3.** The Actions migration below did not hold: the Pages site record itself was corrupted, and deploys through the Actions source kept going inactive. Final state is the legacy branch builder with `.nojekyll`. Retained here as the history of how the outage was diagnosed.

  The legacy Pages Jekyll builder began failing silently on the `v0.6.0` push — no error surfaced, but the live site kept serving stale pre-`v0.6.0` code. Deployment now runs through an explicit GitHub Actions workflow instead.

  **Details:**
  - Added `.github/workflows/pages.yml`: uploads the repo root as a Pages artifact and publishes it with `actions/deploy-pages`. No Jekyll in the pipeline, so the static site ships exactly as committed.
  - The Pages site itself was wedged in the legacy build mode and had to be deleted and recreated against the Actions source.

  **Verified:**
  - Workflow run green; live site now serves current `main`.
  - v0.6.0 mobile polish and the v0.6.1 win-banner fix both confirmed live in production.
  - Zero console errors on the live site.

- [x] **OPS-3 — Resolve the GitHub Pages outage: recreate the site in legacy branch mode** | Priority: P0 | M | Created: 2026-08-06 | Completed: 2026-08-06 | Owner: @claude
  **⚠ Operational guidance superseded by OPS-4.** The legacy-branch-mode recreation below is still the live configuration, but the assumption that pushes to `main` would reliably trigger builds did not hold — see OPS-4 for the root cause and the API-requested-build fix.

  *Supersedes OPS-2.* The Pages **site record** — not the workflow — was corrupted. Deployments reported success and then immediately went inactive; newly queued deploys sat until they died at the server-side 10-minute cap; the live URL served 503 / the GitHub unicorn page. No amount of re-running or re-pointing the deployment source cleared it.

  **Fix:**
  - Deleted the Pages site outright, waited for the deletion to propagate, then recreated it in **legacy branch mode** — source `main` @ `/`.
  - `.nojekyll` at the repo root bypasses the Jekyll build failure that started the whole saga, so the legacy builder now ships the static site exactly as committed.
  - `.github/workflows/pages.yml` demoted to `workflow_dispatch`-only and kept as a manual fallback. Routine deploys run through the legacy branch builder on push to `main`.

  **Verified:**
  - Live site serving HTTP 200 with the grain fix, the win-banner fix, and the mobile polish all confirmed in production.

  **Operational note (replaces OPS-1/OPS-2 guidance; itself replaced by OPS-4):** `main` is still production, but deploys no longer show up in the Actions tab. If the live site looks stale, check the Pages build directly: `gh api repos/drew-valentine/lightwave/pages/builds/latest`. Builds are running slow — allow several minutes before treating a stale site as a failure.

- [x] **OPS-4 — Final deploy pipeline resolution: request Pages builds via the API on every push** | Priority: P0 | S | Created: 2026-08-06 | Completed: 2026-08-06 | Owner: @claude
  *Supersedes all previous OPS notes.* After OPS-3 restored the site, pushes to `main` still did not reliably publish. Root cause isolated at last: **push-triggered Pages builds fail server-side for this repo** — every one returns a generic `Page build failed` with no detail, regardless of the content pushed — while **builds requested through the Pages API succeed** on the exact same commit. The trigger path is broken, not the build itself.

  **Fix (shipped):**
  - Added `.github/workflows/request-pages-build.yml`, which runs on every push to `main` and requests the build explicitly via the API (`gh api -X POST repos/drew-valentine/lightwave/pages/builds`).
  - The workflow polls the build status to completion and retries up to **3 times**, so a transient failure self-heals without human intervention.

  **Verified end-to-end:**
  - Push `46bf077` → "Request Pages build" workflow run succeeded → Pages build reported `built` for that exact commit.
  - **v0.7.0 confirmed live in production.**

  **Deploy stack (current):**
  1. Legacy branch builder (source: `main` @ `/`, `.nojekyll`) — the publisher.
  2. `.github/workflows/request-pages-build.yml` — triggers the build via the API on push to `main`.
  3. `.github/workflows/pages.yml` — `workflow_dispatch`-only manual Actions deploy, kept as fallback.

  **Operational note (replaces OPS-1/OPS-2/OPS-3 guidance):** if the live site looks stale, **check the "Request Pages build" workflow run in the Actions tab first.** If that run is green, the build was requested and accepted; confirm the published commit with `gh api repos/drew-valentine/lightwave/pages/builds/latest`. If the run failed after its retries, re-run it or request a build manually. Ignore any standalone push-triggered `Page build failed` notifications — those are the known-broken trigger path, not a real deploy failure.

### v0.7.0 — Meditative win affirmations

- [x] **UX-5 — Win banner speaks arrival, not repair: 40 meditative affirmations** | Priority: P1 | S | Requested: 2026-08-06 (player) | Completed: 2026-08-06 | Owner: @claude | Branch: `feature/win-affirmations` → `main` @ `v0.7.0`
  The level-complete banner said "RESOLVED" — the language of something having been wrong and then fixed. Lightwave is a calm game about light finding its path, so the win moment now names arrival instead of repair. Each level greets you with its own meditative phrase: *the light finds its way*, *harmony, as it always was*, and 38 more.

  **Details:**
  - 40-phrase pool, one phrase per level, assigned deterministically — the same level always greets you the same way.
  - Assignment steps through the pool with a stride coprime to 40, so any 40 consecutive levels draw 40 distinct phrases before any repeat.
  - Styled as soft lowercase italic Didot, in keeping with the game's typographic system — a quiet exhale rather than an announcement.
  - Win-to-next-level delay extended to 2.6s so the phrase can actually be read.

  **Verified:**
  - Phrases fit without wrapping at 320px, 375px, and desktop widths (the v0.6.1 `white-space: nowrap` + `clamp()` sizing carries over).
  - Zero console errors.

### v0.6.2 — Mobile grain fix

- [x] **BUG-3 — "Grainy graphics" on mobile** | Priority: P1 | S | Reported: 2026-08-06 (player, mobile) | Completed: 2026-08-06 | Owner: @claude | Branch: `fix/mobile-grain` → `main` @ `v0.6.2`
  Beams looked speckled and grainy on phones. Root cause was sub-pixel stroke widths: at the ~0.34 board scale mobile uses, the beam core stroked at 0.6px and the dash layer at 0.88px. Sub-pixel strokes get antialiased across neighbouring pixels, and under additive blending those partial coverages accumulate unevenly — which reads as grain.

  **Fix:**
  - All beam layer widths are now floored in **screen** pixels, so no layer can stroke thinner than a whole device pixel regardless of board scale.

  **Ruled out:**
  - Device-pixel-ratio handling was checked and is correct — the canvas was never under-resolved. The bug was purely stroke geometry.

  **Verified:**
  - Confirmed on mobile board scale; fix live in production after OPS-3.

### v0.6.1 — Win banner wrap fix

- [x] **BUG-2 — Win banner "RESOLVED" wrapped onto two lines on narrow screens** | Priority: P1 | S | Reported: 2026-08-06 (player, iPhone 13 mini) | Completed: 2026-08-06 | Owner: @claude | Branch: `fix/win-banner-wrap` → `main` @ `v0.6.1`
  The level-complete banner spelled "RESOLVED" with literal spaces between letters for the letterspaced look, so narrow viewports treated each letter as its own breakable word and wrapped the word mid-banner.

  **Fix:**
  - Letterspacing now comes from CSS `letter-spacing` tracking on the real word, not from literal spaces between characters.
  - `white-space: nowrap` on the banner text so it can never break.
  - Viewport-scaled sizing via `clamp(18px, 6vw, 55px)` so the banner shrinks to fit instead of wrapping.

  **Verified:**
  - Single-line at 320px, 375px, and desktop widths.

### v0.6.0 — Mobile touch polish

- [x] **UX-4 — Mobile touch polish: touch-sized targets, jitter-tolerant drag, tap-to-reveal labels** | Priority: P1 | M | Created: 2026-08-05 | Completed: 2026-08-06 | Owner: @claude | Branch: `feature/mobile-polish` → `main` @ `v0.6.0`
  The board is now genuinely playable with a thumb. Grab targets, drag behavior, snapping, labels, and chrome sizing all adapt to touch instead of assuming a mouse.

  **Details:**
  - Touch-sized grab targets with a 44px screen-space floor, so hit areas stay thumb-sized regardless of board scale.
  - Drag deadzone absorbs finger jitter, so a tap stays a tap and a drag stays a drag.
  - Wider snap tolerance on touch when releasing a component.
  - Tap-to-reveal color labels on wells and emitters — the v0.3.0 hover captions had no touch equivalent.
  - Safe-area insets plus `viewport-fit=cover` and `theme-color` for notched devices.
  - Coarse-pointer sizing: 44px reset control, 48px level-selector cells.
  - Compact view margins to give the board more room on small screens.
  - Safari `setPointerCapture` hardening.

  **Verified:**
  - Emulated iPhone 13, portrait and landscape, driven with real CDP touch events.
  - Zero console errors.
  - Solvability harness still green.

  *Also chips away at the Accessibility backlog item: color names are now reachable without a hover-capable pointer.*

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
- **v0.6.0** — 2026-08-06 — UX-4: mobile touch polish — 44px screen-space grab targets, drag deadzone, wider touch snap tolerance, tap-to-reveal color labels, safe-area insets + `viewport-fit=cover` + `theme-color`, coarse-pointer control sizing, compact view margins, Safari `setPointerCapture` hardening. Verified on emulated iPhone 13 in both orientations with real touch events. From `feature/mobile-polish`.
- **v0.6.1** — 2026-08-06 — BUG-2: win banner "RESOLVED" no longer wraps on narrow screens — CSS `letter-spacing` tracking replaces literal inter-letter spaces, plus `white-space: nowrap` and `clamp(18px, 6vw, 55px)` viewport-scaled sizing; verified single-line at 320px/375px/desktop. From `fix/win-banner-wrap`. Shipped alongside OPS-2, which moved Pages deployment off the silently-failing legacy Jekyll builder onto the `.github/workflows/pages.yml` GitHub Actions workflow — since superseded by OPS-3.
- **v0.6.2** — 2026-08-06 — BUG-3: mobile "grainy graphics" fixed — beam layer widths are now floored in screen pixels, so sub-pixel strokes (core 0.6px, dashes 0.88px at the ~0.34 mobile board scale) can no longer antialias unevenly under additive blending. DPR handling verified correct and ruled out. From `fix/mobile-grain`. Shipped alongside OPS-3, which ended the Pages outage: the corrupted site record was deleted and recreated in legacy branch mode (`main` @ `/`, `.nojekyll`), with the Actions workflow demoted to a `workflow_dispatch`-only manual fallback.
- **v0.7.0** — 2026-08-06 — UX-5: meditative win affirmations replace "RESOLVED" — a 40-phrase pool of arrival ("the light finds its way", "harmony, as it always was", …), one per level, assigned deterministically via a stride coprime to 40 so any 40 consecutive levels are distinct; soft lowercase italic Didot; win-to-next-level delay extended to 2.6s for reading time. Verified fitting at 320px/375px/desktop with zero console errors. From `feature/win-affirmations`. Confirmed live in production via OPS-4, which fixed the deploy trigger: push-triggered Pages builds fail server-side for this repo, so `.github/workflows/request-pages-build.yml` now requests each build through the Pages API on every push to `main` (with polling + 3 retries).
