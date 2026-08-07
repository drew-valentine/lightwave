# Lightwave — Project Kanban Board

A browser-playable puzzle game about the properties of light.

**Active branch:** none — `main` @ `v0.9.9` (last merge: `fix/first-load-blur`)
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
  *Partially addressed by UX-1 (v0.3.0), UX-4 (v0.6.0), and UX-9 (v0.9.1): color labels name the color of any emitter or goal well — on hover with a mouse, on tap with touch — and emitter housings are now tinted with the color they emit, so an emitter's color is legible at rest without interaction. Still open: hue remains the only always-on channel — persistent per-color **shape/pattern** encoding, keyboard control, and reduced-motion support.*
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

- [x] **OPS-5 — Day-of deploy failures root-caused: GitHub major outage on Pages + Actions** | Priority: P0 | S | Created: 2026-08-06 | Completed: 2026-08-06 | Owner: @claude
  The stalled v0.7.1/v0.8.0 deploys were **not** caused by anything in this repo. GitHub posted a **major outage affecting both Pages and Actions** on githubstatus.com mid-afternoon; it has since been resolved. Every build queued during the window was swallowed upstream.

  **Outcome:**
  - The OPS-4 `request-pages-build` watcher (poll + 3 retries, auto-rekick) did exactly its job: it landed the deploy the moment the outage cleared, with no manual intervention.
  - Live site confirmed serving build **`d30ee87`** — v0.8.0 and v0.8.1 both in production.

  **Operational note (adds to OPS-4):** before diagnosing a stale live site as a repo/pipeline problem, **check githubstatus.com**. A green "Request Pages build" run with no published commit, across multiple pushes, is a strong upstream-outage signal — let the watcher retry rather than re-plumbing the pipeline.

### v0.9.9 — Self-healing canvas: first-load blur on mobile fixed

- [x] **BUG-11 — Blurry on a phone's first visit, crisp after a refresh** | Priority: P1 | S | Reported: 2026-08-06 (player, mobile) | Completed: 2026-08-06 | Owner: @claude | Branch: `fix/first-load-blur` → `main` @ `v0.9.9`
  A player's **first** load on a phone came up soft and blurry; refreshing the same page rendered it crisp. Root cause was a **race against the browser's own viewport settling**: the canvas backing resolution was computed before the browser had finished parsing the meta viewport and settling URL-bar chrome, so the canvas was sized from **stale dimensions** and then **CSS-stretched** to the real viewport — which is exactly blur. Critically, this settling **often fires no resize event at all**, so a one-shot fit had nothing to correct it. A refresh started from already-settled values, hence the crisp second load.

  **Fix — stop trusting any single sizing moment; make the canvas self-healing:**
  - The **render loop verifies every frame** that the canvas backing store equals **viewport × DPR**, and **refits immediately on mismatch**. Any silent viewport change — event or no event — heals within **one frame**.
  - Added **`visualViewport` resize/scroll, `orientationchange`, and `pageshow`** listeners so the common cases correct instantly rather than waiting on the next frame check.

  **Verified:**
  - **Backing store corrupted at runtime on an emulated iPhone** and observed **single-frame restoration** to correct dimensions.
  - **Zero console errors**; solvability harness green.

  **Deploy: deploying** — merged to `main` and tagged `v0.9.9`; awaiting the "Request Pages build" run and published-commit confirmation (see OPS-4).

### v0.9.8 — Full spiral in frame on mobile, desktop framing restored

- [x] **BUG-10 — v0.9.7's content-box fit cropped the phyllotaxis spiral on mobile and degraded desktop framing** | Priority: P1 | S | Reported: 2026-08-06 (player) | Completed: 2026-08-06 | Owner: @claude | Branch: `fix/spiral-visible-desktop-revert` → `main` @ `v0.9.8`
  *Follows UX-12 (v0.9.7).* Fitting the view to the content box was right for phones and wrong for everything else. Two distinct problems, one from each half of the change.

  **Issue 1 — the decorative spiral got cropped on phones.** The content bounding box was computed from **placed components only**, but the level's **phyllotaxis spiral sockets** are part of the composition whether or not a component sits in them. Fitting to components alone pulled the frame in tight and cut the figure off. **Fix: bounds now include every spiral socket**, so the full figure stays in frame regardless of how sparsely the level is populated.

  **Issue 2 — desktop framing regressed.** The content-box fit was applied globally, and on desktop it traded the original spacious composition for a tighter, off-center one. **Fix: desktop is fully reverted to the original world-centered circle fit** — byte-for-byte the legacy formula, not an approximation of it. The content-box fit is now strictly a compact-screen behavior.

  **Win dissolve** converges on the **view's world center** in both layouts, so the spiral lands under the arriving numeral on phone and desktop alike.

  **Verified:**
  - Emulated iPhone at level 12: **all 19 sockets and all component rings on-screen**.
  - **Desktop framing identical to the legacy formula.**
  - **Zero console errors**; solvability harness green.

  **Deploy: deploying** — merged to `main` and tagged `v0.9.8`; awaiting the "Request Pages build" run and published-commit confirmation (see OPS-4).

