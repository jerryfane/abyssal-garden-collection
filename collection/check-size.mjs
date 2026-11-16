// Fails if the engine (index.html) is over 40,000 bytes once Brotli-compressed the way `ord wallet inscribe --compress`
// does it (quality 11, window and block 24).
//   node collection/check-size.mjs
import { readFileSync } from 'node:fs';
import { brotliCompressSync, constants as z } from 'node:zlib';

const MAX = 40000;
const html = readFileSync(new URL('../index.html', import.meta.url));
const br = brotliCompressSync(html, {
  params: { [z.BROTLI_PARAM_QUALITY]: 11, [z.BROTLI_PARAM_LGWIN]: 24, [z.BROTLI_PARAM_LGBLOCK]: 24, [z.BROTLI_PARAM_SIZE_HINT]: html.length },
}).length;
console.log(`index.html: ${html.length} B, ${br} B Brotli (budget ${MAX} B)`);
if (br > MAX) process.exit(1);
