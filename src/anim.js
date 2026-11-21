// anim.js — a frame's motions sampled into clips. bake() samples a motion at 30 a second into plain keyframes, so a motion is
// an ordinary clip a game or a glTF file can hold.
import * as THREE from 'three';

// a motion sampled into a clip. Only the joints the motion moves get a track.
export function bake(mech, rig, def, name, fps = 30) {
  const J = mech.joints, frames = Math.max(2, Math.round(def.dur * fps));
  const times = [], rec = {};
  for (const k in J) rec[k] = { p: [], q: [], s: [] };
  const last = {};
  for (let i = 0; i <= frames; i += 1) {
    const u = i / frames; times.push(u * def.dur);
    rig.reset(); def.pose(rig, def.loop && i === frames ? 0 : u);
    for (const k in J) {
      const o = J[k], q = o.quaternion.clone();
      if (last[k] && last[k].dot(q) < 0) q.set(-q.x, -q.y, -q.z, -q.w);
      last[k] = q;
      rec[k].p.push(o.position.x, o.position.y, o.position.z); rec[k].q.push(q.x, q.y, q.z, q.w); rec[k].s.push(o.scale.x, o.scale.y, o.scale.z);
    }
  }
  rig.reset();
  const moved = (arr, n, restArr) => { for (let i = 0; i < arr.length; i += 1) if (Math.abs(arr[i] - restArr[i % n]) > 1e-5) return true; return false; };
  const tracks = [];
  for (const k in J) {
    const r = rig.rest[k];
    if (moved(rec[k].q, 4, [r.q.x, r.q.y, r.q.z, r.q.w]) || moved(rec[k].q.map(Math.abs), 4, [r.q.x, r.q.y, r.q.z, r.q.w].map(Math.abs))) tracks.push(new THREE.QuaternionKeyframeTrack(k + '.quaternion', times, rec[k].q));
    if (moved(rec[k].p, 3, [r.p.x, r.p.y, r.p.z])) tracks.push(new THREE.VectorKeyframeTrack(k + '.position', times, rec[k].p));
    if (moved(rec[k].s, 3, [r.s.x, r.s.y, r.s.z])) tracks.push(new THREE.VectorKeyframeTrack(k + '.scale', times, rec[k].s));
  }
  return new THREE.AnimationClip(name, def.dur, tracks);
}

export function bakeAll(mech) {
  const { makeRig, MOTIONS } = mech.model.frame.motions, rig = makeRig(mech);
  return { rig, clips: Object.keys(MOTIONS).map((n) => bake(mech, rig, MOTIONS[n], n)) };
}
