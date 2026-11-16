// Local test server: the gallery plus a fake ord server, so the children run their real chain path.
//   node collection/serve.mjs      then open http://localhost:8787/gallery.html
// Env: PORT (8787), HOUR=0..23 fixes the UTC hour of /r/blocktime (default: now), CHAIN=off answers every /r/ route
// with 404 (to check that the scene still starts on its fallbacks).
// Every piece gets a made-up inscription id, mint height and block hash; piece 0 was "minted" at the tip and piece 332
// a year (52,560 blocks) earlier, so the gallery shows the whole growth range. Nothing here talks to the network.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { seedFrom } from '../source/src/chain.js';
import { TRAITS, params } from '../source/src/params.js';
import { COUNT, child } from './lib.mjs';

const PORT = +(process.env.PORT ?? 8787);
const TIP = 960000;
const hour = process.env.HOUR;
const chainOff = process.env.CHAIN === 'off';

const sha = (s) => createHash('sha256').update(s).digest('hex');
const PARENT = sha('abyssal-garden:parent') + 'i0';
const childId = (n) => sha(`abyssal-garden:child:${n}`) + 'i0';
const byId = new Map(Array.from({ length: COUNT }, (_, n) => [childId(n), n]));
const mintHeight = (n) => TIP - Math.round((n * 52560) / (COUNT - 1));
const blockHash = (h) => '0'.repeat(19) + sha(`abyssal-garden:block:${h}`).slice(0, 45);
const blockTime = () => {
  if (hour === undefined) return Math.floor(Date.now() / 1000);
  const d = new Date();
  d.setUTCHours(+hour, 0, 0, 0);
  return d.getTime() / 1000;
};
// everything the gallery labels a piece with; s is the seed the chain path computes, passed as AG.s too
const piece = (n) => {
  const height = mintHeight(n), hash = blockHash(height), s = seedFrom(hash, n), p = params(s);
  const traits = Object.fromEntries(Object.keys(TRAITS).map((k) => [k, p[k]]));
  return { n, id: childId(n), height, hash, s, grow: Math.min(1, (TIP - height) / 52560), traits };
};
const inscription = (id, n) => ({
  charms: [], content_type: 'text/html;charset=utf-8', content_length: null, delegate: null, fee: 0,
  height: n === undefined ? TIP - 52560 - 1 : mintHeight(n), id, number: 100000000 + (n ?? -1), output: `${id.slice(0, 64)}:0`,
  sat: null, satpoint: `${id.slice(0, 64)}:0:0`, timestamp: 1790000000, value: 546,
});

// ord serves /content with this CSP and every route with Access-Control-Allow-Origin: *
const CSP = "default-src 'self' 'unsafe-eval' 'unsafe-inline' data: blob:";
const send = (res, status, body, type, extra = {}) => {
  res.writeHead(status, { 'content-type': type, 'access-control-allow-origin': '*', 'cache-control': 'no-store', ...extra });
  res.end(body);
};
const json = (res, v) => send(res, 200, JSON.stringify(v), 'application/json');
const html = (res, body) => send(res, 200, body, 'text/html;charset=utf-8', { 'content-security-policy': CSP });

createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = decodeURIComponent(url.pathname);
  let m;
  if (p === '/') return send(res, 302, '', 'text/plain', { location: '/gallery.html' });
  if (p === '/gallery.html') return send(res, 200, readFileSync(new URL('gallery.html', import.meta.url)), 'text/html;charset=utf-8');
  if (p === '/gallery.json') {
    const ns = url.searchParams.get('n')?.split(',').map(Number).filter((n) => n >= 0 && n < COUNT)
      ?? Array.from({ length: 12 }, (_, i) => Math.round((i * (COUNT - 1)) / 11));
    return json(res, ns.map(piece));
  }
  if ((m = p.match(/^\/content\/(.+)$/))) {
    // the engine is read on every request, so a rebuild shows up on reload
    if (m[1] === PARENT || m[1] === 'local:parent') return html(res, readFileSync(new URL('../index.html', import.meta.url)));
    const n = byId.get(m[1]);
    if (n !== undefined) return html(res, child(n, PARENT, `{n:${n},s:${piece(n).s}}`));
  }
  if (p.startsWith('/r/') && !chainOff) {
    if ((m = p.match(/^\/r\/inscription\/(.+)$/)) && (byId.has(m[1]) || m[1] === PARENT)) return json(res, inscription(m[1], byId.get(m[1])));
    if ((m = p.match(/^\/r\/blockhash\/(\d+)$/)) && +m[1] <= TIP) return json(res, blockHash(+m[1]));
    if (p === '/r/blockhash') return json(res, blockHash(TIP));
    if (p === '/r/blockheight') return json(res, TIP);
    if (p === '/r/blocktime') return json(res, blockTime());
  }
  send(res, 404, 'not found', 'text/plain');
}).listen(PORT, 'localhost', () => console.log(`http://localhost:${PORT}/gallery.html  (fake chain tip ${TIP}${chainOff ? ', /r/ off' : ''}${hour === undefined ? '' : `, UTC hour ${hour}`})`));
