// ============================================================================
// the piece on chain: seed, growth and hour of the day (ES module: nothing runs on import)
// ============================================================================
// The child inscription sets AG = { n: its index 0..332 }; the page then reads its own inscription id from the URL and
// asks the recursive endpoints for the block it was inscribed in (seed), the current height (growth: one year to full
// size) and the latest block's time (day or night). Every request gives up after 3 s and falls back:
//   seed: block hash + n, else AG.s (a number is the seed itself, 64 hex digits stand in for a block hash), else n alone
//   AG.g (growth 0..1) and AG.h (UTC hour) override the chain for previews
export function seedFrom(hash, n) {
  let a = 0xDEADBEEF ^ n, b = 0x41C6CE57 ^ n;
  for (let i = 0; i < hash.length; i += 8) { const c = parseInt(hash.slice(i, i + 8), 16) | 0; a = Math.imul(a ^ c, 2654435761); b = Math.imul(b ^ c, 1597334677); }
  a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909);
  b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909);
  return (a ^ b) >>> 0;
}
export async function chain(ag) {
  const n = ag.n | 0, id = location.pathname.split('/').pop();
  const get = (u) => Promise.race([fetch(u).then((r) => r.json()), new Promise((r) => setTimeout(r, 3e3))]).catch(() => {});
  let seed, grow = ag.g, hour = ag.h;
  if (/^[0-9a-f]{64}i\d+$/.test(id)) {
    const [ins, now, time] = await Promise.all([get('/r/inscription/' + id), get('/r/blockheight'), get('/r/blocktime')]), h = ins && ins.height;
    if (h >= 0) {
      const hash = await get('/r/blockhash/' + h);
      if (typeof hash == 'string') seed = seedFrom(hash, n);
      if (now >= h) grow ??= Math.min(1, (now - h) / 52560);
    }
    if (time > 0) hour ??= new Date(time * 1e3).getUTCHours();
  }
  seed ??= typeof ag.s == 'number' ? ag.s >>> 0 : seedFrom(ag.s || '', n);
  return { seed, grow: grow ?? 1, hour: hour ?? 12 };
}
