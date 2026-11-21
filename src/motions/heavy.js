// motions/heavy.js — the heavy frame's motions. Each motion is a function of time that poses the joints (the legs by reaching
// for where a foot should be); anim.js samples it into plain keyframes. A backpack or a weapon brings the part of a motion
// that is its own.
import * as THREE from 'three';

const E = new THREE.Euler(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), V = new THREE.Vector3(), MX = new THREE.Matrix4();
const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const ramp = (u, a, b) => smooth((u - a) / (b - a));

export function makeRig(mech) {
  const J = mech.joints, D = mech.dims;
  const rest = {};
  for (const k in J) rest[k] = { p: J[k].position.clone(), q: J[k].quaternion.clone(), s: J[k].scale.clone() };
  const rig = { J, D, rest, flex: { L: 0, R: 0 }, abd: { L: 0, R: 0 }, jolt: { L: [0, 0], R: [0, 0] } };
  rig.reset = () => { for (const k in J) { J[k].position.copy(rest[k].p); J[k].quaternion.copy(rest[k].q); J[k].scale.copy(rest[k].s); } rig.flex.L = rig.flex.R = rig.abd.L = rig.abd.R = 0; rig.jolt.L = [0, 0]; rig.jolt.R = [0, 0]; };
  // a joint turned from its rest
  rig.rot = (name, x = 0, y = 0, z = 0, order = 'XYZ') => { J[name].quaternion.copy(rest[name].q).multiply(Q.setFromEuler(E.set(x, y, z, order))); };
  // the hips: moved from rest, leaned forward (pitch), turned (yaw: negative brings the left side forward), tipped (roll)
  rig.hips = (dx, dy, dz, pitch = 0, yaw = 0, roll = 0) => {
    J.hips.position.set(rest.hips.p.x + dx, rest.hips.p.y + dy, rest.hips.p.z + dz);
    J.hips.quaternion.setFromEuler(E.set(pitch, yaw, roll, 'YXZ'));
  };
  // an arm: raised forward (fwd), raised sideways (out), swung across the chest (across), twisted; the elbow bent; the wrist bent
  rig.arm = (n, { fwd = 0, out = 0, across = 0, twist = 0, elbow = 0, roll = 0, wrist = 0 } = {}) => {
    const s = n === 'L' ? 1 : -1;
    J['arm' + n].quaternion.copy(rest['arm' + n].q).multiply(Q.setFromEuler(E.set(-fwd, -s * across, s * out, 'YXZ'))).multiply(Q2.setFromEuler(E.set(0, s * twist, 0)));
    J['fore' + n].quaternion.copy(rest['fore' + n].q).multiply(Q.setFromEuler(E.set(-elbow, s * roll, 0, 'YXZ')));
    J['hand' + n].quaternion.copy(rest['hand' + n].q).multiply(Q.setFromEuler(E.set(-wrist, 0, 0)));
    // the shoulder shell goes part of the way with the arm, so a raised arm does not run through it
    J['pad' + n].quaternion.copy(rest['pad' + n].q).multiply(Q.setFromEuler(E.set(-fwd * (n === 'R' ? 0.55 : 0.20) + rig.jolt[n][0], 0, s * (Math.max(0, out) * 0.4 + rig.jolt[n][1]), 'YXZ')));
  };
  // a pose's own jolt of the shoulder shells: (pitch, roll outward) for the left, then the right. Call it before rig.arm.
  rig.pads = (lx = 0, lz = 0, rx = 0, rz = 0) => { rig.jolt.L = [lx, lz]; rig.jolt.R = [rx, rz]; };
  // An arm turned until its forearm, and so whatever its hand holds, points along a line given in the root's space. The raise
  // and the swing across the chest are found; the rest of the arm's pose is as given. Eight steps of Newton's method from
  // the same start every time, so a motion bakes to the same keys however often it is baked.
  const aimQ = new THREE.Quaternion(), aimV = new THREE.Vector3();
  rig.aim = (n, pose, line) => {
    let fwd = 1.2, across = 0.5;
    const turn = Math.atan2(line[0], line[2]), rise = Math.atan2(line[1], Math.hypot(line[0], line[2]));
    const off = (f, c) => { rig.arm(n, { ...pose, fwd: f, across: c }); J['fore' + n].getWorldQuaternion(aimQ); aimV.set(0, -1, 0).applyQuaternion(aimQ);
      return [Math.atan2(aimV.x, aimV.z) - turn, Math.atan2(aimV.y, Math.hypot(aimV.x, aimV.z)) - rise]; };
    for (let i = 0; i < 8; i += 1) {
      const e = off(fwd, across), h = 1e-3, ef = off(fwd + h, across), ec = off(fwd, across + h);
      const a = (ef[0] - e[0]) / h, b = (ec[0] - e[0]) / h, c = (ef[1] - e[1]) / h, d = (ec[1] - e[1]) / h, det = a * d - b * c;
      if (Math.abs(det) < 1e-9) break;
      fwd += clamp((b * e[1] - d * e[0]) / det, -0.4, 0.4); across += clamp((c * e[0] - a * e[1]) / det, -0.4, 0.4);
    }
    rig.arm(n, { ...pose, fwd, across });
  };
  // a leg: its ankle put at (x, y, z) in the root's space, the foot pitched (toes down is positive) and turned (yaw)
  const hipQ = new THREE.Quaternion(), inv = new THREE.Quaternion(), hipPos = new THREE.Vector3(), n = new THREE.Vector3(), f = new THREE.Vector3(),
    fp = new THREE.Vector3(), td = new THREE.Vector3(), xa = new THREE.Vector3(), ya = new THREE.Vector3(), za = new THREE.Vector3();
  rig.leg = (side, x, y, z, pitch = 0, yaw = 0, kneeOut = 0) => {
    const s = side === 'L' ? 1 : -1, L1 = D.L1, L2 = D.L2;
    hipQ.copy(J.hips.quaternion); inv.copy(hipQ).invert();
    hipPos.copy(rest['thigh' + side].p).applyQuaternion(hipQ).add(J.hips.position);
    V.set(x, y, z).sub(hipPos).applyQuaternion(inv);
    const d = clamp(V.length(), Math.abs(L1 - L2) + 0.02, L1 + L2 - 0.004);
    n.copy(V).normalize();
    const a = yaw + s * kneeOut;
    f.set(Math.sin(a), 0.45, Math.cos(a)).applyQuaternion(inv);                      // where the knee tends: forward and a little up
    fp.copy(f).addScaledVector(n, -f.dot(n)); if (fp.lengthSq() < 1e-6) fp.set(0, 0, 1); fp.normalize();
    const al = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    td.copy(n).multiplyScalar(Math.cos(al)).addScaledVector(fp, Math.sin(al));
    za.copy(n).multiplyScalar(-Math.sin(al)).addScaledVector(fp, Math.cos(al));
    ya.copy(td).negate(); xa.crossVectors(ya, za);
    J['thigh' + side].quaternion.setFromRotationMatrix(MX.makeBasis(xa, ya, za));
    const phi = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    J['shin' + side].quaternion.setFromEuler(E.set(Math.PI - phi, 0, 0));
    Q.copy(hipQ).multiply(J['thigh' + side].quaternion).multiply(J['shin' + side].quaternion).invert();
    J['foot' + side].quaternion.copy(Q).multiply(Q2.setFromEuler(E.set(pitch, yaw, 0, 'YXZ')));
    rig.flex[side] = Math.atan2(td.z, -td.y); rig.abd[side] = Math.atan2(s * td.x, -td.y);
  };
  // the skirt plates give way to the thighs
  rig.skirts = () => {
    for (const side of ['L', 'R']) {
      const s = side === 'L' ? 1 : -1;
      rig.rot('skirtF' + side, -Math.max(0, rig.flex[side]) * 0.85, 0, 0);
      rig.rot('skirtS' + side, 0, 0, s * Math.max(0, rig.abd[side]) * 0.9);
    }
    rig.rot('skirtB', Math.max(0, -Math.min(rig.flex.L, rig.flex.R)) * 0.75, 0, 0);
  };
  rig.whip = (x = 0, z = 0) => { rig.rot('ant', x, 0, z); };
  rig.calf = (v) => { for (const k of ['L', 'R']) J['flameC' + k].scale.set(1, Math.max(v, 0.001), 1); };
  // What a backpack or a weapon does in a motion comes from it. A frame that carries none goes through the motion without:
  // the main thrusters' burn, the gun's flash and the cannon's swing are then nothing at all.
  rig.flame = rig.flash = rig.cannon = () => {};
  for (const g of mech.gear) if (g.drive) g.drive(rig);
  return rig;
}

