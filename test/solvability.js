/* Lightwave — solvability proof harness.
   For many seeds × levels: verify the generator's solution state actually
   solves the level under the real engine, the scrambled start is never
   solved, and levels are pairwise distinct. Run: node test/solvability.js */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

for (const f of ['js/rng.js', 'js/color.js', 'js/engine.js', 'js/gen.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), { filename: f });
}

const NS = globalThis.LW;
const E = NS.ENGINE;

const SEEDS = ['aurora', 'zenith', 'umbra'];
const MAX_LEVEL = 40;

let failures = 0;
const layouts = new Set();

function levelFingerprint(lvl) {
  return lvl.comps
    .map((n) => `${n.type}:${n.color || 0}:${n.x.toFixed(0)},${n.y.toFixed(0)}`)
    .sort()
    .join('|');
}

for (const seed of SEEDS) {
  for (let L = 1; L <= MAX_LEVEL; L++) {
    const t0 = Date.now();
    const lvl = NS.GEN.generate(seed, L);
    const ms = Date.now() - t0;

    // 1. Never starts solved.
    E.simulate(lvl.comps);
    if (E.isSolved(lvl.comps)) {
      console.error(`FAIL ${seed}:${L} — starts in a solved state`);
      failures++;
    }

    // 2. The stored solution really solves it.
    const scrambled = lvl.comps.map((n) => n.angle);
    for (const n of lvl.comps) if (n.solution !== undefined) n.angle = n.solution;
    E.simulate(lvl.comps);
    if (!E.isSolved(lvl.comps)) {
      console.error(`FAIL ${seed}:${L} — stored solution does not solve the level`);
      failures++;
    }
    lvl.comps.forEach((n, i) => { n.angle = scrambled[i]; });

    // 3. Determinism: regenerating gives an identical layout.
    const again = NS.GEN.generate(seed, L);
    if (levelFingerprint(again) !== levelFingerprint(lvl)) {
      console.error(`FAIL ${seed}:${L} — generation is not deterministic`);
      failures++;
    }

    // 4. All levels distinct (within a seed).
    const fp = `${seed}|${levelFingerprint(lvl)}`;
    if (layouts.has(fp)) {
      console.error(`FAIL ${seed}:${L} — identical to an earlier level`);
      failures++;
    }
    layouts.add(fp);

    // 5. Machinery guarantee: every prism/condenser level marks at least one
    // goal as machinery-fed, and no emitter emits a machinery goal's color —
    // so with the one-beam-per-well rule the machinery cannot be bypassed.
    const machinery = lvl.comps.filter((n) => n.type === 'prism' || n.type === 'condenser');
    if (machinery.length) {
      const machineryColors = new Set(
        lvl.comps.filter((n) => n.type === 'goal' && n.viaMachinery).map((n) => n.color)
      );
      if (!machineryColors.size) {
        console.error(`FAIL ${seed}:${L} — has machinery but no machinery-fed goal`);
        failures++;
      }
      const bypass = lvl.comps.filter(
        (n) => n.type === 'emitter' && machineryColors.has(n.color)
      );
      if (bypass.length) {
        console.error(`FAIL ${seed}:${L} — emitter color matches a machinery-fed goal (bypassable)`);
        failures++;
      }
    }
    // From level 5 on, every level must contain machinery at all.
    if (L >= 5 && !machinery.length) {
      console.error(`FAIL ${seed}:${L} — no machinery on a level that budgets it`);
      failures++;
    }

    // 6. The rich generator succeeded — the trivial fallback is a last resort
    // that should never actually fire.
    if (lvl.fallback) {
      console.error(`FAIL ${seed}:${L} — degraded to trivial fallback level`);
      failures++;
    }

    const counts = {};
    for (const n of lvl.comps) counts[n.type] = (counts[n.type] || 0) + 1;
    console.log(
      `ok ${seed}:${String(L).padStart(2)}  ${ms}ms  ` +
      `goals=${counts.goal || 0} emitters=${counts.emitter || 0} ` +
      `condensers=${counts.condenser || 0} prisms=${counts.prism || 0}`
    );
  }
}

if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log(`\nAll ${SEEDS.length * MAX_LEVEL} levels verified: solvable, unsolved at start, deterministic, distinct.`);
