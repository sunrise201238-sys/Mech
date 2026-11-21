// mech.js — the mech the board shows, put together from its layers on one bench: a frame, an armour line, a backpack, and
// weapons. The model faces +Z, stands on y = 0, and its own left is +X. No skin: every part is rigid and rides its joint.
import * as THREE from 'three';
import { bench, finish, setPalette, PALETTES, BUILD_DEFAULT } from './bench.js';
import { HEAVY_MECH_03 } from './models/heavy_mech_03.js';

export { setPalette, PALETTES, BUILD_DEFAULT };
export const MODEL = HEAVY_MECH_03;
// the motions belong to the frame: every frame brings its own
export const MOTIONS = MODEL.frame.motions.MOTIONS, walkSpeed = MODEL.frame.motions.walkSpeed;

// frameOnly leaves the armour, the backpack and the weapons off: the frame as it is underneath. without names the weapons
// that are not carried: each is still built, so that every other part keeps the tint it has beside it, and then left out.
export function buildMech(build = BUILD_DEFAULT, palette = PALETTES.olive, { model = MODEL, frameOnly = false, without = [] } = {}) {
  const P = { ...BUILD_DEFAULT, ...build };
  const B = bench(palette);
  // each layer in turn; whatever it added to the tree is marked as its own, and as off when it is not carried
  const layer = (tag, make, carried = true) => { const got = make(); B.root.traverse((o) => { if (!B.made.has(o)) { B.made.set(o, tag); if (!carried) o.userData.off = true; } }); return got; };
  const F = layer('F', () => model.frame.build(B, P));
  const gear = [];                                 // what the frame carries: it joins in the motions
  if (!frameOnly) {
    layer('A', () => model.armor.build(B, F));
    layer('P', () => model.backpack.build(B, F)); gear.push(model.backpack);
    for (const w of model.weapons) { const carried = !without.includes(w.name); layer('W', () => w.build(B, F), carried); if (carried) gear.push(w); }
  }
  const done = finish(B, model);
  return { root: B.root, joints: done.joints, dims: F.D, mats: B.M, edges: done.edges, fx: B.fx, parts: done.parts, build: P, palette, model, gear };
}

// The weapons a model has, each stood on the floor on its own, side by side: what the board shows when they are laid out.
// A weapon is built on a stand that takes the place of what it mounts on, turned the way the weapon asks to be shown, and
// brings its mount with it.
export function buildRack(build = BUILD_DEFAULT, palette = PALETTES.olive, { model = MODEL } = {}) {
  const B = bench(palette), F = model.frame.sizes({ ...BUILD_DEFAULT, ...build }), stands = [];
  B.root.scale.setScalar(F.D.scale);
  for (const w of model.weapons) {
    const stand = B.joint('stand ' + w.name, B.root);
    if (w.shown) stand.rotation.set(...w.shown);
    B.J[w.mount] = stand; w.build(B, F); delete B.J[w.mount];
    stands.push({ weapon: w, stand });
  }
  const done = finish(B);
  // side by side along the floor, each standing on it, the row centred
  const GAP = 0.9, box = new THREE.Box3(), one = new THREE.Box3(), k = 1 / F.D.scale; let x = 0;
  for (const s of stands) {
    B.root.updateMatrixWorld(true); box.makeEmpty();
    s.stand.traverse((o) => { if (o.isMesh && !o.userData.fx) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.union(one.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });
    s.stand.position.x += (x - box.min.x) * k; s.stand.position.y -= box.min.y * k; s.stand.position.z -= (box.min.z + box.max.z) / 2 * k;
    s.wide = box.max.x - box.min.x; s.tall = box.max.y - box.min.y; s.at = x + s.wide / 2; x += s.wide + GAP;
  }
  const width = x - GAP;
  for (const s of stands) { s.stand.position.x -= width / 2 * k; s.at -= width / 2; }       // the row's middle is the root's own place; at: each one's middle along the row
  return { root: B.root, stands, width, height: Math.max(...stands.map((s) => s.tall)), mats: B.M, edges: done.edges, fx: B.fx, palette };
}
