// Writes the 333 child inscriptions and an ordstudio.json into collection/children/, ready to drop into ordstudio.
//   node collection/make-children.mjs                 children load /content/local:parent (ordstudio Local mode)
//   node collection/make-children.mjs <PARENT_ID>     children load the inscribed parent (<64 hex>i<n>)
// The folder also gets parent.html, a copy of ../index.html (the engine), so ordstudio can serve it.
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { COUNT, ID, MAX_CHILD, child } from './lib.mjs';

const parent = process.argv[2] ?? 'local:parent';
if (!ID.test(parent) && parent !== 'local:parent') {
  console.error(`PARENT_ID must be an inscription id (<64 hex>i<n>) or local:parent, got ${parent}`);
  process.exit(1);
}

const dir = new URL('children/', import.meta.url);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir);
copyFileSync(new URL('../index.html', import.meta.url), new URL('parent.html', dir));

// ordstudio.json key order: ordstudio, files; then id, role, parent, as, compress (see ordstudio's spec)
const files = { 'parent.html': { id: ID.test(parent) ? parent : null, role: 'parent', as: 'parent', compress: 'br' } };
const sizes = [];
const fail = [];
// a local placeholder is shorter than a real id: also check every child against a full-length id
const realId = parent.startsWith('local:') ? 'f'.repeat(64) + 'i0' : parent;
let realMax = 0;
for (let n = 0; n < COUNT; n++) {
  const name = String(n).padStart(4, '0');
  const html = child(n, parent);
  const size = Buffer.byteLength(html);
  realMax = Math.max(realMax, Buffer.byteLength(child(n, realId)));
  if (size > MAX_CHILD) fail.push(`${name}.html: ${size} B`);
  sizes.push(size);
  writeFileSync(new URL(`${name}.html`, dir), html);
  files[`${name}.html`] = { id: null, role: 'child', parent: 'parent.html', as: `child-${name}` };
}
writeFileSync(new URL('ordstudio.json', dir), JSON.stringify({ ordstudio: 1, files }, null, 2) + '\n');

console.log(`collection/children: ${COUNT} children loading /content/${parent}, ${Math.min(...sizes)}-${Math.max(...sizes)} B each` +
  (realId === parent ? '' : `, ${realMax} B with a real parent id`) + `; parent.html; ordstudio.json`);
if (realMax > MAX_CHILD) fail.push(`with a real parent id: ${realMax} B`);
if (fail.length) {
  console.error(`over the ${MAX_CHILD} B budget:\n  ${fail.join('\n  ')}`);
  process.exit(1);
}
