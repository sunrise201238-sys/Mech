// frames/heavy.js — the heavy frame: a squat, wide two-legged machine. A frame is the skeleton and everything a mech keeps
// whatever it wears or carries: the joints and their sizes, the dark inner structure, the hinges its armour hangs from, the
// place on its back where a backpack hangs, the thrusters on its calves, its aerial, and what its four build sliders do.
// Its motions are in motions/heavy.js. It is built in its own units and stood in the scene at D.scale: at the chosen look
// the head then tops out near 5.8. A frame is kept light: it is drawn under the armour all the time.
import { hull, ring, loft, cbox, box, cylY, hexX, hexY, plume } from '../bench.js';
import * as motions from '../motions/heavy.js';

// The look that was chosen on the board (2026-11-20), in the model's own numbers: as bulky as the slider goes, narrow shoulders,
// short legs, a slightly larger head. A build is given as multiples of this look, so every slider reads 1 at it.
export const BUILD_BASE = { bulk: 1.25, shoulders: 0.81, legs: 0.85, head: 1.12 };

// What the four sliders come to, in the frame's own numbers. Whatever is hung on the frame reads its sizes from here.
function sizes(P) {
  // the sliders' numbers turned back into the model's own: at 1 each is exactly the chosen look's number
  const b = P.bulk * BUILD_BASE.bulk, sh = P.shoulders * BUILD_BASE.shoulders, lg = P.legs * BUILD_BASE.legs, hd = P.head * BUILD_BASE.head;
  const s1 = 0.72 + 0.28 * sh;                    // how far the shoulders stand out
  // sit: how far the hips rest below a straight leg's reach, since this machine always stands with its legs spread and bent
  const D = { footH: 0.50, L1: 1.30 * lg, L2: 1.50 * lg, hipX: 0.86 * (0.6 + 0.4 * b), hipDrop: 0.14, toe: 1.24, heel: 0.73, sit: 0.34, scale: 1.15 };
  D.hipY = D.footH + D.L2 + D.L1 + D.hipDrop - D.sit;
  D.shoulderX = 1.30 * b * s1; D.stance = D.hipX + 0.62;
  return { P, b, sh, lg, hd, s1, cw: b * s1, L1: D.L1, L2: D.L2, hs: hd * 0.84, D };       // hs: the head's own scale
}

