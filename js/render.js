/* Lightwave — canvas rendering. Deep indigo void, additive glow beams,
   phyllotaxis sockets etched faintly beneath the components. */
(function (NS) {
  'use strict';

  const C = NS.COLOR;
  const E = NS.ENGINE;

  function lw(px, view) {
    return Math.max(1.25, px * view.scale);
  }

  function withAlpha(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function drawBackground(ctx, w, h, view) {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
    grad.addColorStop(0, '#0b0e1d');
    grad.addColorStop(0.55, '#070912');
    grad.addColorStop(1, '#04050b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  /* The signature: the golden spiral the level grows on, with unlit sockets. */
  function drawSpiral(ctx, level, view, t) {
    const { sockets } = level;
    if (!sockets || sockets.length < 2) return;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(120,140,220,0.10)';
    ctx.beginPath();
    // Smooth spiral through continuous parameter, not just socket points.
    const maxIdx = sockets[sockets.length - 1].index;
    for (let s = 0; s <= maxIdx; s += 0.05) {
      const r = level.unit * Math.sqrt(s + 0.62);
      const a = s * NS.GEN.GOLDEN_ANGLE;
      const p = view.toScreen(r * Math.cos(a), r * Math.sin(a));
      if (s === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    for (const s of sockets) {
      const p = view.toScreen(s.x, s.y);
      const tw = 0.20 + 0.08 * Math.sin(t * 0.0006 + s.index * 1.7);
      ctx.fillStyle = `rgba(140,160,235,${tw})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.5, 3.5 * view.scale), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBeams(ctx, beams, view, t, reducedMotion) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    for (const b of beams) {
      const p1 = view.toScreen(b.x1, b.y1);
      const p2 = view.toScreen(b.x2, b.y2);
      const hex = C.HEX[b.color] || '#ffffff';
      const core = C.CORE_HEX[b.color] || '#ffffff';

      ctx.strokeStyle = withAlpha(hex, 0.07);
      ctx.lineWidth = 16 * view.scale;
      line(ctx, p1, p2);

      ctx.strokeStyle = withAlpha(hex, 0.22);
      ctx.lineWidth = 6 * view.scale;
      line(ctx, p1, p2);

      ctx.strokeStyle = withAlpha(core, 0.9);
      ctx.lineWidth = 1.8 * view.scale;
      line(ctx, p1, p2);

      if (!reducedMotion) {
        // Light flowing along the beam.
        ctx.strokeStyle = withAlpha('#ffffff', 0.5);
        ctx.lineWidth = 2.6 * view.scale;
        ctx.setLineDash([3 * view.scale, 34 * view.scale]);
        ctx.lineDashOffset = -(t * 0.09) % (37 * view.scale);
        line(ctx, p1, p2);
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }

  function line(ctx, p1, p2) {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  function drawEmitter(ctx, n, view, hot) {
    const p = view.toScreen(n.x, n.y);
    const r = E.HIT_RADIUS.emitter * view.scale;
    const hex = C.HEX[n.color];

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(n.angle);

    // Housing.
    ctx.strokeStyle = hot ? 'rgba(230,238,255,0.95)' : 'rgba(176,190,235,0.8)';
    ctx.lineWidth = lw(1.6, view);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    // Nozzle wedge pointing along the beam.
    ctx.fillStyle = hot ? 'rgba(230,238,255,0.95)' : 'rgba(176,190,235,0.85)';
    ctx.beginPath();
    ctx.moveTo(r * 1.05, 0);
    ctx.lineTo(r * 0.45, -r * 0.34);
    ctx.lineTo(r * 0.45, r * 0.34);
    ctx.closePath();
    ctx.fill();

    // Glowing core in the emitter's color.
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.62);
    g.addColorStop(0, withAlpha(hex, 0.95));
    g.addColorStop(1, withAlpha(hex, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.CORE_HEX[n.color];
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCondenser(ctx, n, view, hot) {
    const p = view.toScreen(n.x, n.y);
    const r = E.HIT_RADIUS.condenser * view.scale;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(n.angle);

    ctx.strokeStyle = hot ? 'rgba(230,238,255,0.95)' : 'rgba(176,190,235,0.8)';
    ctx.lineWidth = lw(1.6, view);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
    ctx.stroke();

    // Output nozzle.
    ctx.fillStyle = hot ? 'rgba(230,238,255,0.95)' : 'rgba(176,190,235,0.85)';
    ctx.beginPath();
    ctx.moveTo(r * 1.18, 0);
    ctx.lineTo(r * 0.72, -r * 0.28);
    ctx.lineTo(r * 0.72, r * 0.28);
    ctx.closePath();
    ctx.fill();

    // Blended pool of whatever it is drinking.
    if (n.input) {
      const hex = C.HEX[n.input];
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.52);
      g.addColorStop(0, withAlpha(hex, 0.9));
      g.addColorStop(1, withAlpha(hex, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPrism(ctx, n, view, hot) {
    const p = view.toScreen(n.x, n.y);
    const r = E.HIT_RADIUS.prism * view.scale;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Port ticks: where each primary would leave, in its color.
    for (const prim of C.PRIMARIES) {
      if (n.offsets[prim] === undefined) continue;
      const a = n.angle + n.offsets[prim];
      const active = (n.input & prim) !== 0;
      ctx.strokeStyle = withAlpha(C.HEX[prim], active ? 0.95 : 0.45);
      ctx.lineWidth = lw(2.4, view);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72);
      ctx.lineTo(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05);
      ctx.stroke();
    }

    ctx.rotate(n.angle);
    ctx.strokeStyle = hot ? 'rgba(230,238,255,0.95)' : 'rgba(186,198,240,0.85)';
    ctx.lineWidth = lw(1.8, view);
    // Equilateral triangle, apex along the mean output direction.
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = (i * 2 * Math.PI) / 3;
      const x = Math.cos(a) * r * 0.7;
      const y = Math.sin(a) * r * 0.7;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    // Facet line.
    ctx.strokeStyle = 'rgba(186,198,240,0.4)';
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, 0);
    ctx.lineTo(r * 0.7, 0);
    ctx.stroke();

    if (n.input) {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.5);
      g.addColorStop(0, withAlpha(C.HEX[n.input], 0.55));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGoal(ctx, n, view, t, reducedMotion) {
    const p = view.toScreen(n.x, n.y);
    const r = E.HIT_RADIUS.goal * view.scale;
    const hex = C.HEX[n.color];
    const state = E.goalState(n);

    ctx.save();
    ctx.translate(p.x, p.y);

    // Faint colored halo so every well is visible from across the board.
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.5);
    halo.addColorStop(0, withAlpha(hex, 0.16));
    halo.addColorStop(1, withAlpha(hex, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    if (state === 'satisfied') {
      const pulse = reducedMotion ? 1 : 1 + 0.06 * Math.sin(t * 0.004);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.7 * pulse);
      g.addColorStop(0, withAlpha(hex, 0.85));
      g.addColorStop(0.4, withAlpha(hex, 0.25));
      g.addColorStop(1, withAlpha(hex, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.7 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = C.CORE_HEX[n.color];
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = withAlpha(hex, 0.95);
    } else if (state === 'overloaded') {
      ctx.strokeStyle = 'rgba(255,107,107,0.75)';
      ctx.lineWidth = lw(1.4, view);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = withAlpha(hex, 0.6);
    } else {
      ctx.strokeStyle = withAlpha(hex, state === 'partial' ? 0.95 : 0.8);
    }

    // The well: concentric rings in the color it thirsts for.
    ctx.lineWidth = lw(1.8, view);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = lw(1.2, view);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
    ctx.stroke();

    if (state !== 'satisfied') {
      // Hollow center awaiting its color.
      ctx.fillStyle = withAlpha(hex, state === 'dark' ? 0.4 : 0.6);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawComponents(ctx, level, view, t, hotId, reducedMotion) {
    for (const n of level.comps) {
      const hot = n.id === hotId;
      if (n.type === 'goal') drawGoal(ctx, n, view, t, reducedMotion);
      else if (n.type === 'emitter') drawEmitter(ctx, n, view, hot);
      else if (n.type === 'condenser') drawCondenser(ctx, n, view, hot);
      else if (n.type === 'prism') drawPrism(ctx, n, view, hot);
    }
  }

  NS.RENDER = { drawBackground, drawSpiral, drawBeams, drawComponents, withAlpha };
})(globalThis.LW = globalThis.LW || {});
