// weapons/shield.js — the shield, worn on the outside of the left forearm
import { tile, cbox, box, hexX } from '../bench.js';

function build(B, F) {
  const { J, joint, add, mark } = B;
  const { b } = F;
  // the shield on the left forearm: a dark plate, an armour face ridged down its middle on it, a stripe across
  const shield = joint('shield', J.foreL, 0.50 * b, -0.62, 0, 0, 0, -0.05);
  const SH = [[-0.30, 0.82], [0.30, 0.82], [0.50, 0.54], [0.50, -0.62], [0.22, -1.12], [-0.22, -1.12], [-0.50, -0.62], [-0.50, 0.54]];
  add(shield, tile(SH, 0.07, SH.map(([u, v]) => [u * 0.9, v * 0.94]), 0.09), 'frame', 0.04, 0, 0, 0, Math.PI / 2, 0);
  const SF = [[-0.22, 0.66], [0.22, 0.66], [0.40, 0.42], [0.40, -0.52], [0.16, -0.94], [-0.16, -0.94], [-0.40, -0.52], [-0.40, 0.42]];
  add(shield, tile(SF, 0.05, [[0, 0.50], [0, -0.78]], 0.15), 'armor', 0.13, 0, 0, 0, Math.PI / 2, 0);
  { const tilt = Math.atan2(0.10, 0.40), sx = (z) => 0.13 + 0.05 + 0.10 * (1 - Math.abs(z) / 0.40) + 0.004;
    for (const t of [1, -1]) add(shield, box(0.40, 0.10, 0.008), 'stripe', sx(0.20), 0.20, t * 0.20, 0, Math.PI / 2 - t * tilt, 0);      // the stripe, in two halves over the ridge
    mark(shield, 'bars', 0.20, sx(0.20) + 0.001, -0.06, 0.20, 0, Math.PI / 2 - tilt, 0); mark(shield, 'text', 0.26, sx(0.20) + 0.001, -0.34, -0.20, 0, Math.PI / 2 + tilt, 0);
    for (const [zz, yy] of [[0.30, 0.34], [-0.30, 0.34], [0.30, -0.46], [-0.30, -0.46]]) add(shield, hexX(0.026, 0.02, 6), 'metal', sx(0.30) + 0.004, yy, zz); }
  for (const y of [0.28, -0.30]) add(shield, hexX(0.08, 0.26, 8), 'metal', -0.08, y, 0);
  add(shield, cbox(0.10, 0.86, 0.18, 0.02), 'frame', 0.0, -0.02, 0);
}

export const shield = { name: 'shield', build };
