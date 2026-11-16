// Quick checks that need no browser: run after a build.
//   node collection/check.mjs
// - chain(): every fallback path lands on the seed the trait table (params) expects
// - params(): every trait value is one of TRAITS; the genesis garden keeps its look
// - the child: ≤ 300 B with a real parent id, and it loads that id
// - the engine uses no API that ordinals.com's sandbox blocks (web storage, cookies, pointer lock)
import { readFileSync } from 'node:fs';
import { chain, seedFrom } from '../source/src/chain.js';
import { GENESIS, TRAITS, params } from '../source/src/params.js';
import { COUNT, MAX_CHILD, child } from './lib.mjs';

const fails = [];
const ok = (cond, what) => { if (!cond) fails.push(what); };
const ID = 'ab'.repeat(32) + 'i0', HASH = '00000000000000000002' + 'c0ffee'.repeat(7) + 'ab';

// chain(): no inscription id in the address, recursive requests failing, and a working fake chain
globalThis.location = { pathname: '/preview' };
globalThis.fetch = () => Promise.reject(new Error('offline'));
let r = await chain({ n: 7 });
ok(r.seed === seedFrom('', 7) && r.grow === 1 && r.hour === 12, `no id: ${JSON.stringify(r)}`);
r = await chain({ n: 7, s: 12345 });
ok(r.seed === 12345, `AG.s number: ${r.seed}`);
r = await chain({ n: 7, s: HASH });
ok(r.seed === seedFrom(HASH, 7), `AG.s hash: ${r.seed}`);
globalThis.location = { pathname: '/content/' + ID };
r = await chain({ n: 7 });
ok(r.seed === seedFrom('', 7) && r.grow === 1 && r.hour === 12, `requests failing: ${JSON.stringify(r)}`);
const answers = { ['/r/inscription/' + ID]: { height: 900000 }, '/r/blockhash/900000': HASH, '/r/blockheight': 900000 + 26280, '/r/blocktime': Date.UTC(2026, 0, 1, 22) / 1e3 };
globalThis.fetch = async (u) => (u in answers ? { json: async () => answers[u] } : Promise.reject(new Error('404')));
r = await chain({ n: 7 });
ok(r.seed === seedFrom(HASH, 7) && r.grow === 0.5 && r.hour === 22, `fake chain: ${JSON.stringify(r)}`);

// params(): valid traits for every piece's fallback seed, genesis unchanged
for (let n = 0; n < COUNT; n++) {
  const p = params(seedFrom(HASH, n));
  for (const k in TRAITS) ok(TRAITS[k].some((v) => v[0] === p[k]), `piece ${n}: ${k} = ${p[k]}`);
}
ok(GENESIS.palette === 'Lagoon' && GENESIS.landmark === 'Whale Fluke' && GENESIS.wreck && GENESIS.ox === 0 && GENESIS.view === 0, 'genesis traits');
ok(GENESIS.kd.join() === '0.056,0.0245,0.017' && GENESIS.sun.join() === '0.27,1,-0.24' && GENESIS.rays === 1, 'genesis light');

// the child with a real parent id
const c = child(COUNT - 1, ID);
ok(Buffer.byteLength(c) <= MAX_CHILD, `child is ${Buffer.byteLength(c)} B`);
ok(c.includes(`AG={n:${COUNT - 1}}`) && c.includes(`/content/${ID}`), 'child config and parent id');

// blocked APIs, anywhere in the built engine
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const api of ['localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'requestPointerLock', 'pointerLockElement', 'window.open']) ok(!html.includes(api), `index.html uses ${api}`);

if (fails.length) { console.error('check failed:\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('check: chain fallbacks, traits, genesis, child size, blocked APIs: ok');
process.exit(0); // chain()'s 3 s timers would otherwise hold the process
