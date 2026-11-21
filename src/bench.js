// bench.js — what every frame, armour line and weapon is made with: the paints, the plain faceted shapes, the stencil sheet,
// the helpers that hang a part on a joint or lay it on another part's face, and the finishing pass that shades every panel
// and makes each joint's parts one piece. mech.js puts a mech together on one bench.
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const PALETTES = {
  olive: { label: '橄欖', armor: 0x4D5834, armor2: 0x363D25, frame: 0x2A2D2E, metal: 0x70767A, accent: 0xC9541F, mark: 0xDDD9C6, glow: 0xFF7A1F, edge: 0xAEB98C },
  slate: { label: '藍灰', armor: 0x66838C, armor2: 0x455A63, frame: 0x22262A, metal: 0x6C747A, accent: 0xC2A93A, mark: 0xE9E9E2, glow: 0x86FF74, edge: 0xBFD3D8 },
  desert: { label: '沙漠', armor: 0xB79E72, armor2: 0x8E7754, frame: 0x302D2A, metal: 0x79756D, accent: 0x7C2D1E, mark: 0x2E2A24, glow: 0x6FE3FF, edge: 0xE9DCBC },
  night: { label: '夜間', armor: 0x353A40, armor2: 0x24282C, frame: 0x16181A, metal: 0x4E5459, accent: 0xA6342A, mark: 0x9AA0A4, glow: 0xFF2E2E, edge: 0x7C858C },
};
// every build slider reads 1 at a frame's own chosen look: a build is given as multiples of it
export const BUILD_DEFAULT = { bulk: 1, shoulders: 1, legs: 1, head: 1 };

// ------------------------------------------------------------ shapes
export const V3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
// the solid that wraps a set of corners: flat faces, sloped wherever the corners say
export const hull = (pts) => new ConvexGeometry(pts.map(V3));
// the corners of a rectangle lying flat at height y: w wide (x), d deep (z), centred on (cx, cz); c cuts its four corners
export const ring = (y, w, d, c = 0, cx = 0, cz = 0) => {
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  if (!c) return [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]];
  return [[x0 + c, y, z0], [x1 - c, y, z0], [x1, y, z0 + c], [x1, y, z1 - c], [x1 - c, y, z1], [x0 + c, y, z1], [x0, y, z1 - c], [x0, y, z0 + c]];
};
// the same standing upright at depth z: w wide (x), h tall (y)
export const ringZ = (z, w, h, c = 0, cx = 0, cy = 0) => ring(0, w, h, c, cx, cy).map(([x, , y]) => [x, y, z]);
export const loft = (...rings) => hull(rings.flat());
// a box with every edge cut
export function cbox(w, h, d, c = 0.03) {
  c = Math.min(c, w / 2.2, h / 2.2, d / 2.2);
  const a = w / 2, b = h / 2, e = d / 2, p = [];
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) p.push([sx * (a - c), sy * b, sz * (e - c)], [sx * a, sy * (b - c), sz * (e - c)], [sx * (a - c), sy * (b - c), sz * e]);
  return hull(p);
}
// an armour tile facing +Z: an outline (u, v) t thick, and a smaller outline (or a ridge line) raised to tb, so its rim slopes
export const tile = (outline, t, boss, tb) => hull([...outline.map(([u, v]) => [u, v, 0]), ...outline.map(([u, v]) => [u, v, t]), ...(boss || []).map(([u, v]) => [u, v, tb])]);
// a rectangle outline with its corners cut
export const oct = (w, h, c, cx = 0, cy = 0) => [[cx - w / 2 + c, cy + h / 2], [cx + w / 2 - c, cy + h / 2], [cx + w / 2, cy + h / 2 - c], [cx + w / 2, cy - h / 2 + c], [cx + w / 2 - c, cy - h / 2], [cx - w / 2 + c, cy - h / 2], [cx - w / 2, cy - h / 2 + c], [cx - w / 2, cy + h / 2 - c]];
export const flat = (g) => { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; };
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const cylY = (rt, rb, h, seg = 14) => new THREE.CylinderGeometry(rt, rb, h, seg);
export const cylX = (r, len, seg = 14) => { const g = new THREE.CylinderGeometry(r, r, len, seg); g.rotateZ(Math.PI / 2); return g; };
export const cylZ = (r, len, seg = 14) => { const g = new THREE.CylinderGeometry(r, r, len, seg); g.rotateX(Math.PI / 2); return g; };
export const hexX = (r, len, seg = 8) => flat(cylX(r, len, seg));
export const hexY = (rt, rb, h, seg = 8) => flat(cylY(rt, rb, h, seg));
export const hexZ = (r, len, seg = 8) => flat(cylZ(r, len, seg));
// a plume: a cone hanging from its mouth, bright there and gone by its tip
export const plume = (r, len, seg = 14) => {
  const g = new THREE.ConeGeometry(r, len, seg, 6, true); g.rotateX(Math.PI); g.translate(0, -len / 2, 0);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i += 1) { const k = Math.min(1, Math.max(0, -pos.getY(i) / len)); col.set([1, 1, 1, (1 - k) * (1 - k)], i * 4); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 4)); return g;
};
// a muzzle blast: a cone that opens from its point along +Z, bright at the point and gone by its mouth
export const blast = (len, r, seg = 12) => {
  const g = new THREE.ConeGeometry(r, len, seg, 5, true); g.rotateX(-Math.PI / 2); g.translate(0, 0, len / 2);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i += 1) { const k = Math.min(1, Math.max(0, pos.getZ(i) / len)); col.set([1, 1, 1, Math.pow(1 - k, 1.4)], i * 4); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 4)); return g;
};
export const white = (g) => { const n = g.attributes.position.count, col = new Float32Array(n * 4).fill(1); g.setAttribute('color', new THREE.BufferAttribute(col, 4)); return g; };

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