function build(B, P) {
  const { root, J, M, joint, add, glowAdd } = B;
  const S = sizes(P), { b, sh, lg, hd, s1, cw, L1, L2, hs, D } = S;
  root.scale.setScalar(D.scale);

  // ------------------------------------------------------------ hips: a wide dark pelvis, the legs set far apart
  const hips = joint('hips', root, 0, D.hipY, 0);
  add(hips, cbox(1.46 * b, 0.62, 0.92, 0.08), 'frame', 0, -0.04, 0);
  const keel = add(hips, hull([[-0.27, 0.16, 0.40], [0.27, 0.16, 0.40], [-0.30, 0.10, 0.76], [0.30, 0.10, 0.76], [-0.30, -0.40, 0.82], [0.30, -0.40, 0.82],
    [-0.22, -0.76, 0.62], [0.22, -0.76, 0.62], [-0.22, -0.72, 0.36], [0.22, -0.72, 0.36]]), 'frame');              // the block between the legs
  add(hips, cbox(0.80 * b, 0.50, 0.28, 0.05), 'frame', 0, -0.08, -0.52);
  for (const s of [1, -1]) add(hips, hexX(0.31, 0.36), 'metal', s * D.hipX, -D.hipDrop, 0);
  // the hinges the skirt plates hang from: one in front and one outside each hip, one behind
  for (const s of [1, -1]) {
    const n = s > 0 ? 'L' : 'R';
    const sf = joint('skirtF' + n, hips, s * 0.62 * b, 0.22, 0.52, -0.22, 0, 0);
    const w = 0.50 * b;
    add(sf, cbox(w * 0.9, 0.10, 0.12, 0.02), 'frame', 0, 0.0, 0.03);
    const ss = joint('skirtS' + n, hips, s * (D.hipX + 0.46 * b), 0.30, 0, 0, 0, s * 0.20);
    add(ss, cbox(0.12, 0.12, 0.60, 0.02), 'frame', s * 0.03, 0.0, 0);
  }
  joint('skirtB', hips, 0, 0.24, -0.60, 0.16, 0, 0);

  // ------------------------------------------------------------ waist
  const spine = joint('spine', hips, 0, 0.46, 0);
  add(spine, hexY(0.40 * b, 0.48 * b, 0.46, 10), 'frame', 0, 0.14, 0);
  for (const s of [1, -1]) { add(spine, cylY(0.05, 0.05, 0.50, 8), 'metal', s * 0.50 * b, 0.16, -0.08, 0, 0, s * 0.22); add(spine, cylY(0.07, 0.07, 0.22, 8), 'frame', s * 0.53 * b, 0.04, -0.08, 0, 0, s * 0.22); }

  // ------------------------------------------------------------ the chest: its joint, the shoulder mounts and the neck. The body of it is armour
  const chest = joint('chest', spine, 0, 0.38, 0);
  for (const s of [1, -1]) {
    add(chest, hexX(0.28, 0.44), 'metal', s * (D.shoulderX - 0.14), 0.70, 0);                                    // the shoulder mount
    add(chest, cbox(0.36, 0.50, 0.70, 0.06), 'frame', s * (0.90 * cw + 0.06), 0.68, 0);
  }
  add(chest, hexY(0.17, 0.20, 0.18, 8), 'frame', 0, 1.08, 0.06);

  // ------------------------------------------------------------ head: the sensor block and its lamps, and the blade aerial
  // The face is one oblong eye in its housing, set back to look out of the dark under a helmet's nose. Behind it a skull sits
  // on the neck and holds the rest: a block each side, the left one carrying the aerial, and a block at the back.
  const head = joint('head', chest, 0, 1.10, 0.08);
  add(head, cbox(0.42 * hs, 0.25 * hs, 0.18 * hs, 0.02), 'frame', 0, 0.215 * hs, 0.24 * hs);
  add(head, cbox(0.39 * hs, 0.235 * hs, 0.05 * hs, 0.015), 'metal', 0, 0.215 * hs, 0.345 * hs);                      // the eye's housing: a helmet closes right up to it
  add(head, box(0.31 * hs, 0.165 * hs, 0.06 * hs), 'glow', 0, 0.215 * hs, 0.350 * hs);                               // the eye: one oblong pane
  for (const s of [1, -1]) add(head, cbox(0.11 * hs, 0.20 * hs, 0.30 * hs, 0.02), 'frame', s * 0.295 * hs, 0.20 * hs, -0.12 * hs);
  add(head, cbox(0.24 * hs, 0.16 * hs, 0.14 * hs, 0.02), 'frame', 0, 0.24 * hs, -0.46 * hs);
  const ant = joint('ant', head, -0.38 * hs, 0.30 * hs, -0.14 * hs, -0.55, 0, 0);
  add(ant, hull([[-0.014, 0, -0.07], [0.014, 0, -0.07], [-0.014, 0, 0.07], [0.014, 0, 0.07], [-0.008, 0.70, -0.02], [0.008, 0.70, -0.02], [-0.008, 0.65, 0.035], [0.008, 0.65, 0.035]]), 'armor2');
  add(ant, hexX(0.05, 0.06, 6), 'metal', 0, 0, 0);
  add(head, cbox(0.48 * hs, 0.22 * hs, 0.60 * hs, 0.03), 'frame', 0, 0.19 * hs, -0.115 * hs);       // the skull, made last: it is not in the model's record, and so shifts no older part's tint

  // ------------------------------------------------------------ shoulders and arms
  for (const s of [1, -1]) {
    const n = s > 0 ? 'L' : 'R';
    // the shoulder block's hinge rides the shoulder joint's own place, so the block can tip with the arm
    joint('pad' + n, chest, s * D.shoulderX, 0.70, 0, 0, 0, s * -0.05);
    const arm = joint('arm' + n, chest, s * D.shoulderX, 0.70, 0, 0, 0, s * 0.06);
    add(arm, hexX(0.30, 0.46), 'metal', 0, 0, 0);
    add(arm, cbox(0.48 * b, 0.82, 0.54, 0.06), 'frame', s * 0.10, -0.52, 0);
    add(arm, cylY(0.05, 0.05, 0.44, 8), 'metal', s * 0.10, -0.80, -0.31, 0.30, 0, 0);
    const fa = joint('fore' + n, arm, s * 0.10, -0.98, 0);
    add(fa, hexX(0.27, 0.64 * b), 'metal', 0, 0, 0);
    add(fa, hexY(0.22, 0.22, 0.12, 8), 'frame', 0, -1.07, 0);
    const hand = joint('hand' + n, fa, 0, -1.10, 0);
    add(hand, cbox(0.40, 0.34, 0.46, 0.06), 'frame', 0, -0.19, 0.02);
    for (const fxx of [-0.13, 0, 0.13]) add(hand, cbox(0.11, 0.18, 0.15, 0.02), 'metal', fxx, -0.41, 0.16);
    add(hand, cbox(0.13, 0.15, 0.13, 0.02), 'metal', s * -0.22, -0.25, 0.17);
  }

  // ------------------------------------------------------------ legs: a short thick frame, clawed feet, a thruster on each calf
  for (const s of [1, -1]) {
    const n = s > 0 ? 'L' : 'R';
    const th = joint('thigh' + n, hips, s * D.hipX, -D.hipDrop, 0);
    add(th, cbox(0.54 * b, L1 * 0.92, 0.60, 0.07), 'frame', 0, -L1 * 0.52, -0.02);
    for (const t of [1, -1]) add(th, cylY(0.05, 0.05, L1 * 0.50, 8), 'metal', t * 0.15 * b, -L1 * 0.70, -0.36, 0.16, 0, 0);

    const shn = joint('shin' + n, th, 0, -L1, 0);
    add(shn, hexX(0.30, 0.74 * b), 'metal', 0, 0, 0);
    for (const t of [1, -1]) add(shn, hexX(0.22, 0.06, 8), 'frame', t * 0.395 * b, 0, 0);                         // the knee's side caps
    add(shn, cbox(0.48 * b, L2 * 0.90, 0.52, 0.06), 'frame', 0, -L2 * 0.50, -0.02);
    const cn = joint('calf' + n, shn, 0, -L2 * 0.70, -0.72, 0.55, 0, 0);
    add(cn, cylY(0.12, 0.20, 0.30, 10), 'metal', 0, -0.11, 0);
    add(cn, cylY(0.155, 0.155, 0.02, 10), 'burn', 0, -0.255, 0);
    const cf = joint('flameC' + n, cn, 0, -0.27, 0);
    glowAdd(cf, plume(0.15, 0.9, 10), M.flame);
    cf.scale.set(1, 0.001, 1);

    const ft = joint('foot' + n, shn, 0, -L2, 0);
    add(ft, hexX(0.24, 0.66 * b), 'metal', 0, 0, 0);
    add(ft, cbox(1.00 * b, 0.12, 1.70, 0.04), 'frame', 0, -0.44, 0.10);
    for (const tx of [-0.31, 0, 0.31]) add(ft, hull([[(tx - 0.135) * b, -0.50, 0.78], [(tx + 0.135) * b, -0.50, 0.78], [(tx - 0.135) * b, -0.50, 1.24], [(tx + 0.135) * b, -0.50, 1.24],
      [(tx - 0.12) * b, -0.12, 0.80], [(tx + 0.12) * b, -0.12, 0.80], [(tx - 0.10) * b, -0.30, 1.24], [(tx + 0.10) * b, -0.30, 1.24]]), 'frame');           // three toes
    for (const t of [1, -1]) add(ft, hull([[t * 0.12 * b, -0.50, -0.52], [t * 0.40 * b, -0.50, -0.52], [t * 0.14 * b, -0.50, -0.73], [t * 0.36 * b, -0.50, -0.73], [t * 0.14 * b, -0.22, -0.54], [t * 0.38 * b, -0.22, -0.54], [t * 0.16 * b, -0.34, -0.73], [t * 0.34 * b, -0.34, -0.73]]), 'frame');   // two heel spurs
  }

  // ------------------------------------------------------------ what joins the frame's pieces together
  // Under this armour the frame had nothing in the chest, the forearms or behind the calves: the armour is the body there.
  // Plain blocks fill those places so the frame holds together to the eye: a spine from the waist to the neck, a yoke
  // between the shoulder mounts, a bone in each forearm, a strut to each calf thruster. They are for looks alone and light:
  // twelve triangles each, no joint and no mesh of their own. Each end is sunk into a part the frame already had, and in
  // between a block keeps well clear of the armour's inner faces, so none of it shows on a mech in its armour. They are
  // made last and marked hollow: they take no tint from an older part and shade none.
  const fill = (m) => { m.userData.hollow = true; return m; };
  fill(add(chest, loft(ring(-0.10, 0.44, 0.44), ring(1.05, 0.16, 0.16, 0, 0, 0.06)), 'frame'));                    // the spine
  fill(add(chest, box(1.80 * cw - 0.12, 0.32, 0.48), 'frame', 0, 0.68, 0));                                         // the yoke
  for (const n of ['L', 'R']) {
    fill(add(J['fore' + n], loft(ring(-0.14, 0.26, 0.26), ring(-1.06, 0.20, 0.20)), 'frame'));                     // elbow to wrist
    fill(add(J['shin' + n], box(0.16, 0.12, 0.42), 'frame', 0, -L2 * 0.70 + 0.02, -0.43));                         // shin to thruster
  }

  // what the other layers build on: the sizes the sliders came to, the block between the legs, which armour is laid on,
  // and the place on the chest's back where a backpack hangs
  return { ...S, keel, back: [0, 0.52, -0.60] };
}

export const heavy = { name: 'heavy', base: BUILD_BASE, sizes, build, motions };