// one foot through one stride, in place: where its ankle is and how the foot is pitched
function gait(p, S, st, lift, D) {
  p = ((p % 1) + 1) % 1;
  if (p < st) {
    const k = p / st, z = S / 2 - S * k;
    if (k < 0.14) { const a = 0.22 * (1 - k / 0.14); return { z, y: D.heel * Math.sin(a) * 0.9, pitch: -a }; }            // the heel lands first
    if (k > 0.72) { const q = (k - 0.72) / 0.28, a = 0.55 * q * q; return { z, y: D.toe * Math.sin(a) * 0.9, pitch: a }; }   // the heel leaves first
    return { z, y: 0, pitch: 0 };
  }
  const k = (p - st) / (1 - st);
  const y0 = D.toe * Math.sin(0.55) * 0.9, y1 = D.heel * Math.sin(0.22) * 0.9;
  return { z: -S / 2 + S * smooth(k), y: lerp(y0, y1, k) + lift * Math.sin(Math.PI * k), pitch: lerp(0.55, -0.22, smooth(k)) };
}

// the walk's own numbers, kept where the page can read them: the ground has to pass under the feet at the pace they tread it
export const WALK = { dur: 1.5, st: 0.62, stride: (D) => 1.5 * (D.L1 + D.L2) / 2.2 };
export const walkSpeed = (D) => WALK.stride(D) / (WALK.st * WALK.dur) * D.scale;

