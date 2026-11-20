// mech.js — a heavy military mech, squat and wide: slab armour over a dark frame, every plate a plain faceted solid, on a tree of joints.
// No skin: every part is rigid and rides its joint. The model faces +Z, stands on y = 0, and its own left is +X.
// It is built in its own units and stood in the scene at D.scale: the head then tops out near 6 (a unit of the game is 6.4),
// the shoulder blocks a little above that, the rocket pod and the stowed cannon near 7.
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const PALETTES = {
  olive: { label: '橄欖', armor: 0x4D5834, armor2: 0x363D25, frame: 0x2A2D2E, metal: 0x70767A, accent: 0xC9541F, mark: 0xDDD9C6, glow: 0xFF7A1F, edge: 0xAEB98C },
  slate: { label: '藍灰', armor: 0x66838C, armor2: 0x455A63, frame: 0x22262A, metal: 0x6C747A, accent: 0xC2A93A, mark: 0xE9E9E2, glow: 0x86FF74, edge: 0xBFD3D8 },
  desert: { label: '沙漠', armor: 0xB79E72, armor2: 0x8E7754, frame: 0x302D2A, metal: 0x79756D, accent: 0x7C2D1E, mark: 0x2E2A24, glow: 0x6FE3FF, edge: 0xE9DCBC },
  night: { label: '夜間', armor: 0x353A40, armor2: 0x24282C, frame: 0x16181A, metal: 0x4E5459, accent: 0xA6342A, mark: 0x9AA0A4, glow: 0xFF2E2E, edge: 0x7C858C },
};
// the build that was chosen on the board (2026-11-20): as bulky as the slider goes, narrow shoulders, short legs, a slightly larger head
export const BUILD_DEFAULT = { bulk: 1.25, shoulders: 0.81, legs: 0.85, head: 1.12 };

// ------------------------------------------------------------ shapes
const V3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
// the solid that wraps a set of corners: flat faces, sloped wherever the corners say
const hull = (pts) => new ConvexGeometry(pts.map(V3));
// the corners of a rectangle lying flat at height y: w wide (x), d deep (z), centred on (cx, cz); c cuts its four corners
const ring = (y, w, d, c = 0, cx = 0, cz = 0) => {
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  if (!c) return [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]];
  return [[x0 + c, y, z0], [x1 - c, y, z0], [x1, y, z0 + c], [x1, y, z1 - c], [x1 - c, y, z1], [x0 + c, y, z1], [x0, y, z1 - c], [x0, y, z0 + c]];
};
// the same standing upright at depth z: w wide (x), h tall (y)
const ringZ = (z, w, h, c = 0, cx = 0, cy = 0) => ring(0, w, h, c, cx, cy).map(([x, , y]) => [x, y, z]);
const loft = (...rings) => hull(rings.flat());
// a box with every edge cut
function cbox(w, h, d, c = 0.03) {
  c = Math.min(c, w / 2.2, h / 2.2, d / 2.2);
  const a = w / 2, b = h / 2, e = d / 2, p = [];
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) p.push([sx * (a - c), sy * b, sz * (e - c)], [sx * a, sy * (b - c), sz * (e - c)], [sx * (a - c), sy * (b - c), sz * e]);
  return hull(p);
}
// an armour tile facing +Z: an outline (u, v) t thick, and a smaller outline (or a ridge line) raised to tb, so its rim slopes
const tile = (outline, t, boss, tb) => hull([...outline.map(([u, v]) => [u, v, 0]), ...outline.map(([u, v]) => [u, v, t]), ...(boss || []).map(([u, v]) => [u, v, tb])]);
// a rectangle outline with its corners cut
const oct = (w, h, c, cx = 0, cy = 0) => [[cx - w / 2 + c, cy + h / 2], [cx + w / 2 - c, cy + h / 2], [cx + w / 2, cy + h / 2 - c], [cx + w / 2, cy - h / 2 + c], [cx + w / 2 - c, cy - h / 2], [cx - w / 2 + c, cy - h / 2], [cx - w / 2, cy - h / 2 + c], [cx - w / 2, cy + h / 2 - c]];
const flat = (g) => { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; };
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cylY = (rt, rb, h, seg = 14) => new THREE.CylinderGeometry(rt, rb, h, seg);
const cylX = (r, len, seg = 14) => { const g = new THREE.CylinderGeometry(r, r, len, seg); g.rotateZ(Math.PI / 2); return g; };
const cylZ = (r, len, seg = 14) => { const g = new THREE.CylinderGeometry(r, r, len, seg); g.rotateX(Math.PI / 2); return g; };
const hexX = (r, len, seg = 8) => flat(cylX(r, len, seg));
const hexY = (rt, rb, h, seg = 8) => flat(cylY(rt, rb, h, seg));
const hexZ = (r, len, seg = 8) => flat(cylZ(r, len, seg));

// ------------------------------------------------------------ stencil marks: one sheet, cut into cells
const CELLS = { num: [0, 0, 256, 160], serial: [256, 0, 384, 80], nostep: [256, 80, 384, 80], danger: [640, 0, 384, 80], lift: [640, 80, 192, 80], warn: [832, 80, 160, 160],
  hazard: [0, 160, 512, 64], sign: [0, 224, 160, 160], bars: [160, 224, 192, 96], text: [352, 240, 384, 96] };
