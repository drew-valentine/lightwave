# Lightwave

A browser puzzle game about the properties of light. Aim beams, blend colors,
split white into its primaries, and feed every well the one color it thirsts for.

**Play:** open `index.html` in any modern browser (no build step, no dependencies),
or serve the folder: `python3 -m http.server 8642` → http://localhost:8642

## How it plays

Light is additive. Red, green, and blue are the primaries; overlap them and you
get yellow (R+G), magenta (R+B), cyan (G+B), and white (R+G+B). Black is simply
the dark — the absence of light.

| Piece | What it does |
|---|---|
| **Emitter** | Emits one directional beam of a fixed color. Drag to aim. |
| **Condenser** | Blends every beam it drinks into one combined beam. Drag to aim its output. |
| **Prism** | Unbraids an incoming beam into its primary components, fanned across its ports. Drag to rotate the fan. |
| **Well (goal)** | Thirsts for exactly one color, carried on a **single beam**. Feed it precisely that — no more, no less. |

Satisfy every well to resolve the level. Beams are intercepted by the first
piece in their path, so routing matters as much as color. Wells refuse
crowds: two beams into one well overload it even if their colors blend
correctly — blending is the condenser's job.

## Levels

Levels are procedurally generated and provably solvable: each level is built
backwards from its goals into a solution graph, embedded on a golden-angle
phyllotaxis spiral, verified end-to-end by the actual beam engine in its
solution state, then scrambled — and the scramble is verified *unsolved*.
Generation is seeded and deterministic; every level is distinct.

Machinery is never decorative: any well fed through a prism or condenser in
the solution gets a color that no emitter in the level emits. Since a well
accepts only a single beam, and a condenser can never *remove* primaries,
such wells provably cannot be satisfied without the machinery.

The first levels introduce the pieces one at a time; difficulty then grows on a
Fibonacci-paced schedule (more wells, prisms, condensers, and eventually decoy
emitters whose light belongs nowhere).

## Development

- Plain JavaScript, zero dependencies. `js/engine.js` (beam simulation) and
  `js/gen.js` (level generation) are DOM-free.
- Run the solvability proof: `node test/solvability.js`
  (3 seeds × 40 levels: solvable, unsolved at start, deterministic, distinct).