// A bench: the paints for one palette, an empty root, and the helpers bound to them. A part is rigid and rides its joint.
export function bench(palette) {
  const paint = (color, roughness, metalness) => new THREE.MeshStandardMaterial({ color, roughness, metalness, vertexColors: true });
  const light = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, vertexColors: true, toneMapped: false, fog: false });
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

  const root = new THREE.Group(); root.name = 'mech';          // the frame stands it at its own scale
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

  // who made each joint and part: the frame 'F', the armour 'A', a weapon 'W'. mech.js fills it in as each layer is built.
  const made = new Map();
  return { root, J, M, fx, made, joint, add, glowAdd, mark, markOn, partOn, boltsOn, face, lay, seam, layMark };
}

// The finishing pass. A model may carry a record of the order its joints and parts were first made in: the pass tints the
// panels in the order it meets them and the model file is written in that order too, so a mech whose layers are built one
// after another is first put back into its recorded order, and comes out exactly as it did when it was one piece of code.
// A part marked hollow takes shade from its neighbours and gives none: the lifting eyes, which are rings, and the plain
// blocks that join a frame's pieces, which must leave the look of everything round them alone.
export function finish(B, record = {}) {
  const { root, M, made } = B; let J = B.J;
  const late = new Set();                                    // what was added since the record was taken
  if (record.order) for (const name in J) {
    const pattern = record.order[name] || '';
    const g = J[name], queue = {}, out = [];
    for (const c of g.children) (queue[made.get(c)] = queue[made.get(c)] || []).push(c);
    for (const tag of pattern) { const c = queue[tag] && queue[tag].shift(); if (c) out.push(c); }
    for (const tag in queue) for (const c of queue[tag]) { out.push(c); late.add(c); }
    g.children = out;
  }
  if (record.joints) { const K = {}; for (const n of record.joints) if (J[n]) K[n] = J[n]; for (const n in J) if (!K[n]) K[n] = J[n]; J = B.J = K; }

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
  // the recorded parts take their tints first, in their order, so a part added since never shifts the tint of an older one
  for (const o of [...solids.filter((q) => !late.has(q.m)), ...solids.filter((q) => late.has(q.m))]) {
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

  return { joints: J, edges, parts };
}

export function setPalette(mech, palette) {
  const M = mech.mats;
  for (const k of ['armor', 'armor2', 'frame', 'metal', 'accent']) M[k].color.setHex(palette[k]);
  M.stripe.color.setHex(palette.mark);
  M.glow.emissive.setHex(palette.glow); M.edge.color.setHex(palette.edge);
  const old = M.decal.map; M.decal.map = stencilSheet(palette); M.decal.needsUpdate = true; if (old) old.dispose();
  mech.palette = palette;
}
