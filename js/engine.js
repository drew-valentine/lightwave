/* Lightwave — beam propagation engine (DOM-free, deterministic).
   Components live in world coordinates centered on (0,0).
   Beams travel until they hit the first intercepting component's circle.
   Emitters are transparent to beams; prisms, condensers and goals intercept.
   Colors only accumulate (bitwise OR), so fixed-point iteration converges. */
(function (NS) {
  'use strict';

  const C = NS.COLOR;

  const HIT_RADIUS = { emitter: 22, condenser: 30, prism: 32, goal: 30 };
  const WORLD_RADIUS = 480;
  const FAR = WORLD_RADIUS * 4;

  function intercepts(node) {
    return node.type !== 'emitter';
  }

  /* Nearest circle hit along ray from (x,y) toward angle, excluding source. */
  function castRay(x, y, angle, comps, sourceId) {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    let best = null;
    for (const n of comps) {
      if (n.id === sourceId || !intercepts(n)) continue;
      const r = HIT_RADIUS[n.type];
      const fx = n.x - x, fy = n.y - y;
      const tCenter = fx * dx + fy * dy;           // projection onto ray
      if (tCenter < 1e-6) continue;
      const perp2 = fx * fx + fy * fy - tCenter * tCenter;
      if (perp2 > r * r) continue;
      const t = tCenter - Math.sqrt(r * r - perp2); // entry point
      if (t > 1e-6 && (!best || t < best.t)) best = { node: n, t };
    }
    if (!best) return null;
    return { node: best.node, t: best.t, px: x + dx * best.t, py: y + dy * best.t };
  }

  /* Simulate steady-state light. Mutates each comp's `input` (received color mask)
     and returns { beams } — segments for rendering:
     { x1, y1, x2, y2, color, srcId, hitId } */
  function simulate(comps) {
    let prev = new Map();   // node id -> output color for condensers/prisms
    let beams = [];
    let inputs = new Map();
    let counts = new Map(); // node id -> number of beams arriving
    const maxIters = comps.length * 3 + 4;

    for (let iter = 0; iter < maxIters; iter++) {
      beams = [];
      inputs = new Map();
      counts = new Map();

      const emit = (src, angle, color) => {
        if (!color) return;
        const hit = castRay(src.x, src.y, angle, comps, src.id);
        const x2 = hit ? hit.px : src.x + Math.cos(angle) * FAR;
        const y2 = hit ? hit.py : src.y + Math.sin(angle) * FAR;
        beams.push({ x1: src.x, y1: src.y, x2, y2, color, srcId: src.id, hitId: hit ? hit.node.id : null });
        if (hit) {
          inputs.set(hit.node.id, (inputs.get(hit.node.id) || 0) | color);
          counts.set(hit.node.id, (counts.get(hit.node.id) || 0) + 1);
        }
      };

      for (const n of comps) {
        if (n.type === 'emitter') {
          emit(n, n.angle, n.color);
        } else if (n.type === 'condenser') {
          emit(n, n.angle, prev.get(n.id) || 0);
        } else if (n.type === 'prism') {
          const col = prev.get(n.id) || 0;
          for (const p of C.primariesOf(col)) emit(n, n.angle + n.offsets[p], p);
        }
      }

      const next = new Map();
      let stable = true;
      for (const n of comps) {
        if (n.type === 'condenser' || n.type === 'prism') {
          const v = inputs.get(n.id) || 0;
          next.set(n.id, v);
          if (v !== (prev.get(n.id) || 0)) stable = false;
        }
      }
      prev = next;
      if (stable) break;
    }

    for (const n of comps) {
      n.input = inputs.get(n.id) || 0;
      n.beamCount = counts.get(n.id) || 0;
    }
    return { beams };
  }

  /* A well thirsts for exactly one color, carried on a single beam.
     Blending must happen in condensers — never at the well itself. */
  function goalState(goal) {
    if (goal.input === goal.color && goal.beamCount === 1) return 'satisfied';
    if ((goal.input & ~goal.color) !== 0 || goal.beamCount > 1) return 'overloaded';
    return goal.input === 0 ? 'dark' : 'partial';
  }

  function isSolved(comps) {
    return comps.every((n) => n.type !== 'goal' || (n.input === n.color && n.beamCount === 1));
  }

  NS.ENGINE = { HIT_RADIUS, WORLD_RADIUS, FAR, castRay, simulate, isSolved, goalState, intercepts };
})(globalThis.LW = globalThis.LW || {});
