/* Lightwave — game shell: state, input, HUD, loop. */
(function (NS) {
  'use strict';

  const C = NS.COLOR;
  const E = NS.ENGINE;

  const INTRO_LINES = {
    1: 'Drag the emitter to aim its beam into the well.',
    2: 'Two beams, two wells. Every well thirsts for one color.',
    3: 'The condenser blends every beam it drinks into one.',
    4: 'The prism unbraids light into its primaries.',
    5: 'Condense. Disperse. Resolve.',
    8: 'Some light belongs nowhere. Aim it into the dark.',
  };

  const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'];
  function roman(n) {
    if (n <= 20) return ROMAN[n - 1];
    return String(n);
  }

  const state = {
    gameSeed: 'aurora',
    level: null,
    beams: [],
    dragging: null,     // { node, snapped }
    hotId: null,
    winAt: 0,           // timestamp when win detected, 0 = not won
    startedAt: 0,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };

  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');

  const view = {
    scale: 1, cx: 0, cy: 0,
    toScreen(wx, wy) { return { x: this.cx + wx * this.scale, y: this.cy + wy * this.scale }; },
    toWorld(sx, sy) { return { x: (sx - this.cx) / this.scale, y: (sy - this.cy) / this.scale }; },
  };

  let dpr = 1;
  function resize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    const w = window.innerWidth, h = window.innerHeight;
    const extent = state.level ? state.level.extent : E.WORLD_RADIUS + 80;
    view.scale = Math.min(w - 40, h - 150) / (extent * 2);
    view.cx = w / 2;
    view.cy = h / 2;
  }
  window.addEventListener('resize', resize);

  /* ---------- HUD ---------- */

  const hud = {
    levelNo: document.getElementById('level-no'),
    goals: document.getElementById('goal-chips'),
    hint: document.getElementById('hint'),
    legend: document.getElementById('legend'),
    winBanner: document.getElementById('win-banner'),
  };

  function refreshGoalChips() {
    const goals = state.level.comps.filter((n) => n.type === 'goal');
    hud.goals.innerHTML = '';
    for (const g of goals) {
      const chip = document.createElement('span');
      const s = E.goalState(g);
      chip.className = 'chip ' + s;
      chip.style.setProperty('--c', C.HEX[g.color]);
      chip.title = C.NAMES[g.color];
      hud.goals.appendChild(chip);
    }
  }

  function refreshHud() {
    hud.levelNo.textContent = roman(state.level.level);
    let line = '';
    for (const k of Object.keys(INTRO_LINES)) {
      if (Number(k) === state.level.level) line = INTRO_LINES[k];
    }
    hud.hint.textContent = line;
    hud.legend.classList.toggle('visible', state.level.level >= 3);
    refreshGoalChips();
  }

  /* ---------- level flow ---------- */

  function loadLevel(n) {
    state.level = NS.GEN.generate(state.gameSeed, n);
    resize();
    state.beams = E.simulate(state.level.comps).beams;
    state.winAt = 0;
    state.startedAt = performance.now();
    localStorage.setItem('lw_level', String(n));
    hud.winBanner.classList.remove('visible');
    document.body.classList.add('level-enter');
    setTimeout(() => document.body.classList.remove('level-enter'), 900);
    refreshHud();
  }

  function resim() {
    state.beams = E.simulate(state.level.comps).beams;
    refreshGoalChips();
    if (!state.winAt && E.isSolved(state.level.comps) && !state.dragging) {
      onWin();
    }
  }

  function onWin() {
    state.winAt = performance.now();
    hud.winBanner.classList.add('visible');
    setTimeout(() => loadLevel(state.level.level + 1), 1800);
  }

  /* ---------- input: drag to rotate ---------- */

  const GRAB_RADIUS = 52;
  const SNAP = 0.055; // radians (~3°) of aim assist

  function findGrabbable(wx, wy) {
    let best = null, bestD = Infinity;
    for (const n of state.level.comps) {
      if (n.type === 'goal') continue;
      const d = Math.hypot(n.x - wx, n.y - wy);
      if (d < GRAB_RADIUS && d < bestD) { best = n; bestD = d; }
    }
    return best;
  }

  /* Aim assist: snap the raw angle toward directions that point a beam
     (or a prism port) at another component's center. */
  function snapAngle(node, raw) {
    const offs = node.type === 'prism'
      ? Object.values(node.offsets)
      : [0];
    let best = raw, bestDiff = SNAP;
    for (const other of state.level.comps) {
      if (other.id === node.id || !E.intercepts(other)) continue;
      const dir = Math.atan2(other.y - node.y, other.x - node.x);
      for (const off of offs) {
        const cand = dir - off;
        const diff = Math.abs(NS.GEN.wrapAngle(cand - raw));
        if (diff < bestDiff) { best = cand; bestDiff = diff; }
      }
    }
    return { angle: best, snapped: best !== raw };
  }

  canvas.addEventListener('pointerdown', (ev) => {
    if (state.winAt) return;
    const w = view.toWorld(ev.clientX, ev.clientY);
    const node = findGrabbable(w.x, w.y);
    if (!node) return;
    state.dragging = { node };
    state.hotId = node.id;
    canvas.setPointerCapture(ev.pointerId);
    canvas.classList.add('grabbing');
  });

  canvas.addEventListener('pointermove', (ev) => {
    const w = view.toWorld(ev.clientX, ev.clientY);
    if (state.dragging) {
      const n = state.dragging.node;
      const raw = Math.atan2(w.y - n.y, w.x - n.x);
      const snap = snapAngle(n, raw);
      n.angle = snap.angle;
      state.dragging.snapped = snap.snapped;
      resim();
    } else {
      const over = findGrabbable(w.x, w.y);
      state.hotId = over ? over.id : null;
      canvas.classList.toggle('grab', !!over);
    }
  });

  function endDrag() {
    if (!state.dragging) return;
    state.dragging = null;
    canvas.classList.remove('grabbing');
    resim(); // win check happens once the piece is released
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  document.getElementById('btn-reset').addEventListener('click', () => {
    loadLevel(state.level.level);
  });

  /* ---------- main loop ---------- */

  function frame(t) {
    const w = window.innerWidth, h = window.innerHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    NS.RENDER.drawBackground(ctx, w, h, view);
    NS.RENDER.drawSpiral(ctx, state.level, view, t);
    NS.RENDER.drawBeams(ctx, state.beams, view, t, state.reducedMotion);
    NS.RENDER.drawComponents(ctx, state.level, view, t, state.hotId, state.reducedMotion);
    requestAnimationFrame(frame);
  }

  resize();
  const saved = parseInt(localStorage.getItem('lw_level') || '1', 10);
  loadLevel(Number.isFinite(saved) && saved >= 1 ? saved : 1);
  requestAnimationFrame(frame);
})(globalThis.LW = globalThis.LW || {});
