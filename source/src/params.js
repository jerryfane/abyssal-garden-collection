// ============================================================================
// the piece's traits from its seed (pure: no DOM, importable in Node as an ES module)
// ============================================================================
// trait: [[value, weight], ...]; params() draws them in this order from the seed
export const TRAITS = {
  palette: [['Lagoon', 20], ['Emerald', 17], ['Twilight', 16], ['Amber', 14], ['Glacier', 13], ['Coral Bloom', 10], ['Rose Gold', 6], ['Obsidian', 4]],
  depth: [['Shallows', 30], ['Midwater', 45], ['Abyss', 25]],
  terrain: [['Canyons', 35], ['Highlands', 25], ['Lowlands', 25], ['Badlands', 15]],
  kelp: [['Sparse', 25], ['Lush', 55], ['Overgrown', 20]],
  wreck: [[true, 15], [false, 85]],
  trench: [[true, 5], [false, 95]],
  night: [[true, 6], [false, 94]],
};
// palette: water, purple-zone water, sun, ambient, kelp tint, coral tint, trench glow (rgb each), bioluminescence
const AG_PAL = {
  Lagoon: [.16, .58, .90, .58, .66, .98, 1.7, 1.6, 1.45, .22, .60, .80, 1, 1, 1, 1, 1, 1, .3, 1, .9, 1],
  Emerald: [.10, .62, .52, .40, .80, .66, 1.6, 1.7, 1.3, .16, .62, .56, 1.1, 1.3, .8, .9, 1.1, .8, .4, 1, .5, 1],
  Twilight: [.28, .32, .88, .76, .50, .98, 1.5, 1.4, 1.75, .32, .36, .84, .8, .7, 1.3, .9, .6, 1.4, .7, .4, 1, 1.3],
  Amber: [.52, .52, .36, .86, .62, .40, 1.9, 1.55, 1.05, .50, .50, .40, 1.4, 1.1, .6, 1.2, .95, .6, 1, .7, .2, 1],
  Glacier: [.40, .74, .95, .70, .85, 1, 1.6, 1.7, 1.85, .44, .70, .86, .7, 1, 1.2, .8, .95, 1.2, .5, .9, 1, 1],
  'Coral Bloom': [.20, .55, .80, .95, .55, .70, 1.8, 1.5, 1.4, .30, .55, .75, 1.3, .8, .7, 1.3, .8, 1.1, 1, .4, .6, 1.2],
  'Rose Gold': [.62, .42, .52, .95, .60, .50, 1.9, 1.5, 1.3, .58, .45, .54, 1.4, .9, .7, 1.2, .8, .7, 1, .6, .4, 1.2],
  Obsidian: [.05, .12, .18, .35, .12, .50, 1, 1.1, 1.3, .08, .18, .26, .6, .8, 1, .5, 1.2, 1.4, .2, 1, .9, 3],
};
// depth band: fog density, light falloff, sun, light shafts, exposure, bioluminescence
const AG_DEP = { Shallows: [.8, .8, 1.15, 1.3, .95, 1], Midwater: [1, 1, 1, 1, 1, 1], Abyss: [1.3, 1.4, .7, .6, 1.25, 1.6] };
// terrain: plateau threshold shift, plateau height, floor relief, rock roughness
const AG_TER = { Canyons: [0, 1, 1, 1], Highlands: [-.035, 1.2, 1.3, 1.1], Lowlands: [.05, .75, .6, .8], Badlands: [0, 1, 1.5, 1.6] };
const AG_KELP = { Sparse: .5, Lush: 1, Overgrown: 1.4 };
const agPiece = (o, ox, oz) => ({ ...o, ox, oz, pal: AG_PAL[o.palette], dep: AG_DEP[o.depth], ter: AG_TER[o.terrain], km: AG_KELP[o.kelp] });

// the garden as it was first made: what the engine shows without a piece config
export const GENESIS = agPiece({ palette: 'Lagoon', depth: 'Midwater', terrain: 'Canyons', kelp: 'Lush', wreck: true, trench: false, night: false }, 0, 0);

export function params(seed) {
  let s = seed | 0;
  const r = () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const o = {};
  for (const k in TRAITS) { const T = TRAITS[k]; let u = r() * T.reduce((a, v) => a + v[1], 0); o[k] = T.find((v) => (u -= v[1]) < 0)[0]; }
  // where the terrain noise is read: every piece gets its own seabed around the same hand-placed landmarks
  return agPiece(o, r() * 4e3 - 2e3, r() * 4e3 - 2e3);
}
