// build.mjs — dist/mech-board.js is the board's script; dist/index.html is the board as a page of its own, the one a browser opens
// from a file and the one GitHub Pages serves; dist/page.html is the same page as bare content, for a host that wraps it itself
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
mkdirSync('dist', { recursive: true });
await build({ entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: true, outfile: 'dist/mech-board.js', target: 'es2020', legalComments: 'none' });
const page = readFileSync('src/page.html', 'utf8');
writeFileSync('dist/page.html', page);
// the page's own title, fonts and styles go in the head; a host's own tags are left out
// The script's address carries a stamp of its own contents. A browser keeps a file it has seen under the same address,
// so without the stamp a new build could go on showing the old script for a while.
const stamp = createHash('sha256').update(readFileSync('dist/mech-board.js')).digest('hex').slice(0, 10);
const SCRIPT = '<script src="mech-board.js"></script>';
if (page.split(SCRIPT).length !== 2) throw new Error('src/page.html should load mech-board.js exactly once');
const cut = page.indexOf('<div class="wrap">');
const head = page.slice(0, cut).replace(/<meta name="claude:[^>]*>\n?/g, '');
writeFileSync('dist/index.html', `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="重裝機體 03：會動的 3D 原型。可以轉動、播放九個動作、換塗裝、改體型。">
${head}</head>
<body>
${page.slice(cut).replace(SCRIPT, `<script src="mech-board.js?v=${stamp}"></script>`)}</body>
</html>
`);
writeFileSync('dist/.nojekyll', '');     // GitHub Pages serves the folder as it is
console.log('page', (page.length / 1024).toFixed(1), 'kB, script', (readFileSync('dist/mech-board.js').length / 1024).toFixed(0), 'kB');
