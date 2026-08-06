/* Lightwave — game shell: state, input, HUD, loop. */
(function (NS) {
  'use strict';

  const C = NS.COLOR;
  const E = NS.ENGINE;

  const INTRO_LINES = {
    1: 'Drag the emitter to aim its beam into the well.',
    2: 'Two beams, two wells. Each well accepts a single beam of its one color.',
    3: 'Wells refuse crowds — blend beams in the condenser, then deliver one.',
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
    winFx: null,        // dissolve particle system during the win moment
    startedAt: 0,
    hover: { id: null, since: 0 }, // component under the pointer, for color labels
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
    const compact = Math.min(w, h) < 640;
    const extent = state.level ? state.level.extent : E.WORLD_RADIUS + 80;
    view.scale = Math.min(w - (compact ? 20 : 40), h - (compact ? 112 : 150)) / (extent * 2);
    view.cx = w / 2;
    view.cy = h / 2 - (compact ? 8 : 0);
  }
  window.addEventListener('resize', resize);

  /* ---------- HUD ---------- */

  const hud = {
    levelNo: document.getElementById('level-no'),
    goals: document.getElementById('goal-chips'),
    hint: document.getElementById('hint'),
    legend: document.getElementById('legend'),
    winBanner: document.getElementById('win-banner'),
    winNumeral: document.getElementById('win-numeral'),
    badge: document.getElementById('level-badge'),
    overlay: document.getElementById('level-overlay'),
    grid: document.getElementById('level-grid'),
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

  function maxLevel() {
    const m = parseInt(localStorage.getItem('lw_max') || '1', 10);
    const cur = parseInt(localStorage.getItem('lw_level') || '1', 10);
    return Math.max(Number.isFinite(m) ? m : 1, Number.isFinite(cur) ? cur : 1, 1);
  }

  function loadLevel(n) {
    state.level = NS.GEN.generate(state.gameSeed, n);
    resize();
    state.beams = E.simulate(state.level.comps).beams;
    state.winAt = 0;
    state.startedAt = performance.now();
    localStorage.setItem('lw_level', String(n));
    localStorage.setItem('lw_max', String(Math.max(n, maxLevel())));
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

  /* The win: the level dissolves into light that spirals home to the
     center, and where it converges the next level's numeral arrives.
     0.00s  the last beam lands, wells flare — instant payoff
     0.35s  the board dissolves into particles streaming to the heart
     1.05s  the next numeral fades up where the light converged
     2.70s  the next level blooms in (tap anywhere to skip ahead)      */
  let winTimer = 0;

  function onWin() {
    state.winAt = performance.now();
    state.winFx = buildWinFx(state.level, state.beams);
    hud.winNumeral.textContent = roman(state.level.level + 1);
    hud.winBanner.classList.add('visible');
    winTimer = setTimeout(advance, state.reducedMotion ? 1900 : 2700);
  }

  function advance() {
    clearTimeout(winTimer);
    state.winFx = null;
    loadLevel(state.level.level + 1);
  }

  /* Break the solved level into particles: beams shed light along their
     length, components burst into rings. Everything spirals home. */
  function buildWinFx(level, beams) {
    const parts = [];
    const push = (x, y, color, delay) => {
      const r = Math.hypot(x, y);
      parts.push({ r0: r, a0: Math.atan2(y, x), color, delay });
    };
    for (const b of beams) {
      const len = Math.hypot(b.x2 - b.x1, b.y2 - b.y1);
      const n = Math.min(26, Math.max(3, Math.floor(len / 34)));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        push(
          b.x1 + (b.x2 - b.x1) * t,
          b.y1 + (b.y2 - b.y1) * t,
          b.color,
          t * 0.3 + Math.random() * 0.12
        );
      }
    }
    for (const c of level.comps) {
      const rad = E.HIT_RADIUS[c.type] * 0.8;
      const color = c.color || 0;
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        push(c.x + Math.cos(a) * rad, c.y + Math.sin(a) * rad, color, Math.random() * 0.18);
      }
    }
    return { parts: parts.slice(0, 900), start: performance.now() };
  }

  /* ---------- input: drag to rotate ---------- */

  const GRAB_RADIUS = 52;         // world units
  const SNAP_MOUSE = 0.055;       // radians (~3°) of aim assist
  const SNAP_TOUCH = 0.1;         // fingers deserve more forgiveness (~6°)
  const TOUCH_TARGET_PX = 44;     // minimum on-screen touch target
  const DRAG_DEADZONE_PX = 24;    // ignore angle updates this close to the pivot

  /* Grab radius in world units, floored to a comfortable on-screen target.
     On phones the view scale shrinks; the finger target must not. */
  function grabRadiusWorld(pointerType) {
    const px = pointerType === 'touch' ? TOUCH_TARGET_PX : 28;
    return Math.max(GRAB_RADIUS, px / view.scale);
  }

  function findNear(wx, wy, includeGoals, radius) {
    const r = radius || GRAB_RADIUS;
    let best = null, bestD = Infinity;
    for (const n of state.level.comps) {
      if (!includeGoals && n.type === 'goal') continue;
      const d = Math.hypot(n.x - wx, n.y - wy);
      if (d < r && d < bestD) { best = n; bestD = d; }
    }
    return best;
  }

  function findGrabbable(wx, wy, pointerType) {
    return findNear(wx, wy, false, grabRadiusWorld(pointerType));
  }

  /* Aim assist: snap the raw angle toward directions that point a beam
     (or a prism port) at another component's center. */
  function snapAngle(node, raw, tolerance) {
    const offs = node.type === 'prism'
      ? Object.values(node.offsets)
      : [0];
    let best = raw, bestDiff = tolerance;
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

  let touchLabelTimer = 0;

  canvas.addEventListener('pointerdown', (ev) => {
    if (state.winAt) { advance(); return; } // tap anywhere to skip ahead
    clearTimeout(touchLabelTimer);
    const w = view.toWorld(ev.clientX, ev.clientY);
    const node = findGrabbable(w.x, w.y, ev.pointerType);
    if (node) {
      state.dragging = { node, pointerType: ev.pointerType };
      state.hotId = node.id;
      if (state.hover.id !== node.id) state.hover = { id: node.id, since: performance.now() };
      try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* pointer already gone */ }
      canvas.classList.add('grabbing');
      return;
    }
    // Touch has no hover: tapping a well reveals its color label briefly.
    if (ev.pointerType === 'touch') {
      const over = findNear(w.x, w.y, true, grabRadiusWorld('touch'));
      if (over) {
        state.hover = { id: over.id, since: performance.now() };
        touchLabelTimer = setTimeout(() => { state.hover = { id: null, since: 0 }; }, 1600);
      }
    }
  });

  canvas.addEventListener('pointermove', (ev) => {
    const w = view.toWorld(ev.clientX, ev.clientY);
    if (state.dragging) {
      const n = state.dragging.node;
      // A finger right on the pivot gives meaningless, jittery angles.
      const distPx = Math.hypot(w.x - n.x, w.y - n.y) * view.scale;
      if (distPx < DRAG_DEADZONE_PX) return;
      const raw = Math.atan2(w.y - n.y, w.x - n.x);
      const snap = snapAngle(n, raw, state.dragging.pointerType === 'touch' ? SNAP_TOUCH : SNAP_MOUSE);
      n.angle = snap.angle;
      state.dragging.snapped = snap.snapped;
      resim();
    } else if (ev.pointerType !== 'touch') {
      const grab = findGrabbable(w.x, w.y, ev.pointerType);
      state.hotId = grab ? grab.id : null;
      canvas.classList.toggle('grab', !!grab);
      const over = findNear(w.x, w.y, true);
      if ((over && over.id) !== state.hover.id) {
        state.hover = { id: over ? over.id : null, since: performance.now() };
      }
    }
  });

  function endDrag(ev) {
    if (!state.dragging) return;
    const wasTouch = state.dragging.pointerType === 'touch';
    state.dragging = null;
    canvas.classList.remove('grabbing');
    resim(); // win check happens once the piece is released
    if (wasTouch) {
      // Let the label linger a moment, then clear — there is no hover-out on touch.
      clearTimeout(touchLabelTimer);
      touchLabelTimer = setTimeout(() => { state.hover = { id: null, since: 0 }; }, 900);
      state.hotId = null;
    }
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  document.getElementById('btn-reset').addEventListener('click', () => {
    loadLevel(state.level.level);
  });

  /* ---------- level selector ---------- */

  function openSelector() {
    hud.grid.innerHTML = '';
    const top = maxLevel();
    for (let n = 1; n <= top; n++) {
      const cell = document.createElement('button');
      cell.className = 'level-cell' + (n === state.level.level ? ' current' : '');
      cell.textContent = roman(n);
      cell.setAttribute('aria-label', `Level ${n}`);
      cell.addEventListener('click', () => {
        closeSelector();
        if (n !== state.level.level) loadLevel(n);
      });
      hud.grid.appendChild(cell);
    }
    hud.overlay.hidden = false;
    requestAnimationFrame(() => hud.overlay.classList.add('open'));
    const current = hud.grid.querySelector('.current') || hud.grid.firstChild;
    if (current) current.focus();
  }

  function closeSelector() {
    hud.overlay.classList.remove('open');
    hud.overlay.hidden = true;
    hud.badge.focus();
  }

  function selectorOpen() {
    return !hud.overlay.hidden;
  }

  hud.badge.addEventListener('click', () => {
    if (selectorOpen()) closeSelector(); else openSelector();
  });
  hud.overlay.addEventListener('click', (ev) => {
    if (ev.target === hud.overlay) closeSelector();
  });
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && selectorOpen()) closeSelector();
  });

  /* ---------- main loop ---------- */

  function frame(t) {
    const w = window.innerWidth, h = window.innerHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    NS.RENDER.drawBackground(ctx, w, h, view);

    // During the win the solid board dissolves out under the particles.
    let boardAlpha = 1;
    if (state.winAt) {
      boardAlpha = state.reducedMotion
        ? 0
        : Math.max(0, 1 - (t - state.winAt - 350) / 450);
    }
    if (boardAlpha > 0) {
      ctx.globalAlpha = boardAlpha;
      NS.RENDER.drawSpiral(ctx, state.level, view, t);
      NS.RENDER.drawBeams(ctx, state.beams, view, t, state.reducedMotion);
      NS.RENDER.drawComponents(ctx, state.level, view, t, state.hotId, state.reducedMotion);
      ctx.globalAlpha = 1;
    }

    if (state.winFx && !state.reducedMotion) {
      NS.RENDER.drawWinFx(ctx, state.winFx, view, t);
    }

    if (!state.winAt && state.hover.id !== null) {
      const n = state.level.comps.find((c) => c.id === state.hover.id);
      if (n) {
        const alpha = Math.min(1, (t - state.hover.since) / 220);
        NS.RENDER.drawLabel(ctx, n, view, alpha);
      }
    }
    NS.RENDER.drawGrain(ctx, canvas.width, canvas.height);
    requestAnimationFrame(frame);
  }

  resize();
  const saved = parseInt(localStorage.getItem('lw_level') || '1', 10);
  loadLevel(Number.isFinite(saved) && saved >= 1 ? saved : 1);
  requestAnimationFrame(frame);
})(globalThis.LW = globalThis.LW || {});
