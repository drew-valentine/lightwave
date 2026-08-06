/* Lightwave — additive light color math.
   Light is a 3-bit mask: R=4, G=2, B=1. Secondaries/white are unions.
   K (black) is 0 — the absence of light. */
(function (NS) {
  'use strict';

  const R = 4, G = 2, B = 1;
  const PRIMARIES = [R, G, B];

  const NAMES = {
    [R]: 'Red',
    [G]: 'Green',
    [B]: 'Blue',
    [R | G]: 'Yellow',
    [R | B]: 'Magenta',
    [G | B]: 'Cyan',
    [R | G | B]: 'White',
    0: 'Dark',
  };

  /* Stylized spectrum tuned for glow on a deep indigo field. */
  const HEX = {
    [R]: '#ff3b52',
    [G]: '#3bf58a',
    [B]: '#4a7dff',
    [R | G]: '#ffd23b',
    [R | B]: '#f04ae0',
    [G | B]: '#3be5f5',
    [R | G | B]: '#f6f8ff',
  };

  /* Brighter cores for beam centers. */
  const CORE_HEX = {
    [R]: '#ffb3bd',
    [G]: '#c8ffdf',
    [B]: '#c3d4ff',
    [R | G]: '#fff0b8',
    [R | B]: '#ffc9f7',
    [G | B]: '#ccf9ff',
    [R | G | B]: '#ffffff',
  };

  function primariesOf(color) {
    return PRIMARIES.filter((p) => (color & p) !== 0);
  }

  function bitCount(color) {
    return primariesOf(color).length;
  }

  /* Split a color's bits into two disjoint non-empty parts (for condenser demands). */
  function splitColor(color, rng) {
    const prims = rng.shuffle(primariesOf(color));
    if (prims.length < 2) return null;
    const cut = rng.int(1, prims.length - 1);
    const a = prims.slice(0, cut).reduce((m, p) => m | p, 0);
    const b = prims.slice(cut).reduce((m, p) => m | p, 0);
    return [a, b];
  }

  NS.COLOR = {
    R, G, B,
    W: R | G | B,
    Y: R | G,
    M: R | B,
    C: G | B,
    PRIMARIES,
    SECONDARIES: [R | G, R | B, G | B],
    ALL: [R, G, B, R | G, R | B, G | B, R | G | B],
    NAMES, HEX, CORE_HEX,
    primariesOf, bitCount, splitColor,
  };
})(globalThis.LW = globalThis.LW || {});
