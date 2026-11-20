// extremes.cjs <out dir> — the mech at the ends of its build sliders, to see that nothing breaks
const { chromium } = require('playwright'); const path = require('node:path');
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 520, height: 640 } });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve('dist/index.html') + '?ui=0&m=Idle', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__mb && window.__mb.motions, null, { timeout: 60000 });
  const sets = { lo: { bulk: 0.85, shoulders: 0.80, legs: 0.85, head: 0.80 }, hi: { bulk: 1.25, shoulders: 1.30, legs: 1.20, head: 1.30 }, mix1: { bulk: 1.25, shoulders: 0.80, legs: 1.20, head: 0.80 }, mix2: { bulk: 0.85, shoulders: 1.30, legs: 0.85, head: 1.30 } };
  for (const [k, v] of Object.entries(sets)) {
    const ms = await p.evaluate((bb) => { const t0 = performance.now(); window.__mb.build(bb); window.__mb.seek('Idle', 0.4); return performance.now() - t0; }, v);
    await p.waitForTimeout(300); await p.screenshot({ path: path.join(process.argv[2], 'x_' + k + '.png'), timeout: 240000 });
    console.log(k, Math.round(ms) + ' ms', JSON.stringify(await p.evaluate(() => window.__mb.info().max.map((n) => Number(n.toFixed(2))))));
  }
  console.log('errors', errs.length, errs.slice(0, 4)); await b.close();
})();
