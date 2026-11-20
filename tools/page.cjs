// page.cjs <out png> <width> <height> [query] [fullPage] — the whole page as a visitor sees it
const { chromium } = require('playwright'); const path = require('node:path');
const [out, W, H, query = '', full = '0'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: Number(W), height: Number(H) }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve('dist/index.html') + query, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__mb && window.__mb.motions, null, { timeout: 60000 });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
  await p.screenshot({ path: out, fullPage: full === '1', timeout: 240000 });
  console.log('scroll width', await p.evaluate(() => document.documentElement.scrollWidth), 'errors', errs.slice(0, 5));
  await b.close();
})();