### v0.9.7 — Mobile-first board fit

- [x] **UX-12 — Board fits the actual content box, not a worst-case circle: dense levels ~+22-25% larger on phones** | Priority: P1 | M | Requested: 2026-08-06 (player) | Completed: 2026-08-06 | Owner: @claude | Branch: `feature/mobile-fill` → `main` @ `v0.9.7`
  The view was sized to fit each level's **worst-case bounding circle** — the radius a level's layout *could* reach — rather than what the level actually contained. On a phone that left conspicuous wasted space down both sides while the puzzle itself sat small in the middle.

  **Fix — fit the content, then push compact screens to the true maximum:**
  - The view now fits the **actual content bounding box**, and centers on the **content** center rather than the nominal board center.
  - **Compact screens run at the true no-clip maximum:** the fit is computed so **hard component rings are always fully on screen**, while **soft halos are permitted to kiss the edges** — halos are glow, not geometry, so letting them touch the frame costs nothing and buys real size.
  - **Desktop keeps comfortable padding** — the aggressive fit is a small-screen behavior, not a global one.
  - **Win-dissolve particles now converge on the content center**, so the spiral lands where the arriving numeral actually is instead of drifting off-axis from it.

  **Result:**
  - **Dense levels ~+22-25% larger on phones** — the physical maximum available **without altering level geometry**.
  - **Sparse early levels +65-104% larger**, where the worst-case circle was wasting the most room.

  **False start (worth keeping):** the first attempt applied a **blind 15% overscale**, which **clipped edge components**. It was caught in **screenshot review** and replaced with the exact ring-safe fit above — a fixed margin cannot be safe when the safe margin is per-level.

  **Verified:**
  - **Zero hard-clipped components across sampled levels.**
  - **Solve + dissolve regression clean**; **zero console errors**; solvability harness green.

  **Deploy: deploying** — merged to `main` and tagged `v0.9.7`; awaiting the "Request Pages build" run and published-commit confirmation (see OPS-4).

### v0.9.6 — NaN beam crash fix

- [x] **BUG-9 — Level appeared to vanish mid-drag: a NaN beam angle killed the frame** | Priority: P0 | S | Reported: 2026-08-06 (player) | Completed: 2026-08-06 | Owner: @claude | Branch: `fix/prism-nan-crash` → `main` @ `v0.9.6`
  A player dragging a component watched the level disappear. Root cause was in the **prism generator**, not the renderer: each prism only carried **port offsets for the input primaries it was generated to split**, so routing **any other color** into it at play time produced an output port with **no offset** — and a beam emitted at angle **`NaN`**.

  **Why it only became fatal now:** the NaN beam had been latent since the prism component shipped. `canvas` `lineTo` silently swallows non-finite coordinates, so the bad beam simply drew nothing. The v0.9.5 gradient flow layer calls **`createLinearGradient`**, which **throws** on non-finite coordinates — so the same latent NaN now killed the draw **mid-frame**, leaving the board half-rendered. To the player that read as the level vanishing while they dragged.

  **Fix — three layers, so no single bad value can blank the board again:**
  - **Generator:** every prism is now generated with **all three ports**, so any input color has a defined offset. Extra ports simply **extend the fan** rather than changing existing split geometry.
  - **Engine:** guards **non-finite offsets**, so a malformed component can't emit a NaN-angled beam in the first place.
  - **Renderer:** `drawBeams` **skips non-finite beams**, so one bad beam can never take down the rest of the frame.

  **Verified:**
  - **Adversarial routing sweep** — every emitter routed into **all 221 prisms across 120 levels**; **all beams finite**.
  - **In-browser full-circle drag sweeps on level 18** — zero errors.
  - Solvability harness green.

  **Deploy: deploying** — merged to `main` and tagged `v0.9.6`; awaiting the "Request Pages build" run and published-commit confirmation (see OPS-4).

### v0.9.5 — Beam flow as pure gradient undulation

