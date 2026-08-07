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

  /* ---------- machinery-aware color helpers ---------- */

  /* A prism input: superset of `required` with >=2 primaries, steered away
     from colors in `avoid` so its feeding emitter can't double as a goal key. */
  function chooseSuperset(required, avoid, rng) {
    const spares = C.PRIMARIES.filter((p) => !(required & p));
    const options = [];
    for (let mask = 0; mask < (1 << spares.length); mask++) {
      let u = required;
      spares.forEach((p, i) => { if (mask & (1 << i)) u |= p; });
      if (C.bitCount(u) >= 2) options.push(u);
    }
    const shuffled = rng.shuffle(options);
    const clean = shuffled.filter((u) => !avoid.has(u));
    const pool = clean.length ? clean : shuffled;
    pool.sort((a, b) => C.bitCount(a) - C.bitCount(b));
    return rng.chance(0.65) ? pool[0] : rng.pick(pool);
  }

  /* Two disjoint non-empty parts of `color`, preferring parts outside `avoid`. */
  function chooseSplit(color, avoid, rng) {
    const prims = C.primariesOf(color);
    const splits = [];
    for (let mask = 1; mask < (1 << prims.length) - 1; mask++) {
      let a = 0, b = 0;
      prims.forEach((p, i) => { if (mask & (1 << i)) a |= p; else b |= p; });
      if (a < b) splits.push([a, b]);
    }
    const shuffled = rng.shuffle(splits);
    const clean = shuffled.filter(([a, b]) => !avoid.has(a) && !avoid.has(b));
    return (clean.length ? clean : shuffled)[0];
  }

  /* ---------- solution graph ---------- */

  /* Returns the component list, or null when the graph can't honor the
     machinery guarantee and the caller should retry with fresh randomness.

     Guarantee: every goal fed through a prism/condenser wears a color that
     no emitter in the level emits (the forbidden set M). Combined with the
     one-beam-per-well rule this makes the machinery provably required: a
     condenser can never subtract primaries, so a primary-colored goal in M
     needs a prism, and a composite color in M can only be blended. */
  function buildGraph(params, rng) {
    const comps = [];
    const demands = []; // { targetId, color, depth, goalIds, forceEmitter }
    const machineryGoals = new Set();
    const M = new Set(); // machinery goal colors — forbidden for emitters
    const budget = {
      prism: params.prisms || 0,
      condenser: params.condensers || 0,
    };

    const addGoal = (color) => {
      const g = node('goal', { color });
      comps.push(g);
      return g;
    };

    if (params.template === 'first-light') {
      const g = addGoal(rng.pick(C.PRIMARIES));
      demands.push({ targetId: g.id, color: g.color, depth: 0, goalIds: [g.id], forceEmitter: true });
    } else if (params.template === 'duet') {
      const pool = rng.shuffle([...C.PRIMARIES, ...C.SECONDARIES]);
      for (const c of pool.slice(0, 2)) {
        const g = addGoal(c);
        demands.push({ targetId: g.id, color: c, depth: 0, goalIds: [g.id], forceEmitter: true });
      }
    } else if (params.template === 'confluence') {
      // Two primary emitters meet in a condenser feeding a secondary goal.
      const secondary = rng.pick(C.SECONDARIES);
      const g = addGoal(secondary);
      const cond = node('condenser', { targetId: g.id });
      comps.push(cond);
      machineryGoals.add(g.id);
      M.add(secondary);
      for (const p of C.primariesOf(secondary)) {
        demands.push({ targetId: cond.id, color: p, depth: 2, goalIds: [g.id], forceEmitter: true });
      }
    } else if (params.template === 'dispersion') {
      // One white emitter unbraided by a prism into three primary goals.
      const goals = C.PRIMARIES.map((p) => addGoal(p));
      const prism = node('prism', {
        ports: goals.map((g) => ({ primary: g.color, targetId: g.id })),
      });
      comps.push(prism);
      for (const g of goals) { machineryGoals.add(g.id); M.add(g.color); }
      demands.push({ targetId: prism.id, color: C.W, depth: 2, goalIds: goals.map((g) => g.id), forceEmitter: true });
    } else {
      // General level: distinct goal colors, machinery routes decided up
      // front so the forbidden color set M is known before any emitter or
      // split color is chosen.
      const palette = params.allowWhiteGoals
        ? C.ALL
        : [...C.PRIMARIES, ...C.SECONDARIES];
      const colors = rng.shuffle(palette).slice(0, params.goals);
      const goals = colors.map(addGoal);

      const prismGoals = [], condGoals = [], directGoals = [];
      for (const g of rng.shuffle(goals)) {
        const primary = C.bitCount(g.color) === 1;
        if (primary && prismGoals.length < budget.prism * 3 && rng.chance(params.pPrism)) {
          prismGoals.push(g);
        } else if (!primary && condGoals.length < budget.condenser && rng.chance(params.pCondenser)) {
          condGoals.push(g);
        } else {
          directGoals.push(g);
        }
      }
      // A level that budgets machinery must actually use some.
      if (!prismGoals.length && !condGoals.length) {
        const pi = directGoals.findIndex((g) => C.bitCount(g.color) === 1);
        const ci = directGoals.findIndex((g) => C.bitCount(g.color) >= 2);
        if (pi >= 0 && budget.prism > 0) prismGoals.push(...directGoals.splice(pi, 1));
        else if (ci >= 0 && budget.condenser > 0) condGoals.push(...directGoals.splice(ci, 1));
        else return null;
      }
      for (const g of [...prismGoals, ...condGoals]) {
        machineryGoals.add(g.id);
        M.add(g.color);
      }

      // Prisms serve up to three primary goals each (colors are distinct).
      for (let i = 0; i < prismGoals.length; i += 3) {
        const chunk = prismGoals.slice(i, i + 3);
        budget.prism--;
        const inputColor = chooseSuperset(chunk.reduce((m, g) => m | g.color, 0), M, rng);
        const prism = node('prism', {
          ports: C.primariesOf(inputColor).map((p) => {
            const fed = chunk.find((g) => g.color === p);
            return { primary: p, targetId: fed ? fed.id : null };
          }),
        });
        comps.push(prism);
        demands.push({ targetId: prism.id, color: inputColor, depth: 1, goalIds: chunk.map((g) => g.id) });
      }
      for (const g of condGoals) {
        budget.condenser--;
        const cond = node('condenser', { targetId: g.id });
        comps.push(cond);
        for (const part of chooseSplit(g.color, M, rng)) {
          demands.push({ targetId: cond.id, color: part, depth: 1, goalIds: [g.id] });
        }
      }
      for (const g of directGoals) {
        demands.push({ targetId: g.id, color: g.color, depth: 0, goalIds: [g.id] });
      }
    }

    // Resolve the demand chains down to emitters.
    while (demands.length) {
      const d = demands.shift();
      const primary = C.bitCount(d.color) === 1;
      const deep = d.depth >= (params.maxDepth || 2);
      // A demand for a forbidden color must go deeper into machinery; other
      // chain demands occasionally do so for variety.
      const forced = M.has(d.color) && !d.forceEmitter;
      const wantMachinery = forced ||
        (!d.forceEmitter && d.depth >= 1 && !deep && rng.chance(0.25));

      if (wantMachinery && primary && budget.prism > 0) {
        budget.prism--;
        const inputColor = chooseSuperset(d.color, M, rng);
        const prism = node('prism', {
          ports: C.primariesOf(inputColor).map((p) => (
            { primary: p, targetId: p === d.color ? d.targetId : null }
          )),
        });
        comps.push(prism);
        for (const gid of d.goalIds) machineryGoals.add(gid);
        demands.push({ targetId: prism.id, color: inputColor, depth: d.depth + 1, goalIds: d.goalIds });
        continue;
      }
      if (wantMachinery && !primary && budget.condenser > 0) {
        budget.condenser--;
        const cond = node('condenser', { targetId: d.targetId });
        comps.push(cond);
        for (const gid of d.goalIds) machineryGoals.add(gid);
        for (const part of chooseSplit(d.color, M, rng)) {
          demands.push({ targetId: cond.id, color: part, depth: d.depth + 1, goalIds: d.goalIds });
        }
        continue;
      }
      if (forced) return null; // needs machinery it can't afford — reroll

      comps.push(node('emitter', { color: d.color, targetId: d.targetId }));
    }

    // Safety net — the construction above should already guarantee this.
    const goalNodes = comps.filter((n) => n.type === 'goal');
    for (const g of goalNodes) g.viaMachinery = machineryGoals.has(g.id);
    if (comps.some((n) => n.type === 'emitter' && M.has(n.color))) return null;

    for (let i = 0; i < (params.decoys || 0); i++) {
      const palette = C.ALL.filter((c) => !M.has(c));
      comps.push(node('emitter', { color: rng.pick(palette), targetId: null, decoy: true }));
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
    // Raw content extremes — components, sockets, AND the continuous
    // spiral curve itself: the drawn arc sweeps through all angles, so its
    // extremes reach beyond the discrete socket points (worst on sparse
    // levels). Sampled the same way the renderer draws it.
    const xs = [...comps.map((n) => n.x), ...sockets.map((s) => s.x)];
    const ys = [...comps.map((n) => n.y), ...sockets.map((s) => s.y)];
    for (let s2 = 0; s2 <= maxSlot; s2 += 0.2) {
      const r = unit * Math.sqrt(s2 + 0.62);
      const a = s2 * GOLDEN_ANGLE;
      xs.push(r * Math.cos(a));
      ys.push(r * Math.sin(a));
    }
    const bounds = {
      minX: Math.min(...xs), maxX: Math.max(...xs),
      minY: Math.min(...ys), maxY: Math.max(...ys),
    };
    return { sockets, unit, extent, bounds };
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
        // Every prism carries all three ports: players can route ANY color
        // into it at play time, and a primary without an offset would emit
        // at a NaN angle. Extra ports extend the fan outward.
        let spread = Math.max(...Object.values(n.offsets).map(Math.abs));
        for (const prim of C.PRIMARIES) {
          if (n.offsets[prim] === undefined) {
            spread += 0.5;
            n.offsets[prim] = side * spread;
            side = -side;
          }
        }
      }
    }

    for (const n of comps) if (n.solution !== undefined) n.angle = n.solution;
    return true;
  }

  /* ---------- scramble ---------- */

  /* Every rotatable piece starts facing radially out from the board's
     center — a calm starburst instead of a tangle. The unsolved guarantee
     still comes from simulation: in the rare case the radial pose solves
     the level, jitter until it doesn't. */
  function scramble(comps, rng) {
    const rotatable = comps.filter((n) => n.type !== 'goal');
    for (const n of rotatable) n.angle = Math.atan2(n.y, n.x);
    E.simulate(comps);
    if (!E.isSolved(comps)) return true;

    for (let attempt = 1; attempt <= 30; attempt++) {
      const spread = 0.25 * attempt;
      for (const n of rotatable) {
        n.angle = Math.atan2(n.y, n.x) + rng.range(-spread, spread);
      }
      E.simulate(comps);
      if (!E.isSolved(comps)) return true;
    }
    return false;
  }

  /* ---------- top level ---------- */

  function generate(gameSeed, levelNumber) {
    for (let graphTry = 0; graphTry < 30; graphTry++) {
      const rng = NS.makeRng(`${gameSeed}:${levelNumber}:${graphTry}`);
      nextId = 1;
      const params = levelParams(levelNumber, rng);
      const comps = buildGraph(params, rng);
      if (!comps) continue; // machinery guarantee violated — reroll the graph

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
          bounds: layout.bounds,
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
    return { level: levelNumber, seed: `${gameSeed}:${levelNumber}`, comps, sockets: layout.sockets, unit: layout.unit, extent: layout.extent, bounds: layout.bounds, fallback: true };
  }

  NS.GEN = { generate, levelParams, GOLDEN_ANGLE, PHI, wrapAngle };
})(globalThis.LW = globalThis.LW || {});
