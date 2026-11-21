// armor/heavy_slab.js — the slab armour of the heavy frame: every painted plate, with the seams, bolts, hatches, lamps and
// stencil marks that sit on them. Sloped wherever its corners say. It is made for this frame alone: it reads the frame's
// own sizes, hangs its skirt plates and shoulder blocks on the frame's hinges, and follows all four build sliders.
import * as THREE from 'three';
import { hull, ring, loft, cbox, tile, oct, box, cylY, hexX, hexZ } from '../bench.js';

function build(B, F) {
  const { J, add, mark, markOn, partOn, boltsOn, face, lay, seam, layMark } = B;
  const { b, sh, cw, L1, L2, hs, keel } = F;
  const { hips, spine, chest, head } = J;

  // ------------------------------------------------------------ hips: the belt, the cap over the block between the legs, the skirt plates
  add(hips, loft(ring(0.20, 1.72 * b, 1.12, 0.20), ring(0.44, 1.30 * b, 0.86, 0.16)), 'armor');                  // the belt, sloped all round
  const cap = add(hips, hull([[-0.32, 0.24, 0.44], [0.32, 0.24, 0.44], [-0.34, 0.22, 0.80], [0.34, 0.22, 0.80], [-0.34, 0.02, 0.86], [0.34, 0.02, 0.86], [-0.32, 0.0, 0.44], [0.32, 0.0, 0.44]]), 'armor');
  seam(cap, [0, 0.12, 3], [0, 0.12, 0], 0.50);
  for (const t of [1, -1]) lay(face(cap, [t * 0.24, 0.12, 3], [t * 0.24, 0.12, 0]), hexZ(0.026, 0.02, 6), 'metal', 0, 0.05, 0.008);
  lay(face(keel, [0, -0.20, 3], [0, -0.20, 0]), tile(oct(0.30, 0.34, 0.05), 0.02, oct(0.20, 0.24, 0.03), 0.05), 'armor2');
  for (const s of [1, -1]) {
    const n = s > 0 ? 'L' : 'R';
    const sf = J['skirtF' + n], ss = J['skirtS' + n];
    const w = 0.50 * b;
    const sft = add(sf, tile([[-w / 2, 0], [w / 2, 0], [w / 2, -0.44], [w / 2 - 0.12, -0.64], [-w / 2 + 0.12, -0.64], [-w / 2, -0.44]], 0.07,
      [[-w / 2 + 0.07, -0.07], [w / 2 - 0.07, -0.07], [w / 2 - 0.07, -0.40], [w / 2 - 0.15, -0.56], [-w / 2 + 0.15, -0.56], [-w / 2 + 0.07, -0.40]], 0.12), 'armor');
    markOn(sft, 'lift', 0.20, 0, -0.24, 0.12);
    const sst = add(ss, tile([[-0.36, 0], [0.36, 0], [0.52, -0.28], [0.42, -0.90], [-0.42, -0.90], [-0.52, -0.28]], 0.08,
      [[-0.26, -0.10], [0.26, -0.10], [0.38, -0.30], [0.31, -0.78], [-0.31, -0.78], [-0.38, -0.30]], 0.15), 'armor', 0, 0, 0, 0, s * Math.PI / 2, 0);
    partOn(sst, tile(oct(0.44, 0.28, 0.05), 0.012, oct(0.36, 0.20, 0.03), 0.03), 'armor2', 0, -0.28, 0.15);
    boltsOn(sst, [[-0.27, -0.15], [0.27, -0.15], [-0.24, -0.71], [0.24, -0.71]], 0.15);
    markOn(sst, 'text', 0.28, 0, -0.60, 0.15);
  }
  const sb = J.skirtB;
  add(sb, tile([[-0.60 * b, 0], [0.60 * b, 0], [0.60 * b, -0.46], [0.44 * b, -0.74], [-0.44 * b, -0.74], [-0.60 * b, -0.46]], 0.07,
    [[-0.44 * b, -0.10], [0.44 * b, -0.10], [0.44 * b, -0.42], [0.32 * b, -0.62], [-0.32 * b, -0.62], [-0.44 * b, -0.42]], 0.14), 'armor', 0, 0, 0, 0, Math.PI, 0);
  for (const s of [1, -1]) add(sb, cylY(0.06, 0.10, 0.14, 8), 'metal', s * 0.40 * b, -0.76, -0.07);

  // ------------------------------------------------------------ waist
  add(spine, tile(oct(0.64 * b, 0.20, 0.05), 0.04, [[-0.22 * b, 0], [0.22 * b, 0]], 0.10), 'armor2', 0, 0.07, 0.40 * b, -0.10, 0, 0);
  add(spine, tile(oct(0.54 * b, 0.17, 0.05), 0.04, [[-0.18 * b, 0], [0.18 * b, 0]], 0.10), 'armor2', 0, 0.26, 0.38 * b, 0.10, 0, 0);

  // ------------------------------------------------------------ the core: small beside its shoulders, a prow of sloped plates
  const core = add(chest, hull([
    ...ring(0.00, 0.92 * b, 0.86, 0.12, 0, 0.02),
    [-0.58 * b, 0.34, 0.84], [0.58 * b, 0.34, 0.84], [-0.76 * b, 0.34, -0.60], [0.76 * b, 0.34, -0.60],
    [-0.28 * b, 0.54, 1.06], [0.28 * b, 0.54, 1.06], [-0.78 * b, 0.58, 0.70], [0.78 * b, 0.58, 0.70],
    [-0.90 * cw, 0.90, 0.42], [0.90 * cw, 0.90, 0.42], [-0.90 * cw, 0.90, -0.58], [0.90 * cw, 0.90, -0.58], [-0.88 * cw, 0.54, -0.64], [0.88 * cw, 0.54, -0.64],
    [-0.70 * cw, 1.02, 0.26], [0.70 * cw, 1.02, 0.26], [-0.70 * cw, 1.02, -0.52], [0.70 * cw, 1.02, -0.52],
  ]), 'armor');
  // the upper glacis runs from the deck's front edge (y 1.02, z 0.26) down to the nose (y 0.54, z 1.06): things on it lie at this slope
  const GL = Math.atan2(0.48, 0.80), gy = Math.cos(GL), gz = Math.sin(GL);
  const onGlacis = (u, v, lift = 0) => [u, 0.78 - v * Math.sin(GL) + lift * gy, 0.66 + v * Math.cos(GL) + lift * gz];   // u across, v down the slope from its middle
  { const [x, y, z] = onGlacis(0, -0.05, 0.035); add(chest, cbox(0.50 * b, 0.07, 0.50, 0.03), 'armor2', x, y, z, GL, 0, 0); }                    // the hatch
  { const hw = 0.17 * b, hl = 0.17;
    for (const [u, v, w2, d2] of [[0, -0.05 - hl, 2 * hw, 0.014], [0, -0.05 + hl, 2 * hw, 0.014], [-hw, -0.05, 0.014, 2 * hl], [hw, -0.05, 0.014, 2 * hl]]) { const [x, y, z] = onGlacis(u, v, 0.072); add(chest, box(w2, 0.008, d2), 'frame', x, y, z, GL, 0, 0); }
    for (const u of [-0.10 * b, 0.10 * b]) { const [x, y, z] = onGlacis(u, -0.05 - hl - 0.03, 0.082); add(chest, hexX(0.022, 0.08, 6), 'metal', x, y, z, GL, 0, 0); }
    const [x, y, z] = onGlacis(0, 0.05, 0.085); add(chest, cbox(0.16 * b, 0.024, 0.03, 0.008), 'metal', x, y, z, GL, 0, 0); }
  for (const s of [1, -1]) { const [x, y, z] = onGlacis(s * 0.20 * b, 0.32, 0.03); add(chest, cbox(0.12, 0.06, 0.16, 0.02), 'frame', x, y, z, GL, 0, 0); const q = onGlacis(s * 0.20 * b, 0.405, 0.03); add(chest, box(0.08, 0.04, 0.02), 'glow', q[0], q[1], q[2], GL, 0, 0); }
  { const [x, y, z] = onGlacis(0.42 * cw, -0.27, 0.012); mark(chest, 'serial', 0.26, x, y, z, GL - Math.PI / 2, 0, 0); }
  { const [x, y, z] = onGlacis(-0.42 * cw, -0.25, 0.012); mark(chest, 'warn', 0.13, x, y, z, GL - Math.PI / 2, 0, 0); }
  // the lower plate under the nose: a grille
  { const lp = add(chest, tile(oct(0.48 * b, 0.38, 0.06), 0.03, oct(0.38 * b, 0.28, 0.04), 0.05), 'frame', 0, 0.27, 0.755, Math.atan2(0.61, 0.54), 0, 0);
    for (let i = 0; i < 4; i += 1) partOn(lp, box(0.34 * b, 0.026, 0.04), 'armor2', 0, -0.10 + i * 0.066, 0.062); }
  for (const s of [1, -1]) {
    // the collar: a sloped guard each side of the head
    add(chest, hull([[s * 0.30, 1.00, -0.50], [s * 0.30, 1.00, 0.24], [s * 0.72 * cw, 1.00, -0.52], [s * 0.72 * cw, 1.00, 0.24],
      [s * 0.42, 1.30, -0.44], [s * 0.42, 1.24, 0.04], [s * 0.64 * cw, 1.26, -0.46], [s * 0.64 * cw, 1.20, 0.04]]), 'armor');
    add(chest, new THREE.TorusGeometry(0.055, 0.016, 6, 10), 'metal', s * 0.56 * cw, 1.045, 0.18, 0, Math.PI / 2, 0).userData.hollow = true;        // a lifting eye
    const f = face(core, [s * 0.62 * b, 0.62, 3.0], [s * 0.62 * b, 0.62, 0]);                                   // an intake on each cheek
    lay(f, cbox(0.28, 0.16, 0.05, 0.02), 'frame', 0, 0, 0.0); for (let i = 0; i < 3; i += 1) lay(f, box(0.24, 0.022, 0.05), 'armor2', 0, -0.048 + i * 0.048, 0.022);
    const fl2 = face(core, [s * 0.48 * b, 0.17, 3.0], [s * 0.48 * b, 0.17, 0]); lay(fl2, hexZ(0.035, 0.03, 6), 'metal', 0, 0, 0.012);     // a tow point each side below
    seam(core, [s * 0.66 * cw, 3, 0.20], [s * 0.66 * cw, 0, 0.40], 0.32, Math.PI / 2);                            // a seam down each side plate of the glacis
  }
  add(chest, hull([[-0.30, 1.00, -0.56], [0.30, 1.00, -0.56], [-0.30, 1.00, -0.34], [0.30, 1.00, -0.34], [-0.26, 1.24, -0.54], [0.26, 1.24, -0.54], [-0.26, 1.18, -0.38], [0.26, 1.18, -0.38]]), 'armor2');

  // ------------------------------------------------------------ head: a helmet of sloped plates, low between the collar guards
  // A wedge: it widens from its neck to its shoulder line, which clears the collar, and narrows to a crown that rises toward
  // the back and drops there in one steep plate. A steel nose carries the crown's line on forward and down over the face,
  // and a cheek plate each side wraps it. The nose, the cheeks and the jaw close right up to the housing of the one eye, so
  // nothing dark is left round it, and every plate round it is sloped: none faces flat to the front. The housing is narrower
  // at its top than at its foot, so the cheeks lean in toward the nose and the jaw is wider than the nose.
  const H = (x, y, z) => [x * hs, y * hs, z * hs];
  const helm = add(head, hull([H(-0.25, 0.04, -0.36), H(0.25, 0.04, -0.36), H(-0.24, 0.04, 0.14), H(0.24, 0.04, 0.14),
    H(-0.30, 0.30, -0.50), H(0.30, 0.30, -0.50), H(-0.37, 0.30, -0.26), H(0.37, 0.30, -0.26), H(-0.29, 0.30, 0.20), H(0.29, 0.30, 0.20),
    H(-0.12, 0.66, -0.28), H(0.12, 0.66, -0.28), H(-0.13, 0.58, 0.10), H(0.13, 0.58, 0.10)]), 'armor');
  add(head, hull([H(-0.14, -0.02, 0.12), H(0.14, -0.02, 0.12), H(-0.15, -0.02, 0.30), H(0.15, -0.02, 0.30), H(0, -0.02, 0.40),
    H(-0.227, 0.102, 0.14), H(0.227, 0.102, 0.14), H(-0.227, 0.102, 0.37), H(0.227, 0.102, 0.37), H(0, 0.07, 0.47)]), 'armor2');   // the jaw: a prow under the eye, raked back to either side
  lay(face(helm, [0, 3, -0.09 * hs], [0, 0, -0.09 * hs]), cbox(0.12 * hs, 0.30 * hs, 0.05 * hs, 0.02), 'armor2', 0, 0, 0.018 * hs);   // the spine along the crown
  // the nose: a blunt cone set on the helmet's upper front, with a small eye on top of it
  const nose = add(head, hull([H(-0.14, 0.58, 0.08), H(0.14, 0.58, 0.08), H(-0.18, 0.44, 0.16), H(0.18, 0.44, 0.16), H(-0.195, 0.328, 0.20), H(0.195, 0.328, 0.20),
    H(-0.12, 0.53, 0.30), H(0.12, 0.53, 0.30), H(-0.16, 0.43, 0.36), H(0.16, 0.43, 0.36), H(-0.195, 0.328, 0.38), H(0.195, 0.328, 0.38),
    H(-0.05, 0.44, 0.58), H(0.05, 0.44, 0.58), H(-0.06, 0.37, 0.57), H(0.06, 0.37, 0.57)]), 'metal');
  lay(face(nose, [0, 3, 0.42 * hs], [0, 0, 0.42 * hs]), box(0.04 * hs, 0.055 * hs, 0.012), 'glow', 0, 0, 0.004);
  // eyeSide is half the width of the eye's housing at a height, as frames/heavy.js makes it: 0.43 wide at its foot, 0.34 at
  // its top. The cheeks' inner edges run along its sides, just inside them.
  const eyeSide = (y) => 0.215 - (0.215 - 0.17) * (y - 0.0975) / 0.235, inT = eyeSide(0.34) - 0.002, inB = eyeSide(0.09) - 0.002;
  for (const s of [1, -1]) {
    // A cheek each side of the eye, rising to meet the nose. It has no flat front: a ridge stands out beside the eye, one
    // face runs in from it to the eye's housing and another rakes back from it to the helmet's side.
    add(head, hull([H(s * (inT + 0.035), 0.34, 0.43), H(s * (inB + 0.025), 0.09, 0.45), H(s * inT, 0.34, 0.36), H(s * inB, 0.09, 0.36),
      H(s * 0.185, 0.05, 0.10), H(s * 0.185, 0.30, 0.14), H(s * 0.30, 0.30, 0.14), H(s * 0.25, 0.05, 0.10),
      H(s * 0.23, 0.46, 0.14), H(s * 0.17, 0.46, 0.14), H(s * 0.18, 0.44, 0.36)]), 'armor');
    seam(helm, [s * 3, 0.48 * hs, -0.14 * hs], [0, 0.48 * hs, -0.14 * hs], 0.30 * hs);                              // a line along each side plate
  }
  lay(face(helm, [0, 0.48 * hs, -3], [0, 0.48 * hs, 0]), box(0.18 * hs, 0.035 * hs, 0.012), 'frame', 0, 0, 0.002);  // a slot in the back plate

  // ------------------------------------------------------------ shoulder blocks, and the plates of the arms
  for (const s of [1, -1]) {
    const n = s > 0 ? 'L' : 'R';
    const pad = J['pad' + n], arm = J['arm' + n], fa = J['fore' + n], hand = J['hand' + n];
    // the shoulder block: a box open underneath — a roof that slopes down outward, an outer wall, a front and a back
    const pd = (x, y, z) => [s * x * sh, y * sh, z * sh];
    const roofPts = [];
    for (const [x, top, half, low] of [[-0.30, 0.70, 0.68, 0.48], [0.86, 0.56, 0.66, 0.42]]) for (const t of [1, -1]) roofPts.push(pd(x, 0.30, t * half), pd(x, low, t * (half + 0.04)), pd(x, top, t * (half - 0.18)));
    const roof = add(pad, hull(roofPts), 'armor');
    const wall = add(pad, hull([1, -1].flatMap((t) => [pd(0.60, 0.34, t * 0.66), pd(0.88, 0.34, t * 0.66), pd(0.92, 0.04, t * 0.62), pd(0.84, -0.54, t * 0.50), pd(0.64, -0.54, t * 0.50), pd(0.58, -0.10, t * 0.60)])), 'armor');
    add(pad, hull([pd(-0.26, 0.33, 0.54), pd(-0.26, 0.33, 0.70), pd(0.64, 0.33, 0.54), pd(0.64, 0.33, 0.70), pd(-0.20, -0.14, 0.58), pd(-0.20, -0.14, 0.68), pd(0.62, -0.26, 0.56), pd(0.62, -0.26, 0.68)]), 'armor');
    add(pad, hull([pd(-0.26, 0.33, -0.54), pd(-0.26, 0.33, -0.70), pd(0.64, 0.33, -0.54), pd(0.64, 0.33, -0.70), pd(-0.20, -0.30, -0.56), pd(-0.20, -0.30, -0.66), pd(0.62, -0.40, -0.54), pd(0.62, -0.40, -0.66)]), 'armor');
    add(pad, cbox(0.70 * sh, 0.10, 1.00 * sh, 0.03), 'frame', s * 0.26 * sh, 0.30 * sh, 0);                       // what shows under the roof
    // the name plate on the wall, a hatch on the roof, a vent in the front
    const dp = lay(face(wall, [s * 3, -0.08 * sh, 0], [0, -0.08 * sh, 0]), tile(oct(0.86 * sh, 0.58 * sh, 0.10), 0.02, oct(0.74 * sh, 0.46 * sh, 0.07), 0.05), 'armor2');
    if (dp) { boltsOn(dp, [[-0.30 * sh, 0.16 * sh], [0.30 * sh, 0.16 * sh], [-0.30 * sh, -0.16 * sh], [0.30 * sh, -0.16 * sh]], 0.05);
      if (s > 0) markOn(dp, 'sign', 0.30 * sh, 0, 0, 0.05); else { markOn(dp, 'num', 0.40 * sh, -0.06 * sh, 0.02 * sh, 0.05); markOn(dp, 'bars', 0.16 * sh, 0.24 * sh, -0.10 * sh, 0.05); } }
    { const f = face(roof, [s * 0.30 * sh, 3, 0], [s * 0.30 * sh, 0, 0], [0, 0, -1]);
      const hp = lay(f, tile(oct(0.54 * sh, 0.62 * sh, 0.08), 0.015, oct(0.44 * sh, 0.52 * sh, 0.05), 0.04), 'armor2'); if (hp) boltsOn(hp, [[-0.17 * sh, 0.21 * sh], [0.17 * sh, 0.21 * sh], [-0.17 * sh, -0.21 * sh], [0.17 * sh, -0.21 * sh]], 0.04, 0.018);
      layMark(face(roof, [s * 0.66 * sh, 3, 0.10 * sh], [s * 0.66 * sh, 0, 0.10 * sh], [0, 0, -1]), 'nostep', 0.26 * sh, 0, 0, s > 0 ? Math.PI / 2 : -Math.PI / 2);
      seam(roof, [s * -0.08 * sh, 3, 0], [s * -0.08 * sh, 0, 0], 0.90 * sh, Math.PI / 2); }
    for (let i = 0; i < 3; i += 1) add(pad, box(0.40 * sh, 0.03, 0.04), 'frame', s * 0.20 * sh, (0.20 - i * 0.08) * sh, 0.705 * sh);
    if (s > 0) add(pad, cbox(0.90 * sh, 0.05, 0.10, 0.01), 'accent', s * 0.28 * sh, 0.585 * sh, 0.515 * sh, 0.86, 0, -0.12);        // a unit stripe along the left block's front edge
    const ua = add(arm, tile(oct(0.64, 0.68, 0.13), 0.06, oct(0.46, 0.50, 0.08), 0.13), 'armor', s * (0.10 + 0.23 * b), -0.52, 0, 0, s * Math.PI / 2, 0);
    boltsOn(ua, [[-0.17, 0.19], [0.17, 0.19], [-0.17, -0.19], [0.17, -0.19]], 0.13);
    add(arm, tile(oct(0.46 * b, 0.60, 0.09), 0.04, oct(0.30 * b, 0.42, 0.05), 0.09), 'armor2', s * 0.10, -0.54, 0.26);
    add(arm, tile(oct(0.44 * b, 0.44, 0.08), 0.04, oct(0.26 * b, 0.26, 0.04), 0.08), 'armor2', s * 0.10, -0.46, -0.26, 0, Math.PI, 0);
    const gaunt = add(fa, loft(ring(-0.06, 0.58 * b, 0.62, 0.10), ring(-0.50, 0.76 * b, 0.88, 0.13, s * 0.03, 0.02), ring(-1.04, 0.54 * b, 0.58, 0.09)), 'armor');
    add(fa, tile(oct(0.36 * b, 0.56, 0.06), 0.02, oct(0.22 * b, 0.40, 0.03), 0.05), 'armor2', s * (0.03 + 0.365 * b), -0.54, 0.02, 0, s * Math.PI / 2, 0);
    for (let i = 0; i < 3; i += 1) add(fa, box(0.36 * b, 0.03, 0.04), 'frame', 0, -0.30 - i * 0.08, -0.43 + i * 0.012);
    seam(gaunt, [0, -0.30, 3], [0, -0.30, 0], 0.40 * b); seam(gaunt, [0, -0.80, 3], [0, -0.80, 0], 0.36 * b);
    add(hand, cbox(0.42, 0.16, 0.24, 0.03), 'armor2', 0, -0.11, -0.14);
  }

  // ------------------------------------------------------------ legs: thick slabs over the frame, a great flared boot
  for (const s of [1, -1]) {
    const n = s > 0 ? 'L' : 'R';
    const th = J['thigh' + n], shn = J['shin' + n], ft = J['foot' + n];
    // the front slab
    const fs = add(th, tile([[-0.43 * b, -0.04], [0.43 * b, -0.04], [0.46 * b, -0.30], [0.37 * b, -L1 * 0.95], [-0.37 * b, -L1 * 0.95], [-0.46 * b, -0.30]], 0.10,
      [[-0.34 * b, -0.12], [0.34 * b, -0.12], [0.37 * b, -0.32], [0.29 * b, -L1 * 0.88], [-0.29 * b, -L1 * 0.88], [-0.37 * b, -0.32]], 0.17), 'armor', 0, 0, 0.28, -0.03, 0, 0);
    partOn(fs, box(0.62 * b, 0.014, 0.008), 'frame', 0, -0.42, 0.171); partOn(fs, box(0.54 * b, 0.014, 0.008), 'frame', 0, -L1 * 0.66, 0.171);
    partOn(fs, tile(oct(0.30 * b, 0.20, 0.04), 0.012, oct(0.22 * b, 0.13, 0.02), 0.03), 'armor2', s * -0.12 * b, -0.26, 0.17);
    boltsOn(fs, [[-0.28 * b, -0.18], [0.28 * b, -0.18], [-0.23 * b, -L1 * 0.82], [0.23 * b, -L1 * 0.82]], 0.17);
    partOn(fs, box(0.44 * b, 0.07, 0.006), 'stripe', s * 0.04 * b, -L1 * 0.76, 0.173, s * 0.5);                    // a stripe low on the slab
    // the outer slab, hung below the hip plate
    const tp = add(th, tile([[-0.38, -0.24], [0.38, -0.24], [0.44, -0.50], [0.32, -L1 * 0.92], [-0.32, -L1 * 0.92], [-0.44, -0.50]], 0.07,
      [[-0.28, -0.32], [0.28, -0.32], [0.33, -0.52], [0.23, -L1 * 0.84], [-0.23, -L1 * 0.84], [-0.33, -0.52]], 0.13), 'armor', s * 0.26 * b, 0, -0.02, 0, s * Math.PI / 2, 0);
    markOn(tp, 'text', 0.24, 0, -0.66, 0.13); boltsOn(tp, [[-0.22, -0.38], [0.22, -0.38], [-0.17, -L1 * 0.80], [0.17, -L1 * 0.80]], 0.13);
    add(th, tile(oct(0.50, L1 * 0.56, 0.08), 0.05, oct(0.34, L1 * 0.40, 0.05), 0.09), 'armor2', s * -0.26 * b, -L1 * 0.56, 0, 0, s * -Math.PI / 2, 0);   // the inner plate
    add(th, cbox(0.42 * b, 0.32, 0.12, 0.03), 'armor2', 0, -L1 * 0.30, -0.35);

    // the boot: one great block that widens all the way down
    const g0 = -0.26, g1 = -L2 * 0.56, g2 = -L2 * 0.90;
    const greave = add(shn, hull([[-0.32 * b, g0, -0.16], [0.32 * b, g0, -0.16], [-0.32 * b, g0, 0.36], [0.32 * b, g0, 0.36], [-0.20 * b, g0, 0.46], [0.20 * b, g0, 0.46],
      [-0.44 * b, g1, -0.24], [0.44 * b, g1, -0.24], [-0.44 * b, g1, 0.46], [0.44 * b, g1, 0.46], [-0.26 * b, g1, 0.60], [0.26 * b, g1, 0.60],
      [-0.52 * b, g2, -0.30], [0.52 * b, g2, -0.30], [-0.52 * b, g2, 0.52], [0.52 * b, g2, 0.52], [-0.30 * b, g2, 0.68], [0.30 * b, g2, 0.68]]), 'armor');
    for (const t of [1, -1]) { seam(greave, [t * 3, g1 + 0.24, 0.10], [0, g1 + 0.24, 0.10], 0.50); seam(greave, [t * 3, g1 - 0.22, 0.10], [0, g1 - 0.22, 0.10], 0.60);
      const sp = lay(face(greave, [t * 3, g1, 0.10], [0, g1, 0.10]), tile(oct(0.40, 0.24, 0.05), 0.012, oct(0.30, 0.15, 0.03), 0.03), 'armor2'); if (sp) boltsOn(sp, [[-0.13, 0], [0.13, 0]], 0.03, 0.018); }
    seam(greave, [0, g1 + 0.30, 3], [0, g1 + 0.30, 0], 0.36 * b); seam(greave, [0, g1 - 0.20, 3], [0, g1 - 0.20, 0], 0.48 * b);
    lay(face(greave, [0, g1 - 0.04, 3], [0, g1 - 0.04, 0]), box(0.08, 0.34, 0.006), 'stripe', 0, 0, 0.003);                                                        // a stripe down the shin
    layMark(face(greave, [s * 3, g1 - 0.36, 0.14], [0, g1 - 0.36, 0.14]), 'text', 0.22);
    add(shn, hull([[-0.28 * b, -0.30, 0.34], [0.28 * b, -0.30, 0.34], [-0.26 * b, -0.30, 0.50], [0.26 * b, -0.30, 0.50], [0, -0.26, 0.60],
      [-0.25 * b, 0.10, 0.34], [0.25 * b, 0.10, 0.34], [-0.22 * b, 0.10, 0.50], [0.22 * b, 0.10, 0.50], [0, 0.10, 0.58],
      [-0.11 * b, 0.44, 0.34], [0.11 * b, 0.44, 0.34], [0, 0.44, 0.44]]), 'armor2');                              // the knee guard
    const calf = add(shn, hull([[-0.28 * b, -0.30, -0.14], [0.28 * b, -0.30, -0.14], [-0.22 * b, -0.30, -0.50], [0.22 * b, -0.30, -0.50],
      [-0.38 * b, g1, -0.20], [0.38 * b, g1, -0.20], [-0.32 * b, g1, -0.78], [0.32 * b, g1, -0.78],
      [-0.44 * b, g2 + 0.10, -0.26], [0.44 * b, g2 + 0.10, -0.26], [-0.36 * b, g2 + 0.10, -0.66], [0.36 * b, g2 + 0.10, -0.66]]), 'armor2');   // the calf
    for (let i = 0; i < 3; i += 1) add(shn, box(0.44 * b, 0.03, 0.04), 'frame', 0, -0.54 - i * 0.09, -0.60 - i * 0.05, -0.5, 0, 0);
    layMark(face(calf, [s * 3, g1 - 0.20, -0.48], [0, g1 - 0.20, -0.48]), 'warn', 0.15);
    add(shn, loft(ring(g2 + 0.02, 1.10 * b, 1.08, 0.18, 0, 0.14), ring(-L2 * 1.02, 1.18 * b, 1.16, 0.20, 0, 0.14)), 'armor2');                // the cuff round the ankle

    const fw = 0.46 * b;
    add(ft, hull([[-fw, -0.38, -0.02], [fw, -0.38, -0.02], [-fw, -0.38, 0.86], [fw, -0.38, 0.86], [-fw * 0.92, -0.16, 0.86], [fw * 0.92, -0.16, 0.86],
      [-fw * 0.76, 0.12, 0.04], [fw * 0.76, 0.12, 0.04], [-fw * 0.84, 0.04, 0.46], [fw * 0.84, 0.04, 0.46]]), 'armor');
    add(ft, hull([[-fw * 0.86, -0.38, -0.10], [fw * 0.86, -0.38, -0.10], [-fw * 0.74, -0.38, -0.60], [fw * 0.74, -0.38, -0.60], [-fw * 0.62, -0.20, -0.60], [fw * 0.62, -0.20, -0.60], [-fw * 0.74, 0.04, -0.18], [fw * 0.74, 0.04, -0.18]]), 'armor');
    mark(ft, 'nostep', 0.26, 0, -0.058 + 0.004, 0.66, -Math.PI / 2 + Math.atan2(0.20, 0.40), 0, 0);
  }
}

export const heavySlab = { name: 'heavy slab', build };
