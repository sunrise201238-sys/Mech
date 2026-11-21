// weapons/missile_pod.js — the missile pod, carried over the left shoulder on an arm from the pack. It brings its joints,
// and the part of a motion that is its own: the burst at its tubes and the blast behind it when it fires.
import { hull, cbox, box, cylZ, blast } from '../bench.js';

function build(B, F) {
  const { J, M, joint, add, glowAdd, mark } = B;
  const { b, s1 } = F, pack = J.pack;
  // the left mount and the missile pod: seven tubes in a six-sided box, carried over the left shoulder
  const px = 1.40 * b * s1;
  add(pack, hull([[0.34 * b, 0.48, -0.44], [0.60 * b, 0.48, -0.44], [0.34 * b, 0.48, -0.12], [0.60 * b, 0.48, -0.12], [px - 0.42, 0.99, -0.42], [px - 0.14, 0.99, -0.42], [px - 0.42, 0.99, -0.08], [px - 0.14, 0.99, -0.08]]), 'frame');
  add(pack, cbox(0.50, 0.10, 0.56, 0.03), 'frame', px - 0.20, 0.975, -0.22);
  const pod = joint('pod', pack, px, 1.33, 0.30);
  const hexPts = (z, w, h) => [[-w / 2 + h * 0.30, h / 2, z], [w / 2 - h * 0.30, h / 2, z], [w / 2, 0, z], [w / 2 - h * 0.30, -h / 2, z], [-w / 2 + h * 0.30, -h / 2, z], [-w / 2, 0, z]];
  add(pod, hull([...hexPts(-0.80, 0.90, 0.60), ...hexPts(0.56, 0.90, 0.60)]), 'armor2');
  add(pod, hull([...hexPts(0.54, 0.96, 0.66), ...hexPts(0.70, 0.96, 0.66)]), 'frame');
  add(pod, hull([...hexPts(-0.94, 0.94, 0.64), ...hexPts(-0.78, 0.94, 0.64)]), 'frame');
  const TUBES = [[0, 0], [0.24, 0], [-0.24, 0], [0.12, 0.17], [-0.12, 0.17], [0.12, -0.17], [-0.12, -0.17]];
  for (const [tx, ty] of TUBES) { add(pod, cylZ(0.078, 0.03, 12), 'metal', tx, ty, 0.701); add(pod, cylZ(0.06, 0.034, 12), 'frame', tx, ty, 0.701); }
  for (let i = 0; i < 4; i += 1) add(pod, box(0.50, 0.03, 0.06), 'frame', 0, 0.305, -0.56 + i * 0.30);
  mark(pod, 'danger', 0.34, 0, 0.302, 0.20, -Math.PI / 2, 0, 0);
  // what a salvo shows: a tongue of fire at every tube and a glare over them all, and the blast thrown out of the back
  const salvo = joint('salvo', pod, 0, 0, 0.72);
  for (const [tx, ty] of TUBES) glowAdd(salvo, blast(1.0, 0.13, 5), M.flash, tx, ty, 0);
  glowAdd(salvo, blast(1.3, 0.50, 10), M.flash, 0, 0, -0.30);
  const backblast = joint('backblast', pod, 0, 0, -0.95, 0, Math.PI, 0);
  glowAdd(backblast, blast(1.4, 0.46, 10), M.flash);
  salvo.scale.setScalar(0.001); backblast.scale.setScalar(0.001);
}

// a salvo: how much shows at the tubes' mouths, and how much is thrown out behind
function drive(rig) {
  const J = rig.J;
  rig.salvo = (front = 0, back = 0) => { J.salvo.scale.setScalar(Math.max(front, 0.001)); J.backblast.scale.setScalar(Math.max(back, 0.001)); };
}

// it hangs on the backpack, and the frame's Missile motion fires it
export const missilePod = { name: 'missile pod', mount: 'pack', motion: 'Missile', build, drive };
