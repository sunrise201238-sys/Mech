// poster.cjs — eight stills of the motions and the poster made of them: shots/poster/*.png, then model/heavy_mech_03_poster.png.
// Run it from the repository's root, after `npm run build`.
const { chromium } = require('playwright'); const path = require('node:path'); const fs = require('node:fs');
const STILLS = [['1_Idle', 'Idle', 0.4, -30, 9, 19], ['2_Walk', 'Walk', 0.3, 32, 8, 19.5], ['3_Sprint', 'Sprint', 0.3, -60, 8, 21.5], ['4_Shoot', 'Shoot', 0.0, -52, 7, 23],
  ['5_Cannon', 'Cannon', 1.435, -76, 6, 23], ['6_Dodge', 'Dodge', 0.27, 20, 9, 20], ['7_Jump', 'Jump', 0.72, -30, 7, 20], ['8_Win', 'Win', 2.3, -28, 8, 20]];   // name, motion, time, turn, tilt, distance
(async () => {
  fs.mkdirSync('shots/poster', { recursive: true });
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 400, height: 480 }, deviceScaleFactor: 2 });
  await p.goto('file://' + path.resolve('dist/index.html') + '?ui=0', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__mb && window.__mb.motions, null, { timeout: 60000 }); await p.waitForTimeout(600);
  for (const [label, motion, t, az, el, dist] of STILLS) {
    await p.evaluate(([m, tt, a, e, d]) => { window.__mb.setCam(a, e, d); window.__mb.seek(m, tt); }, [motion, t, az, el, dist]);
    await p.waitForTimeout(220); await p.screenshot({ path: path.join('shots/poster', label + '.png'), timeout: 240000 });
  }
  const q = await b.newPage({ viewport: { width: 1320, height: 900 }, deviceScaleFactor: 2 });
  await q.goto('file://' + path.resolve('tools/poster.html'), { waitUntil: 'load' }); await q.evaluate(() => document.fonts.ready); await q.waitForTimeout(1200);
  await q.screenshot({ path: 'model/heavy_mech_03_poster.png', fullPage: true, timeout: 240000 });
  console.log('wrote model/heavy_mech_03_poster.png'); await b.close();
})();