const SHEET = [1024, 512];
function stencilSheet(palette) {
  const c = document.createElement('canvas'); c.width = SHEET[0]; c.height = SHEET[1]; const g = c.getContext('2d');
  const hex = (n) => '#' + n.toString(16).padStart(6, '0');
  const ink = hex(palette.mark), hot = hex(palette.accent);
  const cut = (x, y, w, h, step) => { g.globalCompositeOperation = 'destination-out'; for (let i = x + step * 0.5; i < x + w; i += step) g.fillRect(i, y, 3, h); g.globalCompositeOperation = 'source-over'; };
  const word = (cell, text, size, step = 34) => { const [x, y, w, h] = CELLS[cell]; g.fillStyle = ink; g.font = `900 ${size}px "Arial Narrow", "Helvetica Neue", Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x + w / 2, y + h / 2 + 2, w - 12); cut(x, y, w, h, step); };
  word('num', '03', 150, 46); word('serial', 'AV-098', 66); word('nostep', 'NO STEP', 60); word('danger', 'DANGER', 66); word('lift', 'LIFT', 60);
  { const [x, y, w, h] = CELLS.warn; g.strokeStyle = hot; g.lineWidth = 14; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x + w / 2, y + 16); g.lineTo(x + w - 14, y + h - 18); g.lineTo(x + 14, y + h - 18); g.closePath(); g.stroke();
    g.fillStyle = hot; g.fillRect(x + w / 2 - 7, y + 60, 14, 46); g.fillRect(x + w / 2 - 7, y + 114, 14, 14); }
  { const [x, y, w, h] = CELLS.hazard; g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = '#16181A'; g.fillRect(x, y, w, h); g.fillStyle = hot; for (let i = -h; i < w + h; i += 64) { g.beginPath(); g.moveTo(x + i, y + h); g.lineTo(x + i + 32, y + h); g.lineTo(x + i + 32 + h, y); g.lineTo(x + i + h, y); g.closePath(); g.fill(); } g.restore(); }
  { const [x, y, w, h] = CELLS.sign; g.strokeStyle = ink; g.lineWidth = 12; g.beginPath(); g.arc(x + w / 2, y + h / 2, 62, Math.PI * 0.62, Math.PI * 2.38); g.stroke();      // an open ring round a chevron
    g.lineWidth = 16; g.lineJoin = 'miter'; g.beginPath(); g.moveTo(x + 44, y + 58); g.lineTo(x + w / 2, y + 100); g.lineTo(x + w - 44, y + 58); g.stroke(); g.fillStyle = ink; g.fillRect(x + w / 2 - 8, y + 30, 16, 34); }
  { const [x, y] = CELLS.bars; g.fillStyle = ink; g.fillRect(x + 12, y + 16, 168, 22); g.fillRect(x + 12, y + 56, 110, 22); }
  { const [x, y, w] = CELLS.text; g.fillStyle = ink; for (let r = 0; r < 4; r += 1) { let u = x + 8; const row = [34, 58, 22, 46, 30, 64, 26, 40]; for (let i = 0; i < row.length && u < x + w - 40 - r * 50; i += 1) { const len = row[(i + r * 3) % row.length]; g.fillRect(u, y + 8 + r * 22, len, 9); u += len + 10; } } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.name = 'stencils';
  return t;
}

// a small seeded run of numbers, so every build tints its panels the same way
function seeded(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function buildMech(build = BUILD_DEFAULT, palette = PALETTES.olive) {
  const P = { ...BUILD_DEFAULT, ...build };
  const b = P.bulk, sh = P.shoulders, lg = P.legs, hd = P.head;
  const s1 = 0.72 + 0.28 * sh;                    // how far the shoulders stand out
  // sit: how far the hips rest below a straight leg's reach, since this machine always stands with its legs spread and bent
  const D = { footH: 0.50, L1: 1.30 * lg, L2: 1.50 * lg, hipX: 0.86 * (0.6 + 0.4 * b), hipDrop: 0.14, toe: 1.24, heel: 0.73, sit: 0.34, scale: 1.15 };
  D.hipY = D.footH + D.L2 + D.L1 + D.hipDrop - D.sit;
  D.shoulderX = 1.30 * b * s1; D.stance = D.hipX + 0.62;
  const L1 = D.L1, L2 = D.L2, cw = b * s1;

  const paint = (color, roughness, metalness) => new THREE.MeshStandardMaterial({ color, roughness, metalness, vertexColors: true });
  const light = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, vertexColors: true, toneMapped: false, fog: false });
  // a plume: a cone hanging from its mouth, bright there and gone by its tip
  const plume = (r, len, seg = 14) => {
    const g = new THREE.ConeGeometry(r, len, seg, 6, true); g.rotateX(Math.PI); g.translate(0, -len / 2, 0);
    const pos = g.attributes.position, col = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i += 1) { const k = Math.min(1, Math.max(0, -pos.getY(i) / len)); col.set([1, 1, 1, (1 - k) * (1 - k)], i * 4); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 4)); return g;
  };
  // a muzzle blast: a cone that opens from its point along +Z, bright at the point and gone by its mouth
  const blast = (len, r, seg = 12) => {
    const g = new THREE.ConeGeometry(r, len, seg, 5, true); g.rotateX(-Math.PI / 2); g.translate(0, 0, len / 2);
    const pos = g.attributes.position, col = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i += 1) { const k = Math.min(1, Math.max(0, pos.getZ(i) / len)); col.set([1, 1, 1, Math.pow(1 - k, 1.4)], i * 4); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 4)); return g;
  };
  const white = (g) => { const n = g.attributes.position.count, col = new Float32Array(n * 4).fill(1); g.setAttribute('color', new THREE.BufferAttribute(col, 4)); return g; };
  const sheet = stencilSheet(palette);
  const M = {
    armor: paint(palette.armor, 0.64, 0.12), armor2: paint(palette.armor2, 0.68, 0.12), frame: paint(palette.frame, 0.52, 0.55), metal: paint(palette.metal, 0.36, 0.85),
    accent: paint(palette.accent, 0.6, 0.1), stripe: paint(palette.mark, 0.7, 0.05),
    glow: new THREE.MeshStandardMaterial({ color: 0x0B0B0B, emissive: palette.glow, emissiveIntensity: 2.6, roughness: 0.4, metalness: 0 }),
    burn: new THREE.MeshStandardMaterial({ color: 0x0C0E10, emissive: 0x3E7FC4, emissiveIntensity: 0.55, roughness: 0.5, metalness: 0.4 }),
    decal: new THREE.MeshStandardMaterial({ map: sheet, alphaTest: 0.4, roughness: 0.85, metalness: 0, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }),
    edge: new THREE.LineBasicMaterial({ color: palette.edge, transparent: true, opacity: 0.26 }),
    flame: light(0x9AD4FF, 0.62), core: light(0xFFFFFF, 0.9), flash: light(0xFFD47E, 0.95),
  };
  for (const k in M) M[k].name = k;

  const root = new THREE.Group(); root.name = 'mech'; root.scale.setScalar(D.scale);
  const J = {}; const fx = [];
  const joint = (name, parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    const o = new THREE.Group(); o.name = name; o.position.set(x, y, z); o.rotation.set(rx, ry, rz); parent.add(o); J[name] = o; return o;
  };
  const add = (parent, geo, key, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, order = 'XYZ') => {
    const m = new THREE.Mesh(geo, M[key]); m.position.set(x, y, z); m.rotation.set(rx, ry, rz, order); m.userData.key = key; parent.add(m); return m;
  };
  const glowAdd = (parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.userData.fx = true; m.renderOrder = 5; parent.add(m); fx.push(m); return m;
  };
  // a stencil mark: a cell of the sheet on a small plane, w wide, facing its own +Z
  const mark = (parent, cell, w, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const [cx, cy, cwd, chh] = CELLS[cell]; const h = w * chh / cwd; const g = new THREE.PlaneGeometry(w, h);
    const u0 = cx / SHEET[0], u1 = (cx + cwd) / SHEET[0], v1 = 1 - cy / SHEET[1], v0 = 1 - (cy + chh) / SHEET[1];
    g.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v1, u1, v1, u0, v0, u1, v0], 2));
    const m = new THREE.Mesh(g, M.decal); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.userData.key = 'decal'; parent.add(m); return m;
  };
  // the same laid on a part's own face: (u, v) across that part's +Z face, lift above it
  const QZ = new THREE.Quaternion(), ZAX = new THREE.Vector3(0, 0, 1);
  const markOn = (m, cell, w, u, v, lift, spin = 0) => {
    const d = mark(m.parent, cell, w, 0, 0, 0);
    d.quaternion.copy(m.quaternion).multiply(QZ.setFromAxisAngle(ZAX, spin)); d.position.set(u, v, lift + 0.004).applyQuaternion(m.quaternion).add(m.position); return d;
  };
  // a part set on another part's own +Z face the same way
  const partOn = (m, geo, key, u, v, lift, spin = 0) => {
    const d = add(m.parent, geo, key);
    d.quaternion.copy(m.quaternion).multiply(QZ.setFromAxisAngle(ZAX, spin)); d.position.set(u, v, lift).applyQuaternion(m.quaternion).add(m.position); return d;
  };
  const boltsOn = (m, pts, lift, r = 0.022) => { for (const [u, v] of pts) partOn(m, hexZ(r, 0.016, 6), 'metal', u, v, lift + 0.004); };
  // where a ray from `from` toward `to` (in the part's joint's own space) first meets the part, and how the face lies there:
  // the frame returned has +Z out of the face and +Y as near to `up` as the face allows
  const RC = new THREE.Raycaster(), QW = new THREE.Quaternion(), BX = new THREE.Vector3(), BY = new THREE.Vector3(), BM = new THREE.Matrix4();
  const face = (m, from, to, up = [0, 1, 0]) => {
    const p = m.parent; root.updateMatrixWorld(true);
    const o = p.localToWorld(V3(from)), t = p.localToWorld(V3(to));
    RC.set(o, t.sub(o).normalize()); const h = RC.intersectObject(m, false)[0];
    if (!h) return null;
    p.getWorldQuaternion(QW); QW.invert();
    const n = h.face.normal.clone().transformDirection(m.matrixWorld).applyQuaternion(QW).normalize();
    BY.set(up[0], up[1], up[2]); BY.addScaledVector(n, -BY.dot(n)); if (BY.lengthSq() < 1e-6) BY.set(0, 0, -1).addScaledVector(n, n.z); BY.normalize(); BX.crossVectors(BY, n);
    return { parent: p, pos: p.worldToLocal(h.point.clone()), quat: new THREE.Quaternion().setFromRotationMatrix(BM.makeBasis(BX, BY, n)) };
  };
  const lay = (f, geo, key, u = 0, v = 0, lift = 0, spin = 0) => {
    if (!f) return null; const d = add(f.parent, geo, key);
    d.quaternion.copy(f.quat).multiply(QZ.setFromAxisAngle(ZAX, spin)); d.position.set(u, v, lift).applyQuaternion(f.quat).add(f.pos); return d;
  };
  const seam = (m, from, to, len, spin = 0, u = 0, v = 0) => lay(face(m, from, to), box(len, 0.014, 0.008), 'frame', u, v, 0.001, spin);
  const layMark = (f, cell, w, u = 0, v = 0, spin = 0) => {
    if (!f) return null; const d = mark(f.parent, cell, w, 0, 0, 0);
    d.quaternion.copy(f.quat).multiply(QZ.setFromAxisAngle(ZAX, spin)); d.position.set(u, v, 0.005).applyQuaternion(f.quat).add(f.pos); return d;
  };

  // ------------------------------------------------------------ hips: a wide dark pelvis, the legs set far apart
  const hips = joint('hips', root, 0, D.hipY, 0);
  add(hips, cbox(1.46 * b, 0.62, 0.92, 0.08), 'frame', 0, -0.04, 0);
  add(hips, loft(ring(0.20, 1.72 * b, 1.12, 0.20), ring(0.44, 1.30 * b, 0.86, 0.16)), 'armor');                  // the belt, sloped all round
  const keel = add(hips, hull([[-0.27, 0.16, 0.40], [0.27, 0.16, 0.40], [-0.30, 0.10, 0.76], [0.30, 0.10, 0.76], [-0.30, -0.40, 0.82], [0.30, -0.40, 0.82],
    [-0.22, -0.76, 0.62], [0.22, -0.76, 0.62], [-0.22, -0.72, 0.36], [0.22, -0.72, 0.36]]), 'frame');              // the block between the legs
  const cap = add(hips, hull([[-0.32, 0.24, 0.44], [0.32, 0.24, 0.44], [-0.34, 0.22, 0.80], [0.34, 0.22, 0.80], [-0.34, 0.02, 0.86], [0.34, 0.02, 0.86], [-0.32, 0.0, 0.44], [0.32, 0.0, 0.44]]), 'armor');
  seam(cap, [0, 0.12, 3], [0, 0.12, 0], 0.50);
  for (const t of [1, -1]) lay(face(cap, [t * 0.24, 0.12, 3], [t * 0.24, 0.12, 0]), hexZ(0.026, 0.02, 6), 'metal', 0, 0.05, 0.008);
  lay(face(keel, [0, -0.20, 3], [0, -0.20, 0]), tile(oct(0.30, 0.34, 0.05), 0.02, oct(0.20, 0.24, 0.03), 0.05), 'armor2');
  add(hips, cbox(0.80 * b, 0.50, 0.28, 0.05), 'frame', 0, -0.08, -0.52);
  for (const s of [1, -1]) add(hips, hexX(0.31, 0.36), 'metal', s * D.hipX, -D.hipDrop, 0);
  for (const s of [1, -1]) {
    const n = s > 0 ? 'L' : 'R';
    const sf = joint('skirtF' + n, hips, s * 0.62 * b, 0.22, 0.52, -0.22, 0, 0);
    const w = 0.50 * b;
    const sft = add(sf, tile([[-w / 2, 0], [w / 2, 0], [w / 2, -0.44], [w / 2 - 0.12, -0.64], [-w / 2 + 0.12, -0.64], [-w / 2, -0.44]], 0.07,
      [[-w / 2 + 0.07, -0.07], [w / 2 - 0.07, -0.07], [w / 2 - 0.07, -0.40], [w / 2 - 0.15, -0.56], [-w / 2 + 0.15, -0.56], [-w / 2 + 0.07, -0.40]], 0.12), 'armor');
    add(sf, cbox(w * 0.9, 0.10, 0.12, 0.02), 'frame', 0, 0.0, 0.03);
    markOn(sft, 'lift', 0.20, 0, -0.24, 0.12);
    const ss = joint('skirtS' + n, hips, s * (D.hipX + 0.46 * b), 0.30, 0, 0, 0, s * 0.20);
    const sst = add(ss, tile([[-0.36, 0], [0.36, 0], [0.52, -0.28], [0.42, -0.90], [-0.42, -0.90], [-0.52, -0.28]], 0.08,
      [[-0.26, -0.10], [0.26, -0.10], [0.38, -0.30], [0.31, -0.78], [-0.31, -0.78], [-0.38, -0.30]], 0.15), 'armor', 0, 0, 0, 0, s * Math.PI / 2, 0);
    partOn(sst, tile(oct(0.44, 0.28, 0.05), 0.012, oct(0.36, 0.20, 0.03), 0.03), 'armor2', 0, -0.28, 0.15);
    boltsOn(sst, [[-0.27, -0.15], [0.27, -0.15], [-0.24, -0.71], [0.24, -0.71]], 0.15);
    markOn(sst, 'text', 0.28, 0, -0.60, 0.15);
    add(ss, cbox(0.12, 0.12, 0.60, 0.02), 'frame', s * 0.03, 0.0, 0);
  }
  const sb = joint('skirtB', hips, 0, 0.24, -0.60, 0.16, 0, 0);
  add(sb, tile([[-0.60 * b, 0], [0.60 * b, 0], [0.60 * b, -0.46], [0.44 * b, -0.74], [-0.44 * b, -0.74], [-0.60 * b, -0.46]], 0.07,
    [[-0.44 * b, -0.10], [0.44 * b, -0.10], [0.44 * b, -0.42], [0.32 * b, -0.62], [-0.32 * b, -0.62], [-0.44 * b, -0.42]], 0.14), 'armor', 0, 0, 0, 0, Math.PI, 0);
  for (const s of [1, -1]) add(sb, cylY(0.06, 0.10, 0.14, 8), 'metal', s * 0.40 * b, -0.76, -0.07);

  // ------------------------------------------------------------ waist
  const spine = joint('spine', hips, 0, 0.46, 0);
  add(spine, hexY(0.40 * b, 0.48 * b, 0.46, 10), 'frame', 0, 0.14, 0);
  add(spine, tile(oct(0.64 * b, 0.20, 0.05), 0.04, [[-0.22 * b, 0], [0.22 * b, 0]], 0.10), 'armor2', 0, 0.07, 0.40 * b, -0.10, 0, 0);
  add(spine, tile(oct(0.54 * b, 0.17, 0.05), 0.04, [[-0.18 * b, 0], [0.18 * b, 0]], 0.10), 'armor2', 0, 0.26, 0.38 * b, 0.10, 0, 0);
  for (const s of [1, -1]) { add(spine, cylY(0.05, 0.05, 0.50, 8), 'metal', s * 0.50 * b, 0.16, -0.08, 0, 0, s * 0.22); add(spine, cylY(0.07, 0.07, 0.22, 8), 'frame', s * 0.53 * b, 0.04, -0.08, 0, 0, s * 0.22); }

  // ------------------------------------------------------------ the core: small beside its shoulders, a prow of sloped plates
  const chest = joint('chest', spine, 0, 0.38, 0);
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
    add(chest, hexX(0.28, 0.44), 'metal', s * (D.shoulderX - 0.14), 0.70, 0);                                    // the shoulder mount
    add(chest, cbox(0.36, 0.50, 0.70, 0.06), 'frame', s * (0.90 * cw + 0.06), 0.68, 0);
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
  add(chest, hexY(0.17, 0.20, 0.18, 8), 'frame', 0, 1.08, 0.06);

  // ------------------------------------------------------------ head: small, low between the collar guards, a wedge with a slit
  const head = joint('head', chest, 0, 1.10, 0.08);
  const hs = hd * 0.84, H = (x, y, z) => [x * hs, y * hs, z * hs];
  add(head, hull([H(-0.24, 0.04, -0.36), H(0.24, 0.04, -0.36), H(-0.26, 0.04, 0.18), H(0.26, 0.04, 0.18),
    H(-0.30, 0.26, -0.42), H(0.30, 0.26, -0.42), H(-0.30, 0.27, 0.38), H(0.30, 0.27, 0.38), H(0, 0.27, 0.47),
    H(-0.20, 0.46, -0.34), H(0.20, 0.46, -0.34), H(-0.17, 0.44, 0.06), H(0.17, 0.44, 0.06)]), 'armor');
  add(head, cbox(0.50 * hs, 0.17 * hs, 0.20 * hs, 0.02), 'frame', 0, 0.155 * hs, 0.27 * hs);
  add(head, box(0.26 * hs, 0.04 * hs, 0.02), 'glow', -0.08 * hs, 0.165 * hs, 0.372 * hs);
  add(head, cylZ(0.045 * hs, 0.03, 10), 'glow', 0.15 * hs, 0.165 * hs, 0.372 * hs);
  add(head, hull([H(-0.15, -0.02, 0.14), H(0.15, -0.02, 0.14), H(-0.12, -0.02, 0.36), H(0.12, -0.02, 0.36), H(-0.18, 0.07, 0.16), H(0.18, 0.07, 0.16), H(-0.16, 0.07, 0.42), H(0.16, 0.07, 0.42)]), 'armor2');
  for (const s of [1, -1]) add(head, cbox(0.08 * hs, 0.22 * hs, 0.36 * hs, 0.02), 'frame', s * 0.32 * hs, 0.17 * hs, -0.06 * hs);
  add(head, cbox(0.10 * hs, 0.06 * hs, 0.46 * hs, 0.02), 'armor2', 0, 0.47 * hs, -0.14 * hs);
  add(head, cbox(0.24 * hs, 0.16 * hs, 0.14 * hs, 0.02), 'frame', 0, 0.24 * hs, -0.46 * hs);
  const ant = joint('ant', head, -0.37 * hs, 0.26 * hs, -0.10 * hs, -0.55, 0, 0);
  add(ant, hull([[-0.014, 0, -0.07], [0.014, 0, -0.07], [-0.014, 0, 0.07], [0.014, 0, 0.07], [-0.008, 0.70, -0.02], [0.008, 0.70, -0.02], [-0.008, 0.65, 0.035], [0.008, 0.65, 0.035]]), 'armor2');
  add(ant, hexX(0.05, 0.06, 6), 'metal', 0, 0, 0);

  // ------------------------------------------------------------ the pack: two main thrusters, a cannon on the right, a rocket pod over the left shoulder
  const pack = joint('pack', chest, 0, 0.52, -0.60);
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
  // a whip aerial
  const mast = joint('mast', pack, 0.20 * b, 0.56, -0.44, -0.14, 0, -0.04);
  add(mast, cylY(0.03, 0.035, 0.12, 8), 'frame', 0, 0.06, 0);
  add(mast, cylY(0.008, 0.016, 1.45, 6), 'metal', 0, 0.85, 0);

  // ------------------------------------------------------------ shoulders and arms
  for (const s of [1, -1]) {
    const n = s > 0 ? 'L' : 'R';
    // the shoulder block rides the shoulder joint's own place, so it can tip with the arm: a box open underneath —
    // a roof that slopes down outward, an outer wall, a front and a back
    const pad = joint('pad' + n, chest, s * D.shoulderX, 0.70, 0, 0, 0, s * -0.05);
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
    const arm = joint('arm' + n, chest, s * D.shoulderX, 0.70, 0, 0, 0, s * 0.06);
    add(arm, hexX(0.30, 0.46), 'metal', 0, 0, 0);
    add(arm, cbox(0.48 * b, 0.82, 0.54, 0.06), 'frame', s * 0.10, -0.52, 0);
    const ua = add(arm, tile(oct(0.64, 0.68, 0.13), 0.06, oct(0.46, 0.50, 0.08), 0.13), 'armor', s * (0.10 + 0.23 * b), -0.52, 0, 0, s * Math.PI / 2, 0);
    boltsOn(ua, [[-0.17, 0.19], [0.17, 0.19], [-0.17, -0.19], [0.17, -0.19]], 0.13);
    add(arm, tile(oct(0.46 * b, 0.60, 0.09), 0.04, oct(0.30 * b, 0.42, 0.05), 0.09), 'armor2', s * 0.10, -0.54, 0.26);
    add(arm, tile(oct(0.44 * b, 0.44, 0.08), 0.04, oct(0.26 * b, 0.26, 0.04), 0.08), 'armor2', s * 0.10, -0.46, -0.26, 0, Math.PI, 0);
    add(arm, cylY(0.05, 0.05, 0.44, 8), 'metal', s * 0.10, -0.80, -0.31, 0.30, 0, 0);
    const fa = joint('fore' + n, arm, s * 0.10, -0.98, 0);
    add(fa, hexX(0.27, 0.64 * b), 'metal', 0, 0, 0);
    const gaunt = add(fa, loft(ring(-0.06, 0.58 * b, 0.62, 0.10), ring(-0.50, 0.76 * b, 0.88, 0.13, s * 0.03, 0.02), ring(-1.04, 0.54 * b, 0.58, 0.09)), 'armor');
    add(fa, tile(oct(0.36 * b, 0.56, 0.06), 0.02, oct(0.22 * b, 0.40, 0.03), 0.05), 'armor2', s * (0.03 + 0.365 * b), -0.54, 0.02, 0, s * Math.PI / 2, 0);
    for (let i = 0; i < 3; i += 1) add(fa, box(0.36 * b, 0.03, 0.04), 'frame', 0, -0.30 - i * 0.08, -0.43 + i * 0.012);
    seam(gaunt, [0, -0.30, 3], [0, -0.30, 0], 0.40 * b); seam(gaunt, [0, -0.80, 3], [0, -0.80, 0], 0.36 * b);
    add(fa, hexY(0.22, 0.22, 0.12, 8), 'frame', 0, -1.07, 0);
    const hand = joint('hand' + n, fa, 0, -1.10, 0);
    add(hand, cbox(0.40, 0.34, 0.46, 0.06), 'frame', 0, -0.19, 0.02);
    add(hand, cbox(0.42, 0.16, 0.24, 0.03), 'armor2', 0, -0.11, -0.14);
    for (const fxx of [-0.13, 0, 0.13]) add(hand, cbox(0.11, 0.18, 0.15, 0.02), 'metal', fxx, -0.41, 0.16);
    add(hand, cbox(0.13, 0.15, 0.13, 0.02), 'metal', s * -0.22, -0.25, 0.17);
  }
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
  // the gun in the right hand, a heavy one: built along its own +Z, turned so that +Z is the hand's way down the forearm
  const rifle = joint('rifle', J.handR, 0, -0.20, 0.0, Math.PI / 2, 0, 0);
  add(rifle, cbox(0.14, 0.36, 0.17, 0.02), 'frame', 0, -0.02, 0, 0.2, 0, 0);
  add(rifle, cbox(0.26, 0.40, 1.50, 0.05), 'frame', 0, 0.38, 0.30);
  const shroud = add(rifle, loft(ringZ(1.02, 0.28, 0.34, 0.06, 0, 0.39), ringZ(2.30, 0.22, 0.26, 0.05, 0, 0.40)), 'armor');
  for (let i = 0; i < 5; i += 1) for (const s of [1, -1]) add(rifle, box(0.02, 0.08, 0.14), 'frame', s * (0.136 - i * 0.005), 0.43, 1.22 + i * 0.22);
  add(rifle, cylZ(0.07, 1.00, 12), 'metal', 0, 0.40, 2.70);
  add(rifle, cbox(0.20, 0.20, 0.36, 0.04), 'frame', 0, 0.40, 3.14);
  for (const s of [1, -1]) add(rifle, box(0.02, 0.08, 0.09), 'metal', s * 0.101, 0.40, 3.14);
  add(rifle, cylX(0.23, 0.22, 14), 'armor2', 0, 0.06, 0.74);                                                       // the drum
  add(rifle, cylX(0.10, 0.24, 8), 'frame', 0, 0.06, 0.74);
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

  // ------------------------------------------------------------ legs: thick slabs over a short thick frame, a great flared boot, clawed feet
  for (const s of [1, -1]) {
    const n = s > 0 ? 'L' : 'R';
    const th = joint('thigh' + n, hips, s * D.hipX, -D.hipDrop, 0);
    add(th, cbox(0.54 * b, L1 * 0.92, 0.60, 0.07), 'frame', 0, -L1 * 0.52, -0.02);
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
    for (const t of [1, -1]) add(th, cylY(0.05, 0.05, L1 * 0.50, 8), 'metal', t * 0.15 * b, -L1 * 0.70, -0.36, 0.16, 0, 0);
    add(th, cbox(0.42 * b, 0.32, 0.12, 0.03), 'armor2', 0, -L1 * 0.30, -0.35);

    const shn = joint('shin' + n, th, 0, -L1, 0);
    add(shn, hexX(0.30, 0.74 * b), 'metal', 0, 0, 0);
    for (const t of [1, -1]) add(shn, hexX(0.22, 0.06, 8), 'frame', t * 0.395 * b, 0, 0);                         // the knee's side caps
    add(shn, cbox(0.48 * b, L2 * 0.90, 0.52, 0.06), 'frame', 0, -L2 * 0.50, -0.02);
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
    const cn = joint('calf' + n, shn, 0, -L2 * 0.70, -0.72, 0.55, 0, 0);
    add(cn, cylY(0.12, 0.20, 0.30, 10), 'metal', 0, -0.11, 0);
    add(cn, cylY(0.155, 0.155, 0.02, 10), 'burn', 0, -0.255, 0);
    const cf = joint('flameC' + n, cn, 0, -0.27, 0);
    glowAdd(cf, plume(0.15, 0.9, 10), M.flame);
    cf.scale.set(1, 0.001, 1);

    const ft = joint('foot' + n, shn, 0, -L2, 0);
    const fw = 0.46 * b;
    add(ft, hexX(0.24, 0.66 * b), 'metal', 0, 0, 0);
    add(ft, cbox(1.00 * b, 0.12, 1.70, 0.04), 'frame', 0, -0.44, 0.10);
    add(ft, hull([[-fw, -0.38, -0.02], [fw, -0.38, -0.02], [-fw, -0.38, 0.86], [fw, -0.38, 0.86], [-fw * 0.92, -0.16, 0.86], [fw * 0.92, -0.16, 0.86],
      [-fw * 0.76, 0.12, 0.04], [fw * 0.76, 0.12, 0.04], [-fw * 0.84, 0.04, 0.46], [fw * 0.84, 0.04, 0.46]]), 'armor');
    for (const tx of [-0.31, 0, 0.31]) add(ft, hull([[(tx - 0.135) * b, -0.50, 0.78], [(tx + 0.135) * b, -0.50, 0.78], [(tx - 0.135) * b, -0.50, 1.24], [(tx + 0.135) * b, -0.50, 1.24],
      [(tx - 0.12) * b, -0.12, 0.80], [(tx + 0.12) * b, -0.12, 0.80], [(tx - 0.10) * b, -0.30, 1.24], [(tx + 0.10) * b, -0.30, 1.24]]), 'frame');           // three toes
    add(ft, hull([[-fw * 0.86, -0.38, -0.10], [fw * 0.86, -0.38, -0.10], [-fw * 0.74, -0.38, -0.60], [fw * 0.74, -0.38, -0.60], [-fw * 0.62, -0.20, -0.60], [fw * 0.62, -0.20, -0.60], [-fw * 0.74, 0.04, -0.18], [fw * 0.74, 0.04, -0.18]]), 'armor');
    for (const t of [1, -1]) add(ft, hull([[t * 0.12 * b, -0.50, -0.52], [t * 0.40 * b, -0.50, -0.52], [t * 0.14 * b, -0.50, -0.73], [t * 0.36 * b, -0.50, -0.73], [t * 0.14 * b, -0.22, -0.54], [t * 0.38 * b, -0.22, -0.54], [t * 0.16 * b, -0.34, -0.73], [t * 0.34 * b, -0.34, -0.73]]), 'frame');   // two heel spurs
    mark(ft, 'nostep', 0.26, 0, -0.058 + 0.004, 0.66, -Math.PI / 2 + Math.atan2(0.20, 0.40), 0, 0);
  }

  // ------------------------------------------------------------ finishing: shade every panel, pick out its edges, and make each joint's parts one piece
  root.updateMatrixWorld(true);
  const rnd = seeded(98), edges = [], wp = new THREE.Vector3(), wn = new THREE.Vector3(), nm = new THREE.Matrix3(); let parts = 0;
  const PAINTED = { armor: 1, armor2: 1, accent: 1, stripe: 1 };
  // every solid part as it stands at rest: its corners and face planes in the model's own space. Each part bulges outward everywhere,
  // so a point is inside one when it is behind every one of its planes; that is how crowding is found.
  const solids = [];
  root.traverse((m) => {
    if (!m.isMesh || m.userData.fx || m.userData.key === 'decal') return;
    if (m.geometry.index) m.geometry = m.geometry.toNonIndexed();
    m.geometry.deleteAttribute('uv'); m.updateMatrix();
    const pos = m.geometry.attributes.position, n = pos.count, w = new Float32Array(n * 3), box = new THREE.Box3();
    for (let i = 0; i < n; i += 1) { wp.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld); w[i * 3] = wp.x; w[i * 3 + 1] = wp.y; w[i * 3 + 2] = wp.z; box.expandByPoint(wp); }
    const planes = [];
    if (!m.userData.hollow) for (let i = 0; i + 2 < n; i += 3) {
      const ax = w[i * 3], ay = w[i * 3 + 1], az = w[i * 3 + 2], ux = w[i * 3 + 3] - ax, uy = w[i * 3 + 4] - ay, uz = w[i * 3 + 5] - az, vx = w[i * 3 + 6] - ax, vy = w[i * 3 + 7] - ay, vz = w[i * 3 + 8] - az;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const len = Math.hypot(nx, ny, nz); if (len < 1e-9) continue;
      nx /= len; ny /= len; nz /= len; planes.push(nx, ny, nz, nx * ax + ny * ay + nz * az);
    }
    solids.push({ m, w, box, planes });
  });
  const inside = (o, x, y, z) => {
    const b2 = o.box; if (x < b2.min.x || x > b2.max.x || y < b2.min.y || y > b2.max.y || z < b2.min.z || z > b2.max.z) return false;
    const pl = o.planes; if (!pl.length) return false;
    for (let i = 0; i < pl.length; i += 4) if (pl[i] * x + pl[i + 1] * y + pl[i + 2] * z - pl[i + 3] > 1e-4) return false;
    return true;
  };
  const REACH = [[0.09, 0.45], [0.24, 0.33], [0.46, 0.22]];
  for (const o of solids) {
    const m = o.m, key = m.userData.key, geo = m.geometry, pos = geo.attributes.position, nor = geo.attributes.normal, n = pos.count;
    const col = new Float32Array(n * 3), painted = PAINTED[key];
    const tint = painted ? 0.90 + 0.10 * rnd() : 0.94 + 0.06 * rnd();
    const span = Math.max(0.08, o.box.max.y - o.box.min.y); nm.getNormalMatrix(m.matrixWorld);
    const near = solids.filter((q) => q !== o && q.planes.length && q.box.min.x < o.box.max.x + 0.5 && q.box.max.x > o.box.min.x - 0.5 && q.box.min.y < o.box.max.y + 0.5 && q.box.max.y > o.box.min.y - 0.5 && q.box.min.z < o.box.max.z + 0.5 && q.box.max.z > o.box.min.z - 0.5);
    for (let i = 0; i < n; i += 1) {
      const x = o.w[i * 3], y = o.w[i * 3 + 1], z = o.w[i * 3 + 2];
      wn.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
      let shade = 0;
      for (const [d, wgt] of REACH) { const qx = x + wn.x * d, qy = y + wn.y * d, qz = z + wn.z * d; for (const q of near) if (inside(q, qx, qy, qz)) { shade += wgt; break; } }
      let f = tint * (painted ? 0.84 + 0.16 * Math.min(1, (y - o.box.min.y) / span) : 1) * (1 - 0.58 * shade);
      if (y < 1.0) f *= 0.84 + 0.16 * Math.max(0, y);                                          // a little grime near the ground
      col[i * 3] = f; col[i * 3 + 1] = f * 0.985; col[i * 3 + 2] = f * 0.96;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  for (const name in J) {
    const g = J[name], byKey = {}, lines = [];
    for (const m of [...g.children]) {
      if (!m.isMesh || m.userData.fx) continue;
      const key = m.userData.key; m.updateMatrix();
      const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
      if (key !== 'decal') { parts += 1; if (PAINTED[key]) { const e = new THREE.EdgesGeometry(geo, 18); e.applyMatrix4(m.matrix); lines.push(e); } }
      geo.applyMatrix4(m.matrix);
      (byKey[key] = byKey[key] || []).push(geo); g.remove(m);
    }
    for (const key in byKey) {
      const merged = byKey[key].length > 1 ? mergeGeometries(byKey[key]) : byKey[key][0];
      const mesh = new THREE.Mesh(merged, M[key]); mesh.name = name + '_' + key; mesh.userData.key = key;
      mesh.castShadow = key !== 'decal' && key !== 'glow'; mesh.receiveShadow = key !== 'glow'; g.add(mesh);
    }
    if (lines.length) {
      const arr = []; for (const e of lines) arr.push(...e.attributes.position.array);
      const lg2 = new THREE.BufferGeometry(); lg2.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      const ls = new THREE.LineSegments(lg2, M.edge); ls.name = name + '_edges'; ls.userData.edge = true; g.add(ls); edges.push(ls);
    }
  }

  return { root, joints: J, dims: D, mats: M, edges, fx, parts, build: P, palette };
}

export function setPalette(mech, palette) {
  const M = mech.mats;
  for (const k of ['armor', 'armor2', 'frame', 'metal', 'accent']) M[k].color.setHex(palette[k]);
  M.stripe.color.setHex(palette.mark);
  M.glow.emissive.setHex(palette.glow); M.edge.color.setHex(palette.edge);
  const old = M.decal.map; M.decal.map = stencilSheet(palette); M.decal.needsUpdate = true; if (old) old.dispose();
  mech.palette = palette;
}
