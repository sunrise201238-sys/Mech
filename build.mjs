// build.mjs — dist/page.html is the page as it is published (content only: the host wraps it), dist/mech-board.js its script,
// dist/index.html the same page inside a plain document, for looking at it from a file
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('dist', { recursive: true });
await build({ entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: true, outfile: 'dist/mech-board.js', target: 'es2020', legalComments: 'none' });
const page = readFileSync('src/page.html', 'utf8');
writeFileSync('dist/page.html', page);
writeFileSync('dist/index.html', '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>body{margin:0}</style></head><body>' + page + '</body></html>');
console.log('page', (page.length / 1024).toFixed(1), 'kB, script', (readFileSync('dist/mech-board.js').length / 1024).toFixed(0), 'kB');
