// Shared by make-children.mjs and serve.mjs
import { readFileSync } from 'node:fs';

export const COUNT = 333; // pieces, AG.n = 0..332
export const MAX_CHILD = 300; // bytes per child inscription
export const ID = /^[0-9a-f]{64}i\d+$/;

const tpl = readFileSync(new URL('child.html.tpl', import.meta.url), 'utf8');

// The child HTML for piece n: sets AG = {n} (the engine reads it as globalThis.AG) and loads the parent, giving up
// with a one-line message after 10 s or on an error.
export const child = (n, parent) => tpl.replace('{{AG}}', `{n:${n}}`).replace('{{PARENT}}', () => parent);
