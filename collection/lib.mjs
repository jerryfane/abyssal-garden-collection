// Shared by make-children.mjs and serve.mjs
import { readFileSync } from 'node:fs';

export const COUNT = 333; // pieces, AG.n = 0..332
export const MAX_CHILD = 300; // bytes per child inscription
export const ID = /^[0-9a-f]{64}i\d+$/;

const tpl = readFileSync(new URL('child.html.tpl', import.meta.url), 'utf8');

// The child HTML for piece n. `ag` is the config object literal the engine reads as globalThis.AG.
export const child = (n, parent, ag = `{n:${n}}`) =>
  tpl.replace('{{AG}}', () => ag).replace('{{PARENT}}', () => parent);
