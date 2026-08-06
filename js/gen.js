/* Lightwave — procedural level generation.
   Guarantees: every level is solvable (verified by simulating its solution),
   never starts solved, and is deterministic per (gameSeed, levelNumber).

   Pipeline: build a solution graph backwards from the goals → embed nodes on a
   golden-angle phyllotaxis spiral (goals at the heart, sources outward) →
   compute exact solution angles → validate with the real engine → scramble. */
(function (NS) {
  'use strict';

  const C = NS.COLOR;
  const E = NS.ENGINE;
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 137.5°
  const PHI = (1 + Math.sqrt(5)) / 2;

  let nextId = 1;
  function node(type, props) {
    return Object.assign({ id: nextId++, type, x: 0, y: 0, angle: 0, input: 0 }, props);
  }

  /* ---------- difficulty schedule ---------- */

  function levelParams(L, rng) {
    if (L === 1) return { template: 'first-light' };
    if (L === 2) return { template: 'duet' };
    if (L === 3) return { template: 'confluence' };
    if (L === 4) return { template: 'dispersion' };
    // General procedural levels, Fibonacci-paced growth.
    return {
      template: 'general',
      goals: Math.min(2 + Math.floor((L - 4) / 2), 6),
      prisms: Math.min(1 + Math.floor((L - 5) / 4), 3),
      condensers: Math.min(1 + Math.floor((L - 4) / 3), 3),
      decoys: L >= 8 ? Math.min(1 + Math.floor((L - 8) / 5), 2) : 0,
      allowWhiteGoals: L >= 6,
      pPrism: 0.7,
      pCondenser: 0.65,
      maxDepth: L >= 10 ? 3 : 2,
    };
  }

  /* ---------- solution graph ---------- */

  function buildGraph(params, rng) {
    const comps = [];
    const demands = []; // { targetId, color, depth }

    const addGoal = (color) => {
      const g = node('goal', { color });
      comps.push(g);
      demands.push({ targetId: g.id, color, depth: 0 });
      return g;
    };

    if (params.template === 'first-light') {
      addGoal(rng.pick(C.PRIMARIES));
    } else if (params.template === 'duet') {
      const pool = rng.shuffle([...C.PRIMARIES, ...C.SECONDARIES]);
      addGoal(pool[0]); addGoal(pool[1]);
    } else if (params.template === 'confluence') {
      // Two primary emitters meet in a condenser feeding a secondary goal.
      const secondary = rng.pick(C.SECONDARIES);
      const g = addGoal(secondary);
      demands.length = 0;
      const cond = node('condenser', { targetId: g.id });
      comps.push(cond);
      for (const p of C.primariesOf(secondary)) {
        demands.push({ targetId: cond.id, color: p, depth: 2, forceEmitter: true });
      }
    } else if (params.template === 'dispersion') {
      // One white emitter unbraided by a prism into three primary goals.
      const goals = C.PRIMARIES.map((p) => addGoal(p));
      demands.length = 0;
      const prism = node('prism', {
        ports: goals.map((g) => ({ primary: g.color, targetId: g.id })),
      });
      comps.push(prism);
      demands.push({ targetId: prism.id, color: C.W, depth: 2, forceEmitter: true });
    } else {
      const palette = params.allowWhiteGoals
        ? C.ALL
        : [...C.PRIMARIES, ...C.SECONDARIES];
      for (let i = 0; i < params.goals; i++) addGoal(rng.pick(palette));
    }

    const budget = {
      prism: params.prisms || 0,
      condenser: params.condensers || 0,
    };

    while (demands.length) {
      const d = demands.shift();
      const deep = d.depth >= (params.maxDepth || 2);

      // Prism route: satisfy up to three distinct primary demands with one prism.
      if (!d.forceEmitter && !deep && C.bitCount(d.color) === 1 &&
          budget.prism > 0 && rng.chance(params.pPrism)) {
        budget.prism--;
        const bundle = [d];
        for (let i = demands.length - 1; i >= 0 && bundle.length < 3; i--) {
          const other = demands[i];
          if (C.bitCount(other.color) === 1 &&
              !bundle.some((b) => b.color === other.color)) {
            bundle.push(other);
            demands.splice(i, 1);
          }
        }
        let inputColor = bundle.reduce((m, b) => m | b.color, 0);
        // Sometimes add a waste primary the player must aim into the dark.
        if (C.bitCount(inputColor) < 3 && rng.chance(0.45)) {
          const spare = C.PRIMARIES.filter((p) => !(inputColor & p));
          inputColor |= rng.pick(spare);
        }
        const prism = node('prism', {
          ports: C.primariesOf(inputColor).map((p) => {
            const fed = bundle.find((b) => b.color === p);
            return { primary: p, targetId: fed ? fed.targetId : null };
          }),
        });
        comps.push(prism);
        demands.push({ targetId: prism.id, color: inputColor, depth: d.depth + 1 });
        continue;
      }

      // Condenser route: split a composite color into two tributaries.
      if (!d.forceEmitter && !deep && C.bitCount(d.color) >= 2 &&
          budget.condenser > 0 && rng.chance(params.pCondenser)) {
        budget.condenser--;
        const parts = C.splitColor(d.color, rng);
        const cond = node('condenser', { targetId: d.targetId });
        comps.push(cond);
        for (const part of parts) {
          demands.push({ targetId: cond.id, color: part, depth: d.depth + 1 });
        }
        continue;
      }

      comps.push(node('emitter', { color: d.color, targetId: d.targetId }));
    }

    for (let i = 0; i < (params.decoys || 0); i++) {
      comps.push(node('emitter', { color: rng.pick(C.ALL), targetId: null, decoy: true }));
    }

    return comps;
  }

  /* ---------- phyllotaxis embedding ---------- */

  function spiralPoint(index, unit) {
    const r = unit * Math.sqrt(index + 0.62);
    const a = index * GOLDEN_ANGLE;
    return { x: r * Math.cos(a), y: r * Math.sin(a), r, a, index };
  }

  /* Place nodes on spiral slots. Two strategies, alternated across retries:
     'tiered' — goals innermost, sources outward (light flows to the heart);
     'woven' — everything interleaved (more local traffic on dense boards).
     Random slot skips add variety. */
  function embed(comps, rng, strategy) {
    let ordered;
    if (strategy === 'tiered') {
      const tiers = [
        comps.filter((n) => n.type === 'goal'),
        comps.filter((n) => n.type === 'condenser' || n.type === 'prism'),
        comps.filter((n) => n.type === 'emitter' && !n.decoy),
        comps.filter((n) => n.decoy),
      ];
      ordered = tiers.flatMap((t) => rng.shuffle(t));
    } else {
      ordered = rng.shuffle(comps);
    }

    let slot = 0;
    const slots = [];
    for (let i = 0; i < ordered.length; i++) {
      slots.push(slot);
      slot += 1 + (rng.chance(0.3) ? 1 : 0);
    }
    const maxSlot = slots[slots.length - 1];
    const unit = Math.max(92, E.WORLD_RADIUS / Math.sqrt(maxSlot + 1.62));

    const sockets = [];
    for (let s = 0; s <= maxSlot; s++) sockets.push(spiralPoint(s, unit));

    ordered.forEach((n, i) => {
      const p = spiralPoint(slots[i], unit);
      n.x = p.x + rng.range(-5, 5);
      n.y = p.y + rng.range(-5, 5);
    });

    const extent = Math.max(...comps.map((n) => Math.hypot(n.x, n.y)), unit) + 90;
    return { sockets, unit, extent };
  }

  /* ---------- solution angles ---------- */

  function wrapAngle(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  }

  function angleTo(from, to) {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }

  /* Find an angle whose ray escapes to the void (hits nothing). */
  function findClearAngle(n, comps, rng, preferred) {
    const tries = 48;
    for (let i = 0; i < tries; i++) {
      const a = preferred !== undefined && i < 12
        ? preferred + wrapAngle(i * 0.35 * (i % 2 ? 1 : -1))
        : rng.range(-Math.PI, Math.PI);
      if (!E.castRay(n.x, n.y, a, comps, n.id)) return a;
    }
    return null;
  }

  function computeSolution(comps, rng) {
    const byId = new Map(comps.map((n) => [n.id, n]));

    for (const n of comps) {
      if (n.type === 'goal') {
        n.angle = 0;
      } else if (n.type === 'emitter' || n.type === 'condenser') {
        if (n.targetId) {
          n.solution = angleTo(n, byId.get(n.targetId));
        } else {
          const clear = findClearAngle(n, comps, rng);
          if (clear === null) return false;
          n.solution = clear;
        }
      } else if (n.type === 'prism') {
        const fed = n.ports.filter((p) => p.targetId);
        if (!fed.length) return false;
        const dirs = fed.map((p) => angleTo(n, byId.get(p.targetId)));
        // Circular mean of the fed directions.
        const mx = dirs.reduce((s, a) => s + Math.cos(a), 0);
        const my = dirs.reduce((s, a) => s + Math.sin(a), 0);
        n.solution = Math.atan2(my, mx);
        n.offsets = {};
        let maxOff = 0;
        for (const p of fed) {
          const off = wrapAngle(angleTo(n, byId.get(p.targetId)) - n.solution);
          if (Math.abs(off) > 1.35) return false; // fan too wide — reject embedding
          n.offsets[p.primary] = off;
          maxOff = Math.max(maxOff, Math.abs(off));
        }
        // Waste ports fan outside the used spread, aimed into the void.
        let side = rng.chance(0.5) ? 1 : -1;
        for (const p of n.ports.filter((q) => !q.targetId)) {
          let placed = false;
          for (const extra of [0.5, 0.8, 1.15, 1.5]) {
            const off = side * (maxOff + extra);
            if (!E.castRay(n.x, n.y, n.solution + off, comps, n.id)) {
              n.offsets[p.primary] = off;
              placed = true;
              break;
            }
            side = -side;
          }
          if (!placed) return false;
        }
      }
    }

    for (const n of comps) if (n.solution !== undefined) n.angle = n.solution;
    return true;
  }

  /* ---------- scramble ---------- */

  function scramble(comps, rng) {
    const rotatable = comps.filter((n) => n.type !== 'goal');
    for (let attempt = 0; attempt < 30; attempt++) {
      for (const n of rotatable) {
        let a;
        do {
          a = rng.range(-Math.PI, Math.PI);
        } while (Math.abs(wrapAngle(a - n.solution)) < 0.45);
        n.angle = a;
      }
      E.simulate(comps);
      if (!E.isSolved(comps)) return true;
    }
    return false;
  }

  /* ---------- top level ---------- */

  function generate(gameSeed, levelNumber) {
    for (let graphTry = 0; graphTry < 12; graphTry++) {
      const rng = NS.makeRng(`${gameSeed}:${levelNumber}:${graphTry}`);
      nextId = 1;
      const params = levelParams(levelNumber, rng);
      const comps = buildGraph(params, rng);

      for (let embedTry = 0; embedTry < 140; embedTry++) {
        const layout = embed(comps, rng, embedTry % 2 ? 'woven' : 'tiered');
        if (!computeSolution(comps, rng)) continue;
        E.simulate(comps);
        if (!E.isSolved(comps)) continue;
        // Solution verified by the real engine. Now scramble it away.
        if (!scramble(comps, rng)) continue;
        E.simulate(comps);
        return {
          level: levelNumber,
          seed: `${gameSeed}:${levelNumber}`,
          comps,
          sockets: layout.sockets,
          unit: layout.unit,
          extent: layout.extent,
        };
      }
    }
    // Deterministic fallback: a single direct emitter→goal, always embeddable.
    const rng = NS.makeRng(`${gameSeed}:${levelNumber}:fallback`);
    nextId = 1;
    const comps = buildGraph({ template: 'first-light' }, rng);
    const layout = embed(comps, rng, 'tiered');
    computeSolution(comps, rng);
    scramble(comps, rng);
    E.simulate(comps);
    return { level: levelNumber, seed: `${gameSeed}:${levelNumber}`, comps, sockets: layout.sockets, unit: layout.unit, extent: layout.extent, fallback: true };
  }

  NS.GEN = { generate, levelParams, GOLDEN_ANGLE, PHI, wrapAngle };
})(globalThis.LW = globalThis.LW || {});