- [x] **UX-11 — Dashes replaced with a sinusoidal brightness field: the beam undulates instead of pulsing** | Priority: P1 | S | Requested: 2026-08-06 (player) | Completed: 2026-08-06 | Owner: @claude | Branch: `feature/gradient-wave` → `main` @ `v0.9.5`
  *Supersedes UX-10 (v0.9.4).* The v0.9.4 dashes were longer, wider, and lower-alpha than the beads before them, but they were still **dashes** — the player still read them as beads. Any segmented layer has ends, and ends read as objects riding the beam. The fix was to stop segmenting the light at all.

  **Fix — no dashes, no edges, just a moving brightness field:**
  - Flow is now a **sinusoidal brightness field along each beam**, rendered per frame as a **canvas linear gradient in the beam's own hue** from source to target. There is no dash pattern and no discrete element anywhere in the layer, so there is nothing with an edge to perceive as a bead.
  - **Wavelength = half the beam length**, so every beam carries exactly **two gentle crests** regardless of how long it is — the undulation reads at the same rhythm on a short beam and a long one.
  - The field **drifts source-to-target at ~4.5s per wavelength** — slow enough to read as the light breathing along its path rather than as travel.

  **Verified:**
  - **Animation frame-diff test** confirms the field actually moves frame to frame.
  - **8.3ms median frame time** — the per-frame gradient construction stays within budget.
  - **Zero console errors**; solvability harness green.

  **Deploy: deploying** — merged to `main` and tagged `v0.9.5`; awaiting the "Request Pages build" run and published-commit confirmation (see OPS-4).

  *Relevant to the Accessibility backlog item: hue remains the only always-on channel identifying a beam, so drawing the flow layer in the beam's own hue keeps that channel intact — per-color shape/pattern encoding stays open.*

### v0.9.4 — Beam flow reads as a wave

- [x] **UX-10 — Beam flow beads replaced with long low-alpha same-hue dashes: motion reads as a luminous swell** | Priority: P1 | S | Requested: 2026-08-06 (player) | Completed: 2026-08-06 | Owner: @claude | Branch: `fix/beam-wave-pulse` → `main` @ `v0.9.4`
  **⚠ Superseded by UX-11 (v0.9.5).** The dash approach below did not satisfy the player — the dashes still read as bead-like, because segments have ends. v0.9.5 removes dashes entirely in favour of a continuous sinusoidal gradient.

  *Follows BUG-7 (v0.9.2).* The v0.9.2 fix pulled the flow beads back from pure white to the hue's light tint, but a light tint under **additive** blending still adds toward white — short bright beads kept reading as whitish specks travelling a colored beam, so the motion looked like particles on the light rather than the light itself moving.

  **Fix — make the moving layer incapable of whitening:**
  - Flow beads replaced with **long, wide, low-alpha dashes drawn in the beam's own saturated hue**. Additive blending of a color with itself can only **brighten**, never desaturate, so the travelling layer now reads as a swell in the beam rather than a white overlay.
  - Length and width up, alpha down: the same energy is spread along the beam instead of concentrated into bright points, so the flow reads as a **subtle luminous wave** travelling its length.

  **Verified:**
  - **Mobile DPR 3 screenshot** confirmed — beam hue holds and the flow reads as a swell, not speckle.
  - **Zero console errors**; solvability harness green.

  **Deploy: deploying** — merged to `main` and tagged `v0.9.4`; awaiting the "Request Pages build" run and published-commit confirmation (see OPS-4).

  *Relevant to the Accessibility backlog item: hue remains the only always-on channel identifying a beam, so hue fidelity in every layer stays load-bearing until per-color shape/pattern encoding lands.*

### v0.9.3 — Roman numerals beyond XX

- [x] **BUG-8 — Roman numerals stopped at XX; levels 21+ showed decimal digits** | Priority: P1 | S | Reported: 2026-08-06 (player) | Completed: 2026-08-06 | Owner: @claude | Branch: `fix/roman-numerals-forever` → `main` @ `v0.9.3`
  A player reached level 21 and the game stopped speaking its own language — the level badge, the win-arrival numeral, and the level selector all fell back to decimal digits. Root cause was a **hardcoded `I`–`XX` lookup array** left over from the first build, which simply ran out.

  **Fix:**
  - Replaced the lookup with **standard subtractive Roman conversion**, so any level number renders as a numeral — the game no longer has a ceiling on its own typography.
  - **Long-numeral downsizing** (class-based) applied in the **level badge**, the **win arrival numeral**, and the **selector cells**, so wide numerals like `XXXVIII` fit their circle instead of overflowing it.

  **Verified:**
  - **15-case unit check** of the conversion, including `XLIV`, `XCIX`, and `MCMXCIX`.
  - **Playwright selector check at 40 unlocked levels** — zero overflow across the grid.
  - **Zero console errors**; solvability harness green.

  **Deploy: deploying** — pushed to `main`; awaiting the "Request Pages build" run and published-commit confirmation (see OPS-4).

