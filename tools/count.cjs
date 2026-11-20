const { chromium } = require('playwright'); const path = require('node:path');
(async () => { const b = await chromium.launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const p = await b.newPage({ viewport: { width: 900, height: 700 } });
  await p.goto('file://' + path.resolve('dist/index.html'), { waitUntil: 'load' }); await p.waitForFunction(() => window.__mb && window.__mb.motions, null, { timeout: 60000 }); await p.waitForTimeout(500);
  console.log(await p.evaluate(() => document.querySelector('#stat').textContent), '|', await p.evaluate(() => JSON.stringify(window.__mb.info().max)));
  await b.close(); })();
