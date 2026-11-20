import validator from 'gltf-validator'; import { readFileSync } from 'node:fs';
const f = process.argv[2]; const r = await validator.validateBytes(new Uint8Array(readFileSync(f)));
const i = r.issues; console.log('errors', i.numErrors, 'warnings', i.numWarnings, 'infos', i.numInfos, 'hints', i.numHints);
const by = {}; for (const m of i.messages) by[m.code] = (by[m.code] || 0) + 1; console.log(by);
console.log(JSON.stringify(r.info, null, 0).slice(0, 600));
for (const m of i.messages.filter((m) => m.severity <= 1).slice(0, 6)) console.log(m.severity, m.code, m.message, m.pointer);