// Every stance here is wide and bent: the feet a long way apart, the knees turned out, the hips low between them.
export const MOTIONS = {
  Idle: { dur: 3.2, loop: true, pose(rig, u) {
    const D = rig.D, b = Math.sin(TAU * u), b2 = Math.sin(TAU * u + 1.2);
    rig.hips(0, -0.06 - 0.03 * (0.5 - 0.5 * Math.cos(TAU * u)), 0, 0.05, -0.12, 0);
    rig.rot('spine', 0.02 * b, 0.05 * b2, 0); rig.rot('chest', 0.02 * b, -0.02 * b2, 0);
    rig.rot('head', -0.03, 0.12 + 0.30 * Math.sin(TAU * u), 0, 'YXZ');
    rig.pads(0, 0.012 * b, 0, 0.012 * b);
    rig.arm('R', { fwd: 0.40 + 0.02 * b, out: 0.14, across: 0.08, elbow: 1.00 });
    rig.arm('L', { fwd: 0.14, out: 0.24, elbow: 0.46 + 0.03 * b2 });
    rig.leg('L', D.stance + 0.06, D.footH, 0.30, 0, 0.30, 0.25); rig.leg('R', -(D.stance + 0.08), D.footH, -0.22, 0, -0.34, 0.25);
    rig.whip(0.03 * b2, 0.02 * b); rig.flame(0); rig.cannon(0, 0, 0, 0); rig.skirts();
  } },

  Walk: { dur: WALK.dur, loop: true, pose(rig, u) {
    const D = rig.D, S = WALK.stride(D), st = WALK.st;
    const L = gait(u, S, st, 0.46, D), R = gait(u + 0.5, S, st, 0.46, D);
    const c1 = Math.cos(TAU * u), sw = Math.sin(TAU * (u - 0.05)), hit = Math.exp(-7 * ((2 * u) % 1));
    rig.hips(0.15 * sw, -0.05 - 0.06 * Math.cos(2 * TAU * (u - 0.04)), 0, 0.08 + 0.02 * Math.cos(2 * TAU * u), -0.10 * c1, 0.045 * sw);
    rig.rot('spine', 0.01, 0.08 * c1, -0.025 * sw); rig.rot('chest', 0.02 * Math.cos(2 * TAU * (u - 0.06)), 0.06 * c1, -0.02 * sw);
    rig.rot('head', -0.04, -0.05 * c1, 0, 'YXZ');
    rig.pads(0, 0.05 * hit, 0, 0.05 * hit);
    rig.arm('R', { fwd: 0.38 + 0.05 * c1, out: 0.14, across: 0.08, elbow: 1.02 - 0.04 * c1 });
    rig.arm('L', { fwd: -0.22 * c1, out: 0.22, elbow: 0.42 + 0.12 * (0.5 - 0.5 * c1) });
    rig.leg('L', D.stance - 0.10, D.footH + L.y, L.z, L.pitch, 0.22, 0.2); rig.leg('R', -(D.stance - 0.10), D.footH + R.y, R.z, R.pitch, -0.22, 0.2);
    rig.whip(0.16 * Math.cos(2 * TAU * (u - 0.14)), -0.08 * Math.sin(TAU * (u - 0.15))); rig.flame(0); rig.skirts();
  } },

  Sprint: { dur: 0.8, loop: true, pose(rig, u) {
    const D = rig.D, w = Math.sin(TAU * u), w2 = Math.sin(2 * TAU * u + 0.7);
    rig.hips(0.02 * w, -0.22 + 0.03 * w2, 0.10, 0.36, 0, 0.03 * w);
    rig.rot('spine', 0.10, 0, 0); rig.rot('chest', 0.08 + 0.01 * w2, 0, 0); rig.rot('head', -0.44, 0, 0);
    rig.pads(-0.10, 0.04, -0.10, 0.04);
    rig.arm('R', { fwd: 1.30 + 0.02 * w2, out: 0.06, across: 0.10, elbow: 0.86 });
    rig.arm('L', { fwd: 0.90, out: 0.20, across: 0.44, elbow: 1.36 });
    rig.leg('L', D.stance - 0.16, D.footH + 0.34 + 0.03 * w, 0.80 + 0.05 * w, 0.30, 0.10, 0.2);
    rig.leg('R', -(D.stance - 0.10), D.footH + 0.60 - 0.03 * w, -1.00 - 0.05 * w, 0.9, -0.10, 0.2);
    rig.whip(-0.55 + 0.05 * Math.sin(TAU * u * 4), 0.03 * w); rig.flame(1.45 + 0.16 * Math.sin(TAU * u * 5) + 0.10 * Math.sin(TAU * u * 9 + 1)); rig.calf(0.9 + 0.2 * Math.sin(TAU * u * 7)); rig.skirts();
  } },

  Shoot: { dur: 0.6, loop: true, pose(rig, u) {
    // three heavy shots a loop: a shot is six frames at 30 a second, so every shot bakes to the same kick and the same flash
    const D = rig.D, r = (u * 3) % 1, k = Math.exp(-r * 6.5), fl = Math.max(0, 1 - r * 5);
    // Braced to take the gun's kick: side on with the left shoulder to the target, low and leaning into the shot, the back foot
    // turned out behind. Each shot pushes the hips back and down and rocks the chest; the stance gives, then comes forward again.
    rig.hips(0.05, -0.34 - 0.04 * k, 0.12 - 0.18 * k, 0.20 - 0.07 * k, -0.50, 0);
    rig.rot('spine', 0.08, -0.10, 0); rig.rot('chest', 0.06 - 0.06 * k, -0.08, 0);
    rig.rot('head', -0.30, 0.66, 0, 'YXZ');
    rig.pads(0, 0, 0, 0.09 * k);
    // the gun stays on its line whatever the body does under it; the kick folds the elbow and lifts the muzzle a little
    rig.aim('R', { out: 0.10, elbow: 0.55 + 0.24 * k }, [0, 0.05 * k, 1]);
    // the shield held across the chest, the gun past its edge
    rig.arm('L', { fwd: 1.05, out: 0.10, across: 0.55, elbow: 1.25, roll: -0.3 });
    rig.leg('L', D.stance + 0.02, D.footH, 0.90, 0, 0.15, 0.25); rig.leg('R', -(D.stance + 0.16), D.footH, -0.80, 0, -0.85, 0.25);
    rig.whip(-0.22 * k, 0.05 * k); rig.flash(fl > 0 ? 0.6 + 0.6 * fl : 0); rig.flame(0); rig.skirts();
  } },

  Cannon: { dur: 2.8, loop: false, pose(rig, u) {
    const D = rig.D, T0 = 0.50;
    const brace = ramp(u, 0.0, 0.20) * (1 - ramp(u, 0.84, 1.0));
    const dep = ramp(u, 0.05, 0.30) * (1 - ramp(u, 0.78, 0.97)), unf = ramp(u, 0.20, 0.42) * (1 - ramp(u, 0.64, 0.84));
    const since = u - T0, kick = since >= 0 ? Math.exp(-since * 10) * (1 - Math.exp(-since * 90)) : 0;            // up in an instant, eased away
    const fl = Math.max(0, 1.3 - Math.abs(u - (T0 + 0.012)) * 44), burst = ramp(u, T0, T0 + 0.02) * (1 - ramp(u, T0 + 0.06, T0 + 0.20));
    rig.hips(0, -0.06 - 0.20 * brace + 0.05 * kick, -0.34 * kick, 0.05 + 0.10 * brace - 0.17 * kick, -0.12 + 0.08 * brace, 0);
    rig.rot('spine', 0.04 * brace - 0.05 * kick, 0, 0); rig.rot('chest', 0.03 * brace - 0.08 * kick, 0, 0);
    rig.rot('head', -0.05 * brace + 0.12 * kick, 0.12 - 0.12 * brace, 0, 'YXZ');
    rig.pads(-0.10 * kick, 0.05 * kick, -0.16 * kick, 0.10 * kick);
    rig.arm('R', { fwd: 0.40 - 0.22 * brace, out: 0.14 + 0.18 * brace, across: 0.08 * (1 - brace), elbow: 1.00 - 0.34 * brace + 0.20 * kick });
    rig.arm('L', { fwd: 0.14 + 0.30 * brace, out: 0.24 + 0.06 * brace, across: 0.18 * brace, elbow: 0.46 + 0.50 * brace + 0.15 * kick });
    rig.leg('L', D.stance + 0.06 + 0.14 * brace, D.footH, 0.30 + 0.26 * brace, 0, 0.30, 0.25);
    rig.leg('R', -(D.stance + 0.08 + 0.12 * brace), D.footH, -0.22 - 0.40 * brace, 0, -0.34 - 0.10 * brace, 0.25);
    rig.whip(-0.55 * kick, 0.06 * kick); rig.flame(1.35 * burst); rig.calf(0.8 * burst);
    rig.cannon(dep, unf, 0.46 * kick, fl); rig.skirts();
  } },

  Dodge: { dur: 1.0, loop: false, pose(rig, u) {
    const D = rig.D, a = ramp(u, 0, 0.16), b = ramp(u, 0.10, 0.40), c = ramp(u, 0.62, 1.0), lean = b - c;
    rig.hips(0.34 * lean, -0.06 - 0.22 * Math.sin(Math.PI * clamp(u / 0.92, 0, 1)), 0, 0.10 * lean, -0.10, -0.30 * lean);
    rig.rot('spine', 0, 0, -0.10 * lean); rig.rot('chest', 0.05 * lean, 0.10 * lean, -0.08 * lean);
    rig.rot('head', 0, 0.12 - 0.30 * lean, 0.20 * lean, 'YXZ');
    rig.pads(0, 0.10 * lean, 0, -0.06 * lean);
    rig.arm('R', { fwd: 0.40 + 0.20 * lean, out: 0.14 + 0.10 * lean, across: 0.08, elbow: 1.00 + 0.25 * lean });
    rig.arm('L', { fwd: 0.14 + 0.16 * lean, out: 0.24 + 0.40 * lean, elbow: 0.46 + 0.40 * lean });
    rig.leg('L', D.stance + 0.06 + 0.56 * lean, D.footH + 0.14 * Math.sin(Math.PI * b) * (1 - c), 0.30, 0, 0.30 + 0.20 * lean, 0.25);
    rig.leg('R', -(D.stance + 0.08) + 0.34 * lean, D.footH + 0.34 * lean * (1 - a * 0.2), -0.22 - 0.06 * lean, 0.45 * lean, -0.34, 0.25);
    const burst = Math.sin(Math.PI * ramp(u, 0.06, 0.66));
    rig.whip(0.05 * lean, 0.55 * (ramp(u, 0.08, 0.30) - ramp(u, 0.45, 0.80)) - 0.25 * Math.sin(Math.PI * ramp(u, 0.70, 1.0))); rig.flame(1.3 * burst); rig.calf(0.85 * burst); rig.skirts();
  } },

  Guard: { dur: 2.4, loop: true, pose(rig, u) {
    // Behind the shield: side on and low as for a shot, the shield stood up in front of the chest and the head, the gun held
    // low beside it, still on the target. It holds there and breathes: a stance to stay in for as long as the blows keep coming.
    const D = rig.D, b = Math.sin(TAU * u), b2 = Math.sin(TAU * u + 1.2);
    rig.hips(0.04, -0.40 - 0.02 * (0.5 - 0.5 * Math.cos(TAU * u)), 0.04, 0.14, -0.70, 0);
    rig.rot('spine', 0.06 + 0.01 * b, -0.10, 0); rig.rot('chest', 0.06 + 0.01 * b, -0.08, 0);
    rig.rot('head', -0.10, 0.82 + 0.05 * b2, 0, 'YXZ');
    rig.pads(0, 0.012 * b, 0, 0.012 * b);
    rig.arm('L', { fwd: 1.45 + 0.02 * b, across: 0.90, elbow: 1.90, roll: -0.2 });
    rig.aim('R', { out: 0.12, elbow: 0.95 + 0.02 * b2 }, [0, -0.28, 1]);
    rig.leg('L', D.stance, D.footH, 0.85, 0, 0.10, 0.25); rig.leg('R', -(D.stance + 0.20), D.footH, -0.78, 0, -0.90, 0.25);
    rig.whip(0.03 * b2, 0.02 * b); rig.flame(0); rig.skirts();
  } },

  Jump: { dur: 1.5, loop: false, pose(rig, u) {
    const D = rig.D;
    const cr = ramp(u, 0, 0.14) * (1 - ramp(u, 0.16, 0.26)), air = ramp(u, 0.20, 0.34) * (1 - ramp(u, 0.66, 0.74)), land = ramp(u, 0.72, 0.78) * (1 - ramp(u, 0.80, 1.0));
    rig.hips(0, -0.06 - 0.48 * cr - 0.54 * land + 0.14 * air, 0.05 * cr - 0.05 * air, 0.05 + 0.20 * cr + 0.24 * land - 0.10 * air, -0.10, 0);
    rig.rot('spine', 0.10 * cr + 0.10 * land, 0, 0); rig.rot('chest', 0.06 * cr + 0.10 * land - 0.08 * air, 0, 0);
    rig.rot('head', -0.15 * cr - 0.20 * land + 0.15 * air, 0.10, 0, 'YXZ');
    rig.pads(0, 0.12 * land - 0.07 * air, 0, 0.12 * land - 0.07 * air);
    rig.arm('R', { fwd: 0.40 + 0.20 * cr + 0.40 * air + 0.30 * land, out: 0.14 + 0.16 * air, across: 0.08, elbow: 1.00 + 0.40 * cr - 0.24 * air + 0.35 * land });
    rig.arm('L', { fwd: 0.14 - 0.30 * cr + 0.20 * air + 0.16 * land, out: 0.24 + 0.50 * air, elbow: 0.46 + 0.36 * cr + 0.44 * land });
    rig.leg('L', D.stance + 0.06 - 0.22 * air, D.footH + 0.70 * air, 0.30 + 0.20 * air, 0.45 * air, 0.30, 0.25);
    rig.leg('R', -(D.stance + 0.08 - 0.22 * air), D.footH + 0.44 * air, -0.22 - 0.30 * air, 0.75 * air, -0.34, 0.25);
    const burst = ramp(u, 0.14, 0.22) * (1 - ramp(u, 0.50, 0.72));
    rig.whip(-0.30 * cr + 0.40 * air - 0.45 * land, 0); rig.flame(1.5 * burst); rig.calf(0.8 * burst); rig.skirts();
  } },

  Win: { dur: 2.6, loop: false, pose(rig, u) {
    const D = rig.D, a = ramp(u, 0.0, 0.32), b = ramp(u, 0.18, 0.50), fl = ramp(u, 0.50, 0.60) * (1 - ramp(u, 0.72, 0.95));
    const nod = Math.sin(Math.PI * ramp(u, 0.50, 0.80));
    rig.hips(0, -0.06 + 0.10 * a - 0.03 * nod, 0, 0.05 - 0.07 * a, -0.12 + 0.04 * a, 0);
    rig.rot('spine', -0.03 * b, 0.04 * a, 0); rig.rot('chest', -0.05 * b, 0.04 * a, 0);
    rig.rot('head', -0.06 * b, 0.12 + 0.26 * a, 0, 'YXZ');
    rig.pads(0, 0.04 * nod, 0, 0.04 * nod);
    rig.arm('R', { fwd: lerp(0.40, 0.72, b), out: lerp(0.14, 0.08, b), across: lerp(0.08, 0.20, b), elbow: lerp(1.00, 2.30, b) });
    rig.arm('L', { fwd: lerp(0.14, 0.06, a), out: lerp(0.24, 0.32, a), elbow: lerp(0.46, 0.30, a) });
    rig.leg('L', D.stance + 0.06, D.footH, 0.30 - 0.10 * a, 0, 0.30, 0.25); rig.leg('R', -(D.stance + 0.08), D.footH, -0.22 + 0.10 * a, 0, -0.34, 0.25);
    rig.whip(0.20 * nod, 0.04 * a); rig.flame(0.9 * fl); rig.calf(0.5 * fl); rig.skirts();
  } },
};
