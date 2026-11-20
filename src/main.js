// main.js — the Mech Board: the mech on a concrete apron under an overcast sky, its motions on buttons, its build on sliders.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildMech, setPalette, PALETTES, BUILD_DEFAULT } from './mech.js';
import { bakeAll, MOTIONS, walkSpeed } from './anim.js';

const $ = (s) => document.querySelector(s);
document.documentElement.lang = 'zh-Hant';
const q = new URLSearchParams(location.search);
const LABEL = { Idle: '待機', Walk: '走路', Sprint: '衝刺', Shoot: '開槍', Cannon: '主砲', Dodge: '閃避', Jump: '跳躍', Win: '勝利' };
const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { motion: q.get('m') || 'Idle', speed: 1, palette: q.get('p') || 'olive', build: { ...BUILD_DEFAULT }, edges: false, fx: true, spin: false, paused: false, tour: !calm && !q.get('m') };
let tourAt = 0;

// ------------------------------------------------------------ the stage
const canvas = $('#view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
// an overcast sky: pale above, haze at the horizon, and the haze is what the far ground fades into
const HAZE = 0xC9CDCB;
{ const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#93A0AA'); gr.addColorStop(0.46, '#BCC4C7'); gr.addColorStop(0.62, '#CDD0CC'); gr.addColorStop(1, '#C9CDCB'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t; }
scene.fog = new THREE.Fog(HAZE, 36, 82);
{ const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.42; pm.dispose(); }
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
const controls = new OrbitControls(camera, canvas);
controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = 8; controls.maxDistance = 40;
controls.maxPolarAngle = Math.PI * 0.52; controls.autoRotateSpeed = 1.6;
// A tall motion (the jump, the raised rifle) gets a wider, higher view: camLift raises the camera with its target, camera.zoom widens it.
// Both sit beside the orbit controls, so they never fight the viewer's own turning and zooming.
const REST_Y = 3.15, REST_DIST = 18.5, REST_HALF = REST_DIST * Math.tan(15 * Math.PI / 180);
let camLift = 0; const framing = {};
const setCam = (az = -32, el = 9, dist = REST_DIST, ty = REST_Y) => {
  const a = az * Math.PI / 180, e = el * Math.PI / 180;
  controls.target.set(0, ty + camLift, 0);
  camera.position.set(dist * Math.sin(a) * Math.cos(e), ty + camLift + dist * Math.sin(e), dist * Math.cos(a) * Math.cos(e));
  camera.lookAt(controls.target); controls.update();
};
function easeFrame(fr, k) {
  if (!fr) return;
  const l = camLift + (fr.lift - camLift) * k, d = l - camLift; camLift = l;
  controls.target.y += d; camera.position.y += d;
  const z = camera.zoom + (fr.zoom - camera.zoom) * k;
  if (Math.abs(z - camera.zoom) > 1e-5) { camera.zoom = z; camera.updateProjectionMatrix(); }
}
const jumpY = (u) => 2.5 * Math.sin(Math.PI * Math.min(1, Math.max(0, (u - 0.22) / 0.52)));
setCam(Number(q.get('az') ?? -32), Number(q.get('el') ?? 9), Number(q.get('d') ?? REST_DIST));

scene.add(new THREE.HemisphereLight(0xE4ECF2, 0x8D877B, 0.50));
const sun = new THREE.DirectionalLight(0xFFF3E0, 2.5);
sun.position.set(7, 13, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 11, bottom: -5, near: 1, far: 40 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025; sun.shadow.intensity = 0.8;
scene.add(sun);
const rim = new THREE.DirectionalLight(0xBFD4E6, 1.3); rim.position.set(-8, 7, -10); scene.add(rim);

// the apron: concrete slabs four units square, a dashed line painted down it, the dirt of use. One tile of the picture is eight units.
const TILE = 8;
function matTexture() {
  const N = 1024, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  g.fillStyle = '#6E7274'; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 4; i += 1) { g.fillStyle = `rgba(${i % 2 ? 128 : 96}, ${i % 2 ? 131 : 99}, ${i % 2 ? 133 : 101}, 0.22)`; g.fillRect((i % 2) * 512, Math.floor(i / 2) * 512, 512, 512); }     // slabs differ a little
  for (let i = 0; i < 26; i += 1) { const x = rnd() * N, y = rnd() * N, r = 30 + rnd() * 90, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(60, 60, 58, 0.16)'); gr.addColorStop(1, 'rgba(60, 60, 58, 0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  for (let i = 0; i < 9000; i += 1) { const v = rnd(); g.fillStyle = v > 0.5 ? 'rgba(225, 226, 224, 0.10)' : 'rgba(40, 42, 44, 0.12)'; g.fillRect(rnd() * N, rnd() * N, 1 + rnd() * 2, 1 + rnd() * 2); }
  g.strokeStyle = 'rgba(52, 54, 56, 0.85)'; g.lineWidth = 5;
  for (const k of [0, 512, 1024]) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, N); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(N, k); g.stroke(); }
  g.strokeStyle = 'rgba(214, 216, 214, 0.20)'; g.lineWidth = 2;
  for (const k of [4, 516]) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, N); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(N, k); g.stroke(); }
  g.fillStyle = 'rgba(214, 178, 62, 0.72)'; for (const y of [40, 296, 552, 808]) g.fillRect(760, y, 16, 176);                                         // the painted line, worn
  g.fillStyle = 'rgba(110, 114, 116, 0.5)'; for (let i = 0; i < 260; i += 1) g.fillRect(756 + rnd() * 24, rnd() * N, 2 + rnd() * 5, 2 + rnd() * 9);
  g.strokeStyle = 'rgba(40, 42, 44, 0.5)'; g.lineWidth = 1.5;
  for (let i = 0; i < 5; i += 1) { let x = rnd() * N, y = rnd() * N; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 9; k += 1) { x += (rnd() - 0.5) * 60; y += (rnd() - 0.3) * 50; g.lineTo(x, y); } g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
const matTex = matTexture(); matTex.repeat.set(160 / TILE, 160 / TILE);
const mat = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.94, metalness: 0 }));
mat.rotation.x = -Math.PI / 2; mat.receiveShadow = true; scene.add(mat);

