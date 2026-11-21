// weapons/rifle.js — the heavy gun, held in the right hand. It brings its muzzle flash, and the part of a motion that is its
// own: the flash of a shot.
import { hull, loft, ringZ, cbox, box, cylZ, blast } from '../bench.js';

function build(B) {
  const { J, M, joint, add, glowAdd, mark, face, layMark } = B;
  // the gun in the right hand, a heavy one: built along its own +Z, turned so that +Z is the hand's way down the forearm
  const rifle = joint('rifle', J.handR, 0, -0.20, 0.0, Math.PI / 2, 0, 0);
  add(rifle, cbox(0.14, 0.36, 0.17, 0.02), 'frame', 0, -0.02, 0, 0.2, 0, 0);
  add(rifle, cbox(0.26, 0.40, 1.50, 0.05), 'frame', 0, 0.38, 0.30);
  const shroud = add(rifle, loft(ringZ(1.02, 0.28, 0.34, 0.06, 0, 0.39), ringZ(2.30, 0.22, 0.26, 0.05, 0, 0.40)), 'armor');
  for (let i = 0; i < 5; i += 1) for (const s of [1, -1]) add(rifle, box(0.02, 0.08, 0.14), 'frame', s * (0.136 - i * 0.005), 0.43, 1.22 + i * 0.22);
  add(rifle, cylZ(0.07, 1.00, 12), 'metal', 0, 0.40, 2.70);
  add(rifle, cbox(0.20, 0.20, 0.36, 0.04), 'frame', 0, 0.40, 3.14);
  for (const s of [1, -1]) add(rifle, box(0.02, 0.08, 0.09), 'metal', s * 0.101, 0.40, 3.14);
  // the drum stands square to the barrel, its round faces toward the muzzle and the stock: the rounds in a drum lie along
  // its axis, and they have to point where the gun points. (Until 2026-11-20 it lay the other way, its faces to the gun's sides.)
  // A big drum: the owner asked for a bigger one (2026-11-21). It hangs from the same place under the gun, so it grows downward.
  add(rifle, cylZ(0.36, 0.40, 18), 'armor2', 0, -0.09, 0.78);
  add(rifle, cylZ(0.15, 0.42, 8), 'frame', 0, -0.09, 0.78);
  add(rifle, cylZ(0.366, 0.06, 18), 'frame', 0, -0.09, 0.78);                                                       // the band round its middle
  add(rifle, cbox(0.20, 0.14, 0.30, 0.02), 'frame', 0, 0.21, 0.78);                                                 // the neck that feeds the gun
  add(rifle, hull([[-0.10, 0.24, -0.44], [0.10, 0.24, -0.44], [-0.10, 0.56, -0.44], [0.10, 0.56, -0.44], [-0.08, 0.28, -1.00], [0.08, 0.28, -1.00], [-0.08, 0.52, -1.00], [0.08, 0.52, -1.00], [-0.08, 0.14, -0.92], [0.08, 0.14, -0.92]]), 'frame');
  add(rifle, box(0.08, 0.05, 1.20), 'frame', 0, 0.60, 0.30);
  add(rifle, cbox(0.15, 0.16, 0.44, 0.03), 'frame', 0, 0.70, 0.26);
  add(rifle, cylZ(0.05, 0.02, 10), 'glow', 0, 0.70, 0.485);
  add(rifle, cylZ(0.08, 0.66, 10), 'metal', 0, 0.19, 1.56);
  mark(rifle, 'serial', 0.34, -0.132, 0.38, 0.24, 0, -Math.PI / 2, 0);
  layMark(face(shroud, [-3, 0.40, 1.50], [0, 0.40, 1.50]), 'hazard', 0.30);
  const flash = joint('flash', rifle, 0, 0.40, 3.34);
  glowAdd(flash, blast(1.00, 0.28, 10), M.flash); glowAdd(flash, blast(0.52, 0.12, 8), M.core);
  for (const s of [1, -1]) glowAdd(flash, blast(0.52, 0.13, 6), M.flash, s * 0.06, 0, -0.18, 0, s * 1.3, 0);
  flash.scale.setScalar(0.001);
}

function drive(rig) {
  const J = rig.J;
  rig.flash = (v) => { J.flash.scale.setScalar(Math.max(v, 0.001)); };
}

// it is held in the right hand, and the frame's Shoot motion fires it. Shown on its own it lies level, side on.
export const rifle = { name: 'rifle', mount: 'handR', motion: 'Shoot', shown: [-Math.PI / 2, Math.PI / 2, 0, 'YXZ'], build, drive };
