// weapons/cannon.js — the folding cannon, carried on the right of the pack on its own post. It brings its joints, and the
// part of a motion that is its own: how it swings over the shoulder, unfolds, kicks and flashes.
import * as THREE from 'three';
import { loft, ringZ, cbox, box, cylZ, hexX, hexZ, blast, white } from '../bench.js';

function build(B, F) {
  const { J, M, joint, add, glowAdd, mark } = B;
  const { b } = F, pack = J.pack;
  // the right mount and the cannon. Stowed it stands muzzle up with its barrel folded back along it; to fire it swings forward
  // over the shoulder and the barrel swings out in front
  add(pack, cbox(0.18, 0.86, 0.28, 0.03), 'frame', -0.56 * b, 0.86, -0.30, 0, 0, -0.10);
  add(pack, cbox(0.32, 0.18, 0.32, 0.03), 'frame', -0.52 * b, 0.46, -0.30);
  const cannon = joint('cannon', pack, -0.78 * b, 1.18, -0.30, -(Math.PI / 2 + 0.10), 0, 0);
  add(cannon, hexX(0.15, 0.56), 'metal', 0.08, 0, 0);
  add(cannon, loft(ringZ(-0.52, 0.30, 0.34, 0.07), ringZ(-0.36, 0.40, 0.44, 0.09), ringZ(0.72, 0.40, 0.44, 0.09), ringZ(0.92, 0.32, 0.36, 0.07)), 'armor');
  add(cannon, cbox(0.44, 0.48, 0.26, 0.05), 'frame', 0, 0, -0.34);
  for (let i = 0; i < 5; i += 1) add(cannon, box(0.435, 0.30, 0.04), 'frame', 0, -0.03, -0.06 + i * 0.13);
  add(cannon, cbox(0.24, 0.08, 0.32, 0.02), 'frame', 0, 0.23, 0.70);                                             // the hinge block
  mark(cannon, 'hazard', 0.38, -0.204, -0.03, -0.20, 0, -Math.PI / 2, 0);
  mark(cannon, 'serial', 0.30, -0.204, 0.0, 0.52, 0, -Math.PI / 2, 0);
  const barrel = joint('barrel', cannon, 0, 0.20, 0.92, Math.PI, 0, 0);
  add(barrel, hexX(0.07, 0.30, 8), 'metal', 0, 0, 0);
  add(barrel, cbox(0.26, 0.28, 0.36, 0.04), 'frame', 0, -0.20, 0.20);
  add(barrel, cylZ(0.095, 1.40, 14), 'metal', 0, -0.20, 0.92);
  add(barrel, hexZ(0.13, 0.52, 8), 'armor2', 0, -0.20, 0.74);
  add(barrel, cbox(0.32, 0.23, 0.34, 0.05), 'frame', 0, -0.20, 1.64);
  for (const s of [1, -1]) add(barrel, box(0.02, 0.10, 0.09), 'metal', s * 0.161, -0.20, 1.64);
  const flash2 = joint('flash2', barrel, 0, -0.20, 1.84);
  glowAdd(flash2, blast(1.8, 0.56), M.flash); glowAdd(flash2, blast(1.0, 0.24, 8), M.core);
  for (const s of [1, -1]) glowAdd(flash2, blast(1.2, 0.30, 8), M.flash, s * 0.12, 0, -0.20, 0, s * 1.25, 0);                 // the brake throws it sideways too
  glowAdd(flash2, white(new THREE.SphereGeometry(0.16, 10, 8)), M.flash, 0, 0, 0.02);
  flash2.scale.setScalar(0.001);
}

// swung forward over the shoulder (deploy 0..1), its barrel swung out (unfold 0..1), kicked back along itself
function drive(rig) {
  const J = rig.J, rest = rig.rest;
  rig.cannon = (deploy = 0, unfold = 0, kick = 0, flash = 0) => {
    rig.rot('cannon', deploy * (Math.PI / 2 + 0.10), 0, 0); J.cannon.position.z = rest.cannon.p.z - kick;
    rig.rot('barrel', -unfold * Math.PI, 0, 0); J.flash2.scale.setScalar(Math.max(flash, 0.001));
  };
}

export const cannon = { name: 'cannon', build, drive };