### v0.9.2 — Beam hue saturation fix

- [x] **BUG-7 — Beams washed out to near-white, worst on mobile** | Priority: P1 | S | Reported: 2026-08-06 (player) | Completed: 2026-08-06 | Owner: @claude | Branch: `fix/beam-color-saturation` → `main` @ `v0.9.2`
  A player reported that beams read as nearly white rather than as their color. Root cause was hue loss stacked across the beam's layers: the **core line was drawn near-white**, and the **traveling flow beads were pure white**, so under additive blending the two together overwhelmed the colored layers beneath. The effect was **worst on mobile**, where the v0.6.2 screen-pixel stroke floors make those thin top layers proportionally the widest part of the beam.

  **Fix — hue discipline across every beam layer:**
  - **Center line** now draws in the **saturated** beam color instead of near-white.
  - **Traveling flow beads** draw in the hue's **light tint** — luminance lifted enough to stay visible against the core, but the hue is preserved rather than discarded to white.
  - **Beads slightly lengthened**, so the flow still reads as motion at the lower contrast.
  - **Mid-layer saturation raised**, reinforcing the hue underneath.

  **Verified:**
  - Desktop **and mobile DPR 3** screenshots — beams read as their color at both scales.
  - **Zero console errors**; solvability harness green.

  **Deploy: deploying** — pushed to `main`; awaiting the "Request Pages build" run and published-commit confirmation (see OPS-4).

  *Relevant to the Accessibility backlog item: hue is currently the only always-on channel identifying a beam, so hue fidelity is load-bearing until per-color shape/pattern encoding lands.*

### v0.9.1 — Colored emitters

- [x] **UX-9 — Emitter housings tinted with the color they emit** | Priority: P1 | S | Requested: 2026-08-06 (player) | Completed: 2026-08-06 | Owner: @claude | Branch: `feature/colored-emitters` → `main` @ `v0.9.1`
  Emitters all wore the same neutral housing, so the only way to tell what color one cast was to trace its beam or reveal its label. The housing now says it directly.

  **Details:**
  - Emitter **housing rings and nozzle wedges** are tinted with the emitted color, so every emitter's color is legible at a glance.
  - **Hover brightens** the tint to the lighter core color, keeping the existing hover affordance readable against the new base tint.
  - **Condensers deliberately stay neutral** — a condenser's identity is the blend pooling inside it, not a fixed color it owns, so tinting the housing would assert a color it does not have.

  **Verified:**
  - Screenshot-verified on a dense level; **zero console errors**; solvability harness green.

  *Further advances the Accessibility backlog item: emitter color no longer requires hover or tap to read. Color is still the only channel, though — per-color shape encoding remains open in Backlog.*

  **Deploy: deploying** — pushed to `main`; awaiting the "Request Pages build" run and published-commit confirmation (see OPS-4).

### v0.9.0 — Grabbable beams

- [x] **UX-8 — Beams are grabbable: drag anywhere along a beam to re-aim its source** | Priority: P1 | M | Reported: 2026-08-06 (playtester) | Completed: 2026-08-06 | Owner: @claude | Branch: `feature/grab-beams` → `main` @ `v0.9.0`
  A playtester kept reaching for the **beam** rather than the emitter that cast it — the light is the thing they were trying to steer. The game now agrees with them: a beam is a handle along its entire length.

  **Details:**
  - Dragging anywhere along a beam re-aims the component that emits it, exactly as dragging the component itself would.
  - **Prism split-beams** steer their own specific output port, so each fork of a split can be aimed independently by grabbing the fork you mean.
  - **26px touch hit width** along the beam, so a beam is a thumb-sized target and not a hairline.
  - Hover shows a **grab cursor** over a beam, so the affordance is discoverable with a mouse rather than something you have to guess.
  - Level 1 hint updated to teach it: *"Drag the emitter — or its beam —…"*

  **Verified:**
  - Playwright E2E solves **level 1 exclusively via beam-drag** — never touching a component directly.
  - **Zero console errors**; solvability harness green.

  **Deploy: deploying** — pushed to `main`; awaiting the "Request Pages build" run and published-commit confirmation (see OPS-4).

### v0.8.3 — Gentler OLED dither

