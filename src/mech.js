// mech.js — the mech the board shows, put together from its layers on one bench: a frame, an armour line, a backpack, and
// weapons. The model faces +Z, stands on y = 0, and its own left is +X. No skin: every part is rigid and rides its joint.
import { bench, finish, setPalette, PALETTES, BUILD_DEFAULT } from './bench.js';
import { HEAVY_MECH_03 } from './models/heavy_mech_03.js';

export { setPalette, PALETTES, BUILD_DEFAULT };
export const MODEL = HEAVY_MECH_03;
// the motions belong to the frame: every frame brings its own
export const MOTIONS = MODEL.frame.motions.MOTIONS, walkSpeed = MODEL.frame.motions.walkSpeed;

// frameOnly leaves the armour, the backpack and the weapons off: the frame as it is underneath
export function buildMech(build = BUILD_DEFAULT, palette = PALETTES.olive, { model = MODEL, frameOnly = false } = {}) {
  const P = { ...BUILD_DEFAULT, ...build };
  const B = bench(palette);
  // each layer in turn; whatever it added to the tree is marked as its own
  const layer = (tag, make) => { const got = make(); B.root.traverse((o) => { if (!B.made.has(o)) B.made.set(o, tag); }); return got; };
  const F = layer('F', () => model.frame.build(B, P));
  const gear = [];                                 // what the frame carries: it joins in the motions
  if (!frameOnly) {
    layer('A', () => model.armor.build(B, F));
    layer('P', () => model.backpack.build(B, F)); gear.push(model.backpack);
    for (const w of model.weapons) { layer('W', () => w.build(B, F)); gear.push(w); }
  }
  const done = finish(B, model);
  return { root: B.root, joints: done.joints, dims: F.D, mats: B.M, edges: done.edges, fx: B.fx, parts: done.parts, build: P, palette, model, gear };
}
