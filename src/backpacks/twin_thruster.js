// backpacks/twin_thruster.js — the twin thruster pack: two main thrusters, a whip aerial, and a side each for a weapon to
// mount on. A backpack is a layer of its own, hung on the place the frame keeps for one on its back, so a frame can carry
// any of them. It brings its joints, and the part of a motion that is its own: the burn of its thrusters, the sway of its
// aerial.
import { hull, ring, loft, box, cylY, plume } from '../bench.js';

function build(B, F) {
  const { J, M, joint, add, glowAdd } = B;
  const { b } = F;
  const pack = joint('pack', J.chest, ...F.back);
  add(pack, hull([...ring(-0.46, 1.10 * b, 0.44, 0.06, 0, -0.28), ...ring(0.24, 1.28 * b, 0.62, 0.08, 0, -0.32), ...ring(0.48, 1.06 * b, 0.42, 0.06, 0, -0.26)]), 'frame');
  add(pack, loft(ring(0.47, 1.08 * b, 0.46, 0.06, 0, -0.26), ring(0.57, 0.86 * b, 0.30, 0.05, 0, -0.24)), 'armor');
  for (let i = 0; i < 5; i += 1) add(pack, box(0.52 * b, 0.03, 0.05), 'metal', 0, -0.18 + i * 0.085, -0.625);
  for (const s of [1, -1]) {
    const n = s > 0 ? 'L' : 'R';
    const th = joint('thr' + n, pack, s * 0.38 * b, -0.44, -0.38, 0.60, 0, 0);
    add(th, loft(ring(0.14, 0.50, 0.50, 0.09), ring(-0.16, 0.64, 0.64, 0.12)), 'armor2');
    add(th, cylY(0.19, 0.32, 0.40, 14), 'metal', 0, -0.34, 0);
    add(th, cylY(0.25, 0.25, 0.02, 14), 'burn', 0, -0.525, 0);
    const fl = joint('flame' + n, th, 0, -0.54, 0);
    glowAdd(fl, plume(0.27, 1.8), M.flame); glowAdd(fl, plume(0.13, 1.1, 10), M.core);
    fl.scale.set(1, 0.001, 1);
  }
  // a whip aerial
  const mast = joint('mast', pack, 0.20 * b, 0.56, -0.44, -0.14, 0, -0.04);
  add(mast, cylY(0.03, 0.035, 0.12, 8), 'frame', 0, 0.06, 0);
  add(mast, cylY(0.008, 0.016, 1.45, 6), 'metal', 0, 0.85, 0);
}

function drive(rig) {
  const J = rig.J;
  rig.flame = (v) => { for (const k of ['L', 'R']) J['flame' + k].scale.set(0.8 + 0.2 * Math.min(v, 1.5), Math.max(v, 0.001), 0.8 + 0.2 * Math.min(v, 1.5)); };
  const whip = rig.whip;                           // the pack's aerial sways with the frame's own, a little less
  rig.whip = (x = 0, z = 0) => { whip(x, z); rig.rot('mast', x * 0.8, 0, z * 0.8); };
}

export const twinThruster = { name: 'twin thruster pack', build, drive };
