// shot.cjs <out dir> <json list of [label, motion, time, az, el, dist]> [width] [height] [query] — still pictures of the stage alone
const { chromium } = require('playwright'); const path = require('node:path');
const [outDir, listJson, W = '520', H = '640', extra = ''] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: Number(W), height: Number(H) }, deviceScaleFactor: Number(process.env.DSF || 1) });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve('dist/index.html') + '?ui=0' + extra, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__mb && window.__mb.motions, null, { timeout: 60000 });
  await p.waitForTimeout(600);
  console.log(JSON.stringify(await p.evaluate(() => window.__mb.info())));
  for (const [label, motion, t, az, el, dist] of JSON.parse(listJson)) {
    await p.evaluate(([m, tt, a, e, d]) => { window.__mb.setCam(a, e, d); window.__mb.seek(m, tt); }, [motion, t, az, el, dist]);
    await p.waitForTimeout(220);
    await p.screenshot({ path: path.join(outDir, label + '.png'), timeout: 240000 });
  }
  if (errs.length) console.log('ERRORS', errs.slice(0, 6));
  await b.close();
})();