- [x] **BUG-6 — v0.8.2's dither was itself visible as speckle** | Priority: P1 | S | Reported: 2026-08-06 (player screenshot, iPhone 13 mini) | Completed: 2026-08-06 | Owner: @claude | Branch: `fix/gentler-dither` → `main` @ `v0.8.3`
  The v0.8.2 anti-banding dither cured the banding but overshot: a player screenshot showed the dither reading as visible speckle rather than dissolving invisibly into the gradient.

  **Fix:**
  - Dither amplitude softened — **capped at roughly 1.5 levels** — strong enough to keep near-black gradients from stepping on OLED, weak enough to stay below the threshold of visible texture.

  **Deploy: shipped to production.**

### v0.8.0 — Dissolve win sequence

- [x] **UX-7 — Win sequence rebuilt: the level dissolves into light and the next numeral arrives** | Priority: P1 | M | Requested: 2026-08-06 (player) | Completed: 2026-08-06 | Owner: @claude | Branch: `feature/dissolve-win` → `main` @ `v0.8.0`
  *Supersedes UX-5 (v0.7.0) and UX-6 (v0.7.1).* The player rejected the meditative affirmation text outright — the words were the wrong register for the moment, and no amount of pacing fixed that. **The affirmation phrase pool is removed entirely.** The win is now carried by motion and light alone, and it is roughly half as long.

  **The sequence:**
  - On solve, the goal wells **flare instantly** — the payoff lands on the same frame as the solve, not after a beat.
  - The level **dissolves into glowing particles** that spiral home to the board centre along golden curls, while the board itself fades beneath them.
  - Where the light converges, the **next level's numeral arrives in large Didot** — the reward is the road ahead, not a compliment.

  **Details:**
  - Auto-advance at **2.7s** (was 5.6s in v0.7.1) — the moment reads as an arrival, not a pause.
  - **Tap anywhere to skip** for players moving quickly.
  - `prefers-reduced-motion` gets a fast plain path with no particles or spiral.

  **Verified end-to-end:**
  - Playwright **real-solve E2E** (an actual solve, not a simulated win state) — **5 checks passing**: next-numeral prep, dissolve pixels rendering, numeral presence, auto-advance timing, tap-to-skip. **Zero console errors.**
  - Solvability harness still green.

  **Deploy: CONFIRMED LIVE in production** — https://drew-valentine.github.io/lightwave/ @ build `d30ee87`. The day's deploy failures were **not** a repo problem: a **GitHub major outage affecting Pages and Actions** (posted on githubstatus.com mid-afternoon, since resolved) was swallowing every build. The `request-pages-build` auto-rekick watcher landed the deploy the moment the outage cleared — no manual intervention needed. See OPS-5.

### v0.8.2 — OLED gradient banding fix (grain, round two)

- [x] **BUG-5 — "Grainy graphics" on iPhone 13 mini, round two: OLED gradient banding** | Priority: P1 | S | Reported: 2026-08-06 (player, iPhone 13 mini) | Completed: 2026-08-06 | Owner: @claude | Branch: `fix/oled-gradient-banding` → `main` @ `v0.8.2`
  The player still saw grain after v0.6.2. Second round of diagnosis found a **different root cause**: large near-black gradients step visibly on OLED panels — classic gradient banding, not stroke antialiasing. The v0.6.2 sub-pixel stroke-floor fix was correct for what it addressed; it simply was not this.

  **Fix:**
  - A static **2% retina-fine dither pattern** is drawn over each frame, at **one grain per device pixel**, breaking the banding into smoothness. Fine enough to be invisible as texture, strong enough to dissolve the steps.

  **Verified:**
  - Playwright: **36 distinct shades** measured in a patch that was formerly flat, **zero console errors**.
  - **60fps maintained at DPR 3.**

  **Deploy: CONFIRMED LIVE in production** — https://drew-valentine.github.io/lightwave/

  *Follow-up: the player's on-device screenshot showed the dither itself as visible speckle — softened in v0.8.3 (BUG-6).*

### v0.8.1 — Badge centering fix

- [x] **BUG-4 — Level badge numeral off-center** | Priority: P2 | S | Reported: 2026-08-06 | Completed: 2026-08-06 | Owner: @claude | Branch: `fix/badge-centering` → `main` @ `v0.8.1`
  The level badge numeral sat visually off-center within the badge. Centering corrected.

  **Deploy: CONFIRMED LIVE in production** — shipped in the same `d30ee87` build as v0.8.0 once the GitHub outage cleared.

### v0.7.1 — Meditative win sequence

