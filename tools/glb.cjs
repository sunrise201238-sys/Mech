// glb.cjs <out.glb> — the model and its clips written as one glTF binary, by the board's own exporter. Run from the repository's root.
const { chromium } = require('playwright'); const path = require('node:path'); const fs = require('node:fs');
const [out] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 400, height: 400 } });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  await p.goto('file://' + path.resolve('dist/index.html') + '?ui=0', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__mb && window.__mb.motions, null, { timeout: 60000 });
  const b64 = await p.evaluate(() => window.__mb.glb());
  fs.writeFileSync(out, Buffer.from(b64, 'base64'));
  console.log('wrote', out, fs.statSync(out).size, 'bytes', errs.slice(0, 6));
  await b.close();
})();
