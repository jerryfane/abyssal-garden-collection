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
  landmark: [['Whale Fluke', 35], ['Stone Arch', 25], ['Monolith', 20], ['Open Sand', 20]],
};
// palette: water, purple-zone water, sun, ambient, kelp tint, coral tint, trench glow (rgb each), bioluminescence,
// colour grade (rgb), saturation
const AG_PAL = {
  Lagoon: [.16, .58, .90, .58, .66, .98, 1.7, 1.6, 1.45, .22, .60, .80, 1, 1, 1, 1, 1, 1, .3, 1, .9, 1, 1, 1, 1, .93],
  Emerald: [.04, .62, .24, .30, .80, .50, 1.5, 1.8, 1.1, .10, .60, .30, 1.1, 1.5, .6, .9, 1.2, .7, .4, 1, .4, 1, .82, 1.12, .8, 1.05],
  Twilight: [.36, .16, .95, .80, .36, 1, 1.5, 1.2, 2, .40, .24, .92, .9, .55, 1.4, 1, .5, 1.5, .8, .4, 1, 1.4, 1.08, .78, 1.18, 1.05],
  Amber: [.92, .58, .10, 1, .62, .25, 2.1, 1.6, .8, .85, .55, .20, 1.5, 1.1, .4, 1.3, .9, .5, 1, .7, .15, 1, 1.18, 1, .7, 1],
  Glacier: [.66, .90, 1, .80, .92, 1, 1.9, 2, 2.1, .70, .88, 1, .8, 1.1, 1.2, .9, 1, 1.2, .5, .9, 1, 1, 1.08, 1.1, 1.14, .72],
  'Coral Bloom': [.98, .24, .58, 1, .40, .78, 2, 1.4, 1.5, .90, .32, .58, 1.4, .7, .8, 1.5, .7, 1.1, 1, .3, .6, 1.2, 1.15, .86, 1, 1.05],
  'Rose Gold': [.86, .50, .42, .95, .58, .50, 2.1, 1.6, 1.3, .80, .52, .46, 1.4, 1, .75, 1.3, .85, .7, 1, .6, .4, 1.1, 1.12, .96, .86, .85],
  Obsidian: [.012, .025, .04, .08, .02, .14, .8, .9, 1.1, .03, .05, .08, .5, .9, 1.1, .4, 1.4, 1.6, .2, 1, .9, 4, .9, 1, 1.1, 1.1],
};
// depth band: fog density, light falloff, sun, light shafts, exposure, bioluminescence
const AG_DEP = { Shallows: [.8, .8, 1.15, 1.3, .95, 1], Midwater: [1, 1, 1, 1, 1, 1], Abyss: [1.3, 1.4, .7, .6, 1.25, 1.6] };
// terrain: plateau threshold shift, plateau height, floor relief, rock roughness, height of the designed rock masses
const AG_TER = { Canyons: [0, 1, 1, 1, 1], Highlands: [-.04, 1.3, 1.6, 1.1, 1.35], Lowlands: [.06, .6, .45, .8, .55], Badlands: [0, 1, 2, 1.8, 1.1] };
const AG_KELP = { Sparse: .5, Lush: 1, Overgrown: 1.4 };
const agPiece = (o, ox, oz, view, sun, rays) => {
  const pal = AG_PAL[o.palette], w = pal.slice(0, 3), m = Math.max(...w), cn = w.map((c) => c / m);
  // light is absorbed least in the water's own colour: that is what turns the distance amber, violet or green
  const kd = o.palette === 'Lagoon' ? [.056, .0245, .017] : cn.map((c) => .066 - .046 * c);
  return { ...o, ox, oz, view, sun, rays, pal, dep: AG_DEP[o.depth], ter: AG_TER[o.terrain], km: AG_KELP[o.kelp], kd,
    si: o.palette === 'Lagoon' ? [.058, .0235, .0195] : kd.map((k) => k * 1.04),
    sky: o.palette === 'Lagoon' ? [.30, .78, 1] : cn.map((c) => (.2 + .85 * c) * Math.min(1, m * 1.6)) };
};

// the garden as it was first made: what the engine shows without a piece config
export const GENESIS = agPiece({ palette: 'Lagoon', depth: 'Midwater', terrain: 'Canyons', kelp: 'Lush', wreck: true, trench: false, night: false, landmark: 'Whale Fluke' }, 0, 0, 0, [.27, 1, -.24], 1);

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
  // where the terrain noise is read (every piece gets its own seabed around the same hand-placed landmarks), where the
  // dive starts (main.js picks a viewpoint from it), the sun (low and slanted in the deep) and how dense its shafts are
  const ox = r() * 4e3 - 2e3, oz = r() * 4e3 - 2e3, view = r(), a = r() * 6.2832, tilt = .12 + r() * (o.depth === 'Abyss' ? .8 : .5);
  return agPiece(o, ox, oz, view, [Math.sin(a) * tilt, 1, Math.cos(a) * tilt], .55 + r() * 1.3);
}