- [x] **UX-6 — Win sequence: board dims to near-dark before the affirmation surfaces** | Priority: P1 | S | Requested: 2026-08-06 (player) | Completed: 2026-08-06 | Owner: @claude | Branch: `feature/meditative-win-sequence` → `main` @ `v0.7.1`
  **⚠ Superseded by UX-7 (v0.8.0).** The player rejected the affirmation text this sequence was built to frame, so the whole phrase pool was removed. **This version never reached production** — the Pages outage meant v0.7.1 was never published, so v0.8.0 supersedes it in place: the first win sequence players will actually see is the dissolve.

  The v0.7.0 affirmations were the right words at the wrong moment — they appeared abruptly over a full-brightness solved board, which read as an interruption rather than an arrival. The win now unfolds as a paced sequence: the light settles, the world dims, and only then does the phrase surface.

  **The timeline (all CSS-driven staggering):**
  - **0s** — level solves; a **0.35s** beat of stillness before anything moves.
  - **0.35s → ~2.05s** — board and HUD fade to near-dark over **~1.7s**.
  - **1.1s → 3.7s** — the affirmation slowly surfaces: **2.6s** fade paired with a gentle upward drift.
  - Phrase then rests fully readable.
  - **5.6s** — the next level blooms in.

  **Details:**
  - Timing and staggering live entirely in CSS animations/delays — no JS timing chains to drift out of sync.
  - `prefers-reduced-motion` disables the animations.

  **Verified end-to-end:**
  - Level 1 actually solved in Playwright with a real mouse drag — not a simulated win state — then opacities sampled across the whole timeline. **7 checks passing, zero console errors.**
  - Solvability harness still green.

  *Also chips away at the reduced-motion strand of the Accessibility backlog item.*

### v0.7.0 — Meditative win affirmations

