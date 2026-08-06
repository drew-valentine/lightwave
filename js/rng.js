/* Lightwave — seeded RNG utilities (mulberry32) */
(function (NS) {
  'use strict';

  function hashString(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeRng(seedStr) {
    const rand = mulberry32(hashString(seedStr));
    return {
      next: rand,
      range(min, max) { return min + rand() * (max - min); },
      int(min, max) { return Math.floor(min + rand() * (max - min + 1)); },
      pick(arr) { return arr[Math.floor(rand() * arr.length)]; },
      chance(p) { return rand() < p; },
      shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          const t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
      },
    };
  }

  NS.hashString = hashString;
  NS.makeRng = makeRng;
})(globalThis.LW = globalThis.LW || {});
