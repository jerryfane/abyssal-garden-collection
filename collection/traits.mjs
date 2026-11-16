// Trait table for the collection, from the same params() and seedFrom() the engine runs.
//   node collection/traits.mjs hashes.json        {"<n>": "<block hash of the block piece n was inscribed in>", ...}
//   node collection/traits.mjs --simulate         333 made-up block hashes (--count N, --rng <text> to vary them)
// Writes collection/out/traits.csv and traits.json and prints the rarity summary.
// --csv or --json prints that table to stdout instead of the summary.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { seedFrom } from '../source/src/chain.js';
import { TRAITS, params } from '../source/src/params.js';
import { COUNT } from './lib.mjs';

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    simulate: { type: 'boolean' }, count: { type: 'string', default: String(COUNT) }, rng: { type: 'string', default: 'abyssal' },
    csv: { type: 'boolean' }, json: { type: 'boolean' },
  },
});

let hashes;
if (opt.simulate) {
  // a real block hash starts with ~19 zero hex digits; the rest looks random
  const sim = (n) => '0'.repeat(19) + createHash('sha256').update(`${opt.rng}:${n}`).digest('hex').slice(0, 45);
  hashes = Array.from({ length: +opt.count }, (_, n) => [n, sim(n)]);
} else if (positionals[0]) {
  hashes = Object.entries(JSON.parse(readFileSync(positionals[0], 'utf8'))).map(([n, h]) => [+n, h]);
  const bad = hashes.find(([n, h]) => !(Number.isInteger(n) && n >= 0 && /^[0-9a-f]{64}$/.test(h)));
  if (bad) throw new Error(`bad entry ${JSON.stringify(bad)}: expected {"<n>": "<64 hex block hash>"}`);
} else {
  console.error('usage: node collection/traits.mjs <hashes.json> | --simulate [--count N] [--rng TEXT] [--csv | --json]');
  process.exit(1);
}

const keys = Object.keys(TRAITS);
const rows = hashes.map(([n, hash]) => {
  const seed = seedFrom(hash, n), p = params(seed);
  return { n, hash, seed, ...Object.fromEntries(keys.map((k) => [k, p[k]])) };
});

const cols = ['n', 'hash', 'seed', ...keys];
const cell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n') + '\n';
const json = JSON.stringify(rows, null, 1) + '\n';
const out = new URL('out/', import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL('traits.csv', out), csv);
writeFileSync(new URL('traits.json', out), json);
if (opt.csv || opt.json) {
  process.stdout.write(opt.csv ? csv : json);
  process.exit(0);
}

// rarity summary: observed count and share against the share the weights aim for
console.log(`${rows.length} pieces (${opt.simulate ? `simulated hashes, rng "${opt.rng}"` : positionals[0]}); tables in collection/out/traits.{csv,json}\n`);
const pct = (x) => (100 * x).toFixed(1).padStart(5) + '%';
for (const k of keys) {
  const total = TRAITS[k].reduce((a, [, w]) => a + w, 0);
  console.log(k);
  for (const [v, w] of TRAITS[k]) {
    const c = rows.filter((r) => r[k] === v).length;
    console.log(`  ${String(v).padEnd(16)} ${String(c).padStart(6)}  ${pct(c / rows.length)}   target ${pct(w / total)}`);
  }
  const other = rows.filter((r) => !TRAITS[k].some(([v]) => v === r[k])).length;
  if (other) console.log(`  (not in TRAITS)  ${String(other).padStart(6)}`);
}
// the same trait combination twice is worth knowing about before inscribing
const combos = new Map();
for (const r of rows) {
  const c = keys.map((k) => r[k]).join('|');
  combos.set(c, (combos.get(c) ?? 0) + 1);
}
const dup = [...combos.values()].filter((c) => c > 1);
console.log(`\n${combos.size} distinct trait combinations; ${dup.length} shared by more than one piece (seeds still differ)`);