- [x] **UX-5 — Win banner speaks arrival, not repair: 40 meditative affirmations** | Priority: P1 | S | Requested: 2026-08-06 (player) | Completed: 2026-08-06 | Owner: @claude | Branch: `feature/win-affirmations` → `main` @ `v0.7.0`
  **⚠ Superseded by UX-7 (v0.8.0).** The player rejected the affirmation text; the 40-phrase pool is removed entirely as of v0.8.0, and the win moment is now carried by the dissolve animation and the next level's numeral instead of words.

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
- **v0.7.1** — 2026-08-06 — UX-6: the win moment is now a paced sequence rather than a sudden banner — a 0.35s beat, then board and HUD fade to near-dark over ~1.7s, then the affirmation surfaces from 1.1s over a 2.6s fade with upward drift, rests fully readable, and the next level blooms in at 5.6s. All staggering is CSS-driven; `prefers-reduced-motion` disables the animations. Verified by actually solving level 1 with a real mouse drag in Playwright and sampling opacities across the timeline — 7 checks passing, zero console errors, solvability harness green. From `feature/meditative-win-sequence`. **Never reached production** — the Pages outage blocked publication, and v0.8.0 supersedes it in place.
- **v0.8.0** — 2026-08-06 — UX-7: the affirmation text is gone. The player rejected the phrasing, so the **40-phrase pool is removed entirely** and the win is carried by motion: on solve the wells flare instantly, the level dissolves into glowing particles spiralling home to the board centre along golden curls as the board fades beneath, and the **next level's numeral arrives in large Didot** where the light converges. Auto-advance cut to **2.7s** (from 5.6s), tap-anywhere to skip, and `prefers-reduced-motion` gets a fast plain path. Verified with a Playwright real-solve E2E — 5 checks (numeral prep, dissolve pixels, numeral presence, auto-advance, tap-skip), zero console errors, solvability harness green. From `feature/dissolve-win`. **CONFIRMED LIVE in production** at build `d30ee87` — the day's stalled deploys were root-caused (OPS-5) to a **GitHub major outage on Pages and Actions**, posted on githubstatus.com mid-afternoon and since resolved; the `request-pages-build` auto-rekick watcher landed the deploy as soon as it cleared.
- **v0.8.1** — 2026-08-06 — BUG-4: level badge numeral centering fix. From `fix/badge-centering`. **CONFIRMED LIVE in production** in the same `d30ee87` build as v0.8.0.
- **v0.8.2** — 2026-08-06 — BUG-5: the second round of the iPhone 13 mini "grainy graphics" report. The remaining grain was **OLED gradient banding** — large near-black gradients step visibly on OLED panels — a different cause from the v0.6.2 sub-pixel stroke-floor fix. Fixed with a **static 2% retina-fine dither pattern drawn at one grain per device pixel** over each frame, breaking the banding into smoothness while staying invisible as texture. Verified via Playwright: **36 distinct shades** in a formerly-flat patch, zero console errors, **60fps maintained at DPR 3**. From `fix/oled-gradient-banding`. **CONFIRMED LIVE in production** — but see v0.8.3, where the dither itself proved visible on-device.
- **v0.8.3** — 2026-08-06 — BUG-6: gentler OLED dither. A player screenshot of v0.8.2 showed the anti-banding dither reading as **visible speckle**, so its amplitude is now **capped at roughly 1.5 levels** — still enough to keep near-black gradients from stepping on OLED, but below the threshold of visible texture. From `fix/gentler-dither`. Shipped to production.
- **v0.9.0** — 2026-08-06 — UX-8: **grabbable beams**. A playtester kept trying to grab the beam instead of the emitter, so beams are now draggable **anywhere along their length** to re-aim their source component; **prism split-beams steer their own specific output port**, so each fork of a split aims independently. Ships a **26px touch hit width** along the beam and a **hover grab-cursor** affordance, with the level 1 hint updated to teach it (*"Drag the emitter — or its beam —…"*). Verified by a Playwright E2E that solves **level 1 exclusively via beam-drag**, never touching a component directly — zero console errors, solvability harness green. From `feature/grab-beams`. **Deploying** — awaiting published-commit confirmation.
- **v0.9.1** — 2026-08-06 — UX-9: **colored emitters**. Emitter **housing rings and nozzle wedges** are now tinted with the color that emitter casts, so its color is legible at a glance rather than only by tracing the beam or revealing the label; **hover brightens** the tint to the lighter core color. **Condensers deliberately stay neutral** — their identity is the blend pooling inside, not a color they own. Screenshot-verified on a dense level, zero console errors, solvability harness green. From `feature/colored-emitters`. Further advances the colorblind/accessibility item, though **color remains the only always-on channel** — shape-per-color encoding stays open in Backlog. **Deploying** — awaiting published-commit confirmation.
- **v0.9.2** — 2026-08-06 — BUG-7: **beam hue wash-out fixed**. A player reported beams looking nearly white; the hue was being lost at the top of the layer stack — a **near-white core line** plus **pure-white traveling flow beads** additively washed out the colored layers beneath, worst on **mobile**, where the v0.6.2 screen-pixel stroke floors make those thin layers proportionally widest. Fixed with hue discipline across all beam layers: the **center line now draws in the saturated beam color**, the **flow beads draw in the hue's light tint** (luminance lifted for visibility, hue preserved rather than discarded to white), **beads slightly lengthened** so the motion still reads at lower contrast, and **mid-layer saturation raised**. Verified with desktop **and mobile DPR 3** screenshots, zero console errors, solvability harness green. From `fix/beam-color-saturation`. **Deploying** — awaiting published-commit confirmation.
- **v0.9.3** — 2026-08-06 — BUG-8: **Roman numerals no longer stop at XX**. A player reached level 21 and found decimal digits in the level badge, the win arrival numeral, and the level selector — a **hardcoded `I`–`XX` array** from the first build had run out. Replaced with **standard subtractive Roman conversion** for any level number, plus **class-based long-numeral downsizing** in the badge, the win numeral, and the selector cells so wide numerals like `XXXVIII` fit their circle. Verified with a **15-case unit check** (including `XLIV`, `XCIX`, `MCMXCIX`) and a **Playwright selector check at 40 unlocked levels with zero overflow**, zero console errors, solvability harness green. From `fix/roman-numerals-forever`. **Deploying** — awaiting published-commit confirmation.
- **v0.9.4** — 2026-08-06 — UX-10: **beam flow now reads as a wave**. Player-requested polish following v0.9.2: the short bright flow beads still read as **whitish specks** because a light tint under **additive** blending adds toward white no matter how the hue is chosen. They are replaced with **long, wide, low-alpha dashes drawn in the beam's own saturated hue** — additive same-hue light can only **brighten**, never desaturate — so the same energy is spread along the beam and the motion reads as a **subtle luminous swell travelling its length** rather than particles riding on top of it. Verified with a **mobile DPR 3 screenshot**, zero console errors, solvability harness green. From `fix/beam-wave-pulse`. **Superseded by v0.9.5** — the dashes still read as bead-like to the player.
- **v0.9.5** — 2026-08-06 — UX-11: **beam flow is now pure gradient undulation**. The v0.9.4 dashes were still **dashes** — segments have ends, and ends read as beads no matter how long, wide, or low-alpha they are — so the segmented layer is **removed entirely**. Flow is now a **sinusoidal brightness field** along each beam, rendered per frame as a **canvas linear gradient in the beam's own hue**: no dashes, no edges, nothing discrete to perceive as an object riding the light. **Wavelength = half the beam length**, giving every beam exactly **two gentle crests** so the rhythm reads the same on short and long beams alike, drifting **source-to-target at ~4.5s per wavelength**. Verified with an **animation frame-diff test** confirming real motion, **8.3ms median frame time**, zero console errors, solvability harness green. From `feature/gradient-wave`. **Deploying** — awaiting published-commit confirmation. *Also surfaced the latent NaN beam bug fixed in v0.9.6 — `createLinearGradient` throws where `lineTo` had silently swallowed it.*
- **v0.9.6** — 2026-08-06 — BUG-9: **NaN beam crash fixed** — a player reported the level vanishing mid-drag. Prisms were generated carrying **port offsets only for their own input primaries**, so routing **any other color** into one at play time emitted a beam at angle **`NaN`**. Latent and harmless until now (canvas `lineTo` silently swallows non-finite coordinates), it turned **fatal in v0.9.5**: the new gradient flow layer calls **`createLinearGradient`**, which **throws** on non-finite coordinates, killing the frame mid-draw and leaving the board half-rendered — which read to the player as the level disappearing while they dragged. Fixed in three layers: every prism is now generated with **all three ports** (extras simply **extend the fan**, leaving existing split geometry intact), the **engine guards non-finite offsets** so a malformed component can't emit a NaN-angled beam, and **`drawBeams` skips non-finite beams** so one bad beam can never take down a frame. Verified by an **adversarial routing sweep** — every emitter into **all 221 prisms across 120 levels**, all beams finite — plus **in-browser full-circle drag sweeps on level 18** with zero errors; solvability harness green. From `fix/prism-nan-crash`. **Deploying** — awaiting published-commit confirmation.
- **v0.9.7** — 2026-08-06 — UX-12: **mobile-first board fit**. The view was sized to each level's **worst-case bounding circle** rather than its actual contents, leaving conspicuous wasted space down both sides on phones. It now fits the **actual content bounding box, centered on the content**, with **compact screens running at the true no-clip maximum** — **hard component rings always fully on screen**, **soft halos permitted to kiss the edges** (glow, not geometry) — while **desktop keeps comfortable padding**. **Win-dissolve particles now converge on the content center**, so the spiral lands where the arriving numeral is. Result: **dense levels ~+22-25% larger on phones** (the physical maximum without altering level geometry) and **sparse early levels +65-104%**. The first attempt used a **blind 15% overscale that clipped edge components** — caught in **screenshot review** and replaced with the exact ring-safe fit, since a fixed margin cannot be safe when the safe margin is per-level. Verified: **zero hard-clipped components across sampled levels**, solve + dissolve regression clean, zero console errors, harness green. From `feature/mobile-fill`. **Deploying** — awaiting published-commit confirmation. *Both halves of this fit corrected in v0.9.8.*
- **v0.9.8** — 2026-08-06 — BUG-10: **full spiral in frame on mobile, desktop framing restored**. A player follow-up to v0.9.7 surfaced two problems with the content-box fit. First, the content bounds were computed from **placed components only**, but the level's **phyllotaxis spiral sockets** are part of the composition whether or not a component occupies them — so the frame pulled in tight and **cropped the decorative spiral** on phones; bounds now **include every spiral socket**, keeping the full figure in frame however sparsely a level is populated. Second, the content-box fit had been applied **globally**, and on desktop it traded the original spacious composition for a tighter, off-center one — **desktop is now fully reverted to the original world-centered circle fit** (the legacy formula itself, not an approximation), making the content-box fit strictly a compact-screen behavior. The **win dissolve converges on the view's world center in both layouts**, so the spiral lands under the arriving numeral on phone and desktop alike. Verified: **all 19 sockets and all component rings on-screen on an emulated iPhone at level 12**, **desktop framing identical to the legacy formula**, zero console errors, solvability harness green. From `fix/spiral-visible-desktop-revert`. **Deploying** — awaiting published-commit confirmation.
- **v0.9.9** — 2026-08-06 — BUG-11: **first-load blur on mobile fixed with a self-healing canvas**. A player reported the game coming up blurry on a phone's **first** visit and crisp after a refresh. The canvas backing resolution was being computed **before the browser settled the viewport** (meta-viewport parsing, URL-bar chrome), so it was sized from **stale dimensions** and then **CSS-stretched** into blur — and because that settling **often fires no resize event**, a one-shot fit had nothing to correct it; a refresh simply started from already-settled values. The canvas now **verifies every frame that its backing store equals viewport × DPR and refits on mismatch**, so any silent viewport change **heals within one frame**, backed by **`visualViewport`, `orientationchange`, and `pageshow`** listeners for instant correction in the common cases. Verified by **corrupting the backing store at runtime on an emulated iPhone and observing single-frame restoration**, zero console errors, solvability harness green. From `fix/first-load-blur`. **Deploying** — awaiting published-commit confirmation.
