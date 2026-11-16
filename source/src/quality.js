// ============================================================================
// quality level, chosen before anything is built
// ============================================================================
// LV: 0 High, 1 Medium, 2 Low. Medium and Low keep every 2nd / 4th leaf, glint and pebble and bake fewer shadows;
// Low also drops anti-aliasing and uses coarser meshes, cheaper filtering and fewer light shaft steps.
// Chosen from the device (memory, touch screen); the Detail buttons reload the page with #0, #1 or #2 in the address,
// which overrides it. Nothing is stored: ordinals.com's sandboxed frames allow no storage.
const mob = matchMedia('(pointer:coarse)').matches, mem = navigator.deviceMemory;
const LV = /^#[012]$/.test(location.hash) ? +location.hash[1] : mob ? (mem > 7 ? 1 : 2) : mem <= 4 ? 2 : 0;
const setLV = (l) => { location.hash = l; location.reload(); };
const THIN = 1 << LV, SHADOW = LV ? 2048 : 4096, AA = LV > 1 ? 1 : 4, WATER = LV > 1 ? 256 : 512, RAYN = LV > 1 ? 12 : 34;