// ------------------------------------------------------------ the mech and its clips
let mech = null, mixer = null, actions = {}, current = null, clips = [], replay = 0;
const holder = new THREE.Group(); scene.add(holder);
function rebuild() {
  const keep = current ? current.time : 0;
  if (mech) { holder.remove(mech.root); mech.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); if (mech.mats.decal.map) mech.mats.decal.map.dispose(); }
  mech = buildMech(state.build, PALETTES[state.palette]);
  mech.root.traverse((o) => { if (o.isMesh && o.userData.fx) o.castShadow = false; });
  holder.add(mech.root);
  const baked = bakeAll(mech); clips = baked.clips;
  mixer = new THREE.AnimationMixer(mech.root); actions = {};
  for (const c of clips) {
    const a = mixer.clipAction(c); const once = !MOTIONS[c.name].loop;
    a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = once; actions[c.name] = a;
  }
  mixer.addEventListener('finished', (e) => { if (e.action !== current) return; if (state.tour) tourAt = performance.now() + 550; else replay = performance.now() + 650; });
  measure();
  current = null; play(state.motion, 0); if (current) current.time = Math.min(keep, current.getClip().duration);
  applyToggles(); stats();
}
// how high each motion reaches, and from that the view it needs
const solidBox = new THREE.Box3(), partBox = new THREE.Box3();
function solidTop() {
  solidBox.makeEmpty(); mech.root.updateMatrixWorld(true);
  mech.root.traverse((o) => { if (o.isMesh && !o.userData.fx) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); solidBox.union(partBox.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });
  return solidBox.max.y;
}
function measure() {
  for (const c of clips) {
    const a = actions[c.name]; a.reset(); a.play(); let top = 0;
    for (let i = 0; i <= 12; i += 1) { a.time = c.duration * i / 12; mixer.update(0); top = Math.max(top, solidTop() + (c.name === 'Jump' ? jumpY(i / 12) : 0)); }
    a.stop();
    const needTop = top + 0.45, needBottom = -1.0, span = needTop - needBottom, zoom = Math.min(1, 2 * REST_HALF / span);
    framing[c.name] = { zoom, lift: zoom < 1 ? (needTop + needBottom) / 2 - REST_Y : Math.max(0, needTop - (REST_Y + REST_HALF)) };
  }
  mixer.update(0);
}
function play(name, fade = 0.16) {
  if (!actions[name]) return;
  const next = actions[name]; replay = 0;
  next.reset(); next.enabled = true; next.setEffectiveWeight(1); next.play();
  if (current && current !== next && fade > 0) current.crossFadeTo(next, fade, false); else if (current && current !== next) current.stop();
  current = next; state.motion = name;
  tourAt = state.tour && MOTIONS[name].loop ? performance.now() + Math.max(3400, 2 * MOTIONS[name].dur * 1000) / state.speed : 0;
  for (const b of document.querySelectorAll('[data-motion]')) b.classList.toggle('on', b.dataset.motion === name);
  const lab = $('#now'); if (lab) lab.textContent = LABEL[name] + '　' + name;
}
function applyToggles() {
  for (const h of mech.edges) h.visible = state.edges;
  for (const f of mech.fx) f.visible = state.fx;
  controls.autoRotate = state.spin;
}
function stats() {
  let parts = 0, tris = 0;
  mech.root.traverse((o) => { if (o.isMesh) { parts += 1; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
  const box = new THREE.Box3(), one = new THREE.Box3(); mech.root.updateMatrixWorld(true);
  mech.root.traverse((o) => { if (o.isMesh && !o.userData.fx) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.union(one.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });
  const hgt = box.max.y - Math.max(0, box.min.y);
  const b = state.build;
  $('#stat').innerHTML = [`裝甲與零件 ${mech.parts} 塊`, `關節 ${Object.keys(mech.joints).length} 個`, `三角形 ${Math.round(tris).toLocaleString()} 個`, `動作 ${clips.length} 個`, `全高 ${hgt.toFixed(2)}`].map((t) => `<span>${t}</span>`).join(' ');
  $('#nums').value = `bulk ${b.bulk.toFixed(2)}  shoulders ${b.shoulders.toFixed(2)}  legs ${b.legs.toFixed(2)}  head ${b.head.toFixed(2)}  palette ${state.palette}`;
}

// ------------------------------------------------------------ the frame
const clock = new THREE.Clock(); let scrollZ = 0, scrollX = 0;
const smooth = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
function frame() {
  const raw = Math.min(clock.getDelta(), 0.05), dt = raw * (state.paused ? 0 : state.speed);
  if (mixer) mixer.update(dt);
  easeFrame(framing[state.motion], 1 - Math.exp(-5 * raw));
  if (replay && performance.now() > replay && current) { replay = 0; current.reset().play(); }
  if (state.tour && tourAt && performance.now() > tourAt && !state.paused) { const names = Object.keys(MOTIONS); play(names[(names.indexOf(state.motion) + 1) % names.length]); }
  if (mech && current) {
    const D = mech.dims, def = MOTIONS[state.motion], u = current.time / def.dur;
    let vz = 0, y = 0, x = 0;
    if (state.motion === 'Walk') vz = walkSpeed(D);                                         // the ground goes by as fast as a planted foot slides
    if (state.motion === 'Sprint') vz = 19;
    if (state.motion === 'Jump') y = jumpY(u);
    if (state.motion === 'Dodge') x = 3.0 * smooth((u - 0.08) / 0.62);
    scrollZ += vz * dt; mech.root.position.y = y;
    scrollX = state.motion === 'Dodge' ? x : scrollX * Math.max(0, 1 - 8 * dt);
    matTex.offset.set(0.156 + scrollX / TILE, (scrollZ / TILE) % 1);
    // the flames flicker a little whatever the motion says
    const fl = 1 + 0.07 * Math.sin(performance.now() * 0.06) + 0.05 * Math.sin(performance.now() * 0.143);
    mech.mats.flame.opacity = 0.62 * fl;
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
function resize() {
  const r = canvas.parentElement.getBoundingClientRect(), w = Math.max(200, Math.floor(r.width)), h = Math.max(200, Math.floor(r.height));
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.8 ? 34 : 30; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas.parentElement);

// ------------------------------------------------------------ the controls
function ui() {
  const mo = $('#motions');
  for (const name of Object.keys(MOTIONS)) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pill'; b.dataset.motion = name;
    b.innerHTML = `<b>${LABEL[name]}</b><i>${name}</i>`; b.addEventListener('click', () => { state.tour = false; play(name); marks(); }); mo.append(b);
  }
  const pa = $('#palettes');
  for (const [key, p] of Object.entries(PALETTES)) {
    const hex = (n) => '#' + n.toString(16).padStart(6, '0');
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sw'; b.dataset.palette = key; b.title = p.label;
    b.innerHTML = `<span style="background:${hex(p.armor)}"></span><span style="background:${hex(p.armor2)}"></span><span style="background:${hex(p.accent)}"></span><em>${p.label}</em>`;
    b.addEventListener('click', () => { state.palette = key; setPalette(mech, PALETTES[key]); marks(); stats(); }); pa.append(b);
  }
  const sl = $('#sliders');
  const rows = [['bulk', '粗壯', 0.85, 1.25], ['shoulders', '肩寬', 0.80, 1.30], ['legs', '腿長', 0.85, 1.20], ['head', '頭', 0.80, 1.30]];
  for (const [key, zh, lo, hi] of rows) {
    const row = document.createElement('label'); row.className = 'row';
    row.innerHTML = `<span>${zh}</span><input type="range" min="${lo}" max="${hi}" step="0.01" value="${state.build[key]}" data-build="${key}"><output>${state.build[key].toFixed(2)}</output>`;
    const inp = row.querySelector('input'), out = row.querySelector('output');
    inp.addEventListener('input', () => { state.build[key] = Number(inp.value); out.textContent = Number(inp.value).toFixed(2); rebuild(); });
    sl.append(row);
  }
  const sp = $('#speed'), spo = $('#speedOut');
  sp.addEventListener('input', () => { state.speed = Number(sp.value); spo.textContent = state.speed.toFixed(2); });
  for (const key of ['edges', 'fx', 'spin', 'tour']) {
    const b = $(`[data-toggle="${key}"]`);
    b.addEventListener('click', () => { state[key] = !state[key]; applyToggles(); marks(); if (key === 'tour' && state.tour) play(state.motion, 0); });
  }
  $('#reset').addEventListener('click', () => {
    state.build = { ...BUILD_DEFAULT };
    for (const inp of document.querySelectorAll('[data-build]')) { inp.value = state.build[inp.dataset.build]; inp.nextElementSibling.textContent = Number(inp.value).toFixed(2); }
    rebuild();
  });
  $('#copy').addEventListener('click', async () => {
    const t = $('#nums'); t.select();
    try { await navigator.clipboard.writeText(t.value); $('#copy').textContent = '已複製'; } catch { try { document.execCommand('copy'); $('#copy').textContent = '已複製'; } catch { $('#copy').textContent = '請手動複製'; } }
    setTimeout(() => { $('#copy').textContent = '複製'; }, 1400);
  });
  $('#pause').addEventListener('click', () => { state.paused = !state.paused; marks(); });
}
function marks() {
  for (const b of document.querySelectorAll('[data-palette]')) b.classList.toggle('on', b.dataset.palette === state.palette);
  for (const key of ['edges', 'fx', 'spin', 'tour']) $(`[data-toggle="${key}"]`).classList.toggle('on', state[key]);
  $('#pause').classList.toggle('on', state.paused); $('#pause').textContent = state.paused ? '繼續' : '暫停';
}

ui(); resize(); rebuild(); marks();
if (q.get('ui') === '0') document.body.classList.add('bare');
requestAnimationFrame(frame);

// ------------------------------------------------------------ hooks for checking and for writing the model file
window.__mb = {
  state, motions: Object.keys(MOTIONS),
  play, setCam,
  seek(name, t) { play(name, 0); state.paused = true; current.time = t; current.paused = false; mixer.update(0); easeFrame(framing[name], 1); marks(); },
  framing,
  at(name) { mech.root.updateMatrixWorld(true); return mech.joints[name].getWorldPosition(new THREE.Vector3()).toArray(); },
  build(b) { Object.assign(state.build, b); rebuild(); },
  palette(k) { state.palette = k; setPalette(mech, PALETTES[k]); marks(); },
  info() { const box = new THREE.Box3().setFromObject(mech.root); return { min: box.min.toArray(), max: box.max.toArray(), clips: clips.map((c) => [c.name, c.duration, c.tracks.length]) }; },
  async glb() {
    const was = { edges: state.edges, y: mech.root.position.y }; state.edges = false; applyToggles(); mech.root.position.y = 0;
    if (current) current.stop(); mixer.stopAllAction(); mixer.update(0);
    for (const k in mech.joints) { /* the rest pose is what the file holds */ }
    const rig = bakeAll(mech).rig; rig.reset(); MOTIONS.Idle.pose(rig, 0);                  // the file rests in the standing pose, not with its legs straight
    const buf = await new Promise((res, rej) => new GLTFExporter().parse(mech.root, res, rej, { binary: true, animations: clips, onlyVisible: true }));
    state.edges = was.edges; applyToggles(); play(state.motion, 0);
    let s = ''; const u8 = new Uint8Array(buf); for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  },
};
