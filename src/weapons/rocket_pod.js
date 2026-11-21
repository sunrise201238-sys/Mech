// weapons/rocket_pod.js — the rocket pod, carried over the left shoulder on an arm from the pack
import { hull, cbox, box, cylZ } from '../bench.js';

function build(B, F) {
  const { J, joint, add, mark } = B;
  const { b, s1 } = F, pack = J.pack;
  // the left mount and the rocket pod: seven tubes in a six-sided box, carried over the left shoulder
  const px = 1.40 * b * s1;
  add(pack, hull([[0.34 * b, 0.48, -0.44], [0.60 * b, 0.48, -0.44], [0.34 * b, 0.48, -0.12], [0.60 * b, 0.48, -0.12], [px - 0.42, 0.99, -0.42], [px - 0.14, 0.99, -0.42], [px - 0.42, 0.99, -0.08], [px - 0.14, 0.99, -0.08]]), 'frame');
  add(pack, cbox(0.50, 0.10, 0.56, 0.03), 'frame', px - 0.20, 0.975, -0.22);
  const pod = joint('pod', pack, px, 1.33, 0.30);
  const hexPts = (z, w, h) => [[-w / 2 + h * 0.30, h / 2, z], [w / 2 - h * 0.30, h / 2, z], [w / 2, 0, z], [w / 2 - h * 0.30, -h / 2, z], [-w / 2 + h * 0.30, -h / 2, z], [-w / 2, 0, z]];
  add(pod, hull([...hexPts(-0.80, 0.90, 0.60), ...hexPts(0.56, 0.90, 0.60)]), 'armor2');
  add(pod, hull([...hexPts(0.54, 0.96, 0.66), ...hexPts(0.70, 0.96, 0.66)]), 'frame');
  add(pod, hull([...hexPts(-0.94, 0.94, 0.64), ...hexPts(-0.78, 0.94, 0.64)]), 'frame');
  for (const [tx, ty] of [[0, 0], [0.24, 0], [-0.24, 0], [0.12, 0.17], [-0.12, 0.17], [0.12, -0.17], [-0.12, -0.17]]) { add(pod, cylZ(0.078, 0.03, 12), 'metal', tx, ty, 0.701); add(pod, cylZ(0.06, 0.034, 12), 'frame', tx, ty, 0.701); }
  for (let i = 0; i < 4; i += 1) add(pod, box(0.50, 0.03, 0.06), 'frame', 0, 0.305, -0.56 + i * 0.30);
  mark(pod, 'danger', 0.34, 0, 0.302, 0.20, -Math.PI / 2, 0, 0);
}

export const rocketPod = { name: 'rocket pod', build };
