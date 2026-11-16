# Abyssal Garden: the collection

**333 underwater gardens on Bitcoin, all grown from one on-chain engine.**

This is a generative ordinals collection built on [Abyssal Garden](https://github.com/Noniv/abyssal-garden) by
**Noniv** (Maksymilian Dendura): a WebGPU underwater world, kelp forests, light rays, a sunken ship, manta rays,
made entirely by code in one HTML file. The original is MIT-licensed, Copyright (c) 2026 Maksymilian Dendura; this
repository keeps that [LICENSE](LICENSE) and adds the collection changes by Jerry. Every built page carries the
copyright notice in an HTML comment and in its footer.

![Kelp forest with a stone whale tail and a manta ray](.github/screenshots/whale-fluke.jpg)

## How it works

- **Parent**: the engine, [`index.html`](index.html), inscribed once (Brotli-compressed). Opened on its own it shows
  the original garden.
- **Children**: 333 tiny HTML inscriptions (~223 bytes each), children of the parent. Each one only says which piece it
  is and loads the parent:

  ```html
  <!doctype html><script>AG={n:42}</script><script>fetch('/content/<PARENT_ID>').then(r=>r.text()).then(h=>{document.open();document.write(h);document.close()})</script>
  ```

- **Seed from the block**: the engine reads its own inscription id from the address, asks ord's recursive endpoints for
  the block the piece was inscribed in (`/r/inscription/<id>` then `/r/blockhash/<height>`) and mixes that block hash
  with the piece number. Nobody, including the creator, knows a piece's look before it is inscribed.
- **Growth**: kelp height, kelp columns and fish per school grow from half to full over the first year (52,560
  blocks) after inscription (`/r/blockheight`).
- **Day and night**: the light follows the UTC hour of the latest block (`/r/blocktime`): day about 10:00 to 16:00,
  dusk and dawn ramps, night about 20:00 to 06:00 with dimmed sunlight and glowing kelp, ground cover and coral.
- **Fallbacks**: every request gives up after 3 seconds; with no chain the piece still starts, seeded from its number,
  fully grown, at midday. Without WebGPU it shows a card instead of the scene. Drag to look around (no pointer lock,
  so it works inside ordinals.com's sandboxed preview).

The code for this lives in [`source/src/chain.js`](source/src/chain.js) (seed, growth, hour) and
[`source/src/params.js`](source/src/params.js) (traits).

## Traits

Each piece draws one value per trait from its seed. Weights are the share the draw aims for; 333 pieces land close to
it, not exactly (run `node collection/traits.mjs --simulate`).

| Trait | Values (weight %) | What it changes |
|---|---|---|
| Palette | Lagoon 20, Emerald 17, Twilight 16, Amber 14, Glacier 13, Coral Bloom 10, Rose Gold 6, **Obsidian 4** | Water, sunlight, kelp, coral and glow colours |
| Depth | Shallows 30, Midwater 45, Abyss 25 | Fog, light falloff, light shafts, bioluminescence |
| Terrain | Canyons 35, Highlands 25, Lowlands 25, Badlands 15 | Shape and roughness of the seabed |
| Kelp | Sparse 25, Lush 55, Overgrown 20 | Number of kelp columns (×0.5, ×1, ×1.4) |
| Wreck | yes 15 | The sunken ship |
| Glowing trench | **yes 5** | A trench across the purple grotto, lit by glowing veins and drifting motes |
| Night | **yes 6** | Always night, whatever the block time |

Every piece also gets its own stretch of seabed around the same landmarks.

## Costs

Estimates only: the real figure depends on the wallet and the batch. See ordstudio's Plan for exact numbers.

| | Size | vB | 1 sat/vB | 2 sat/vB | 5 sat/vB |
|---|---|---|---|---|---|
| Parent (engine) | 99.5 KB, 34.9 KB Brotli | 9,076 | 9,076 | 18,152 | 45,380 |
| One child | 223 B | ~346 | 346 | 692 | 1,730 |
| 333 children | | ~115,218 | 115,218 | 230,436 | 576,090 |
| **Total** | | **~124,294** | **124,294** | **248,588** | **621,470** |

The parent figure was measured; a child of N bytes is about N/4 + 290 vB. Not included: the postage each inscription
keeps (usually 330 to 546 sats) and any service fee.

## Build and run locally

Needs Node 22.

```sh
cd source && npm ci && npm run build     # writes ../index.html, the engine
node collection/check-size.mjs           # engine Brotli size, fails over 40,000 B
node collection/make-children.mjs        # collection/children/: 333 children, parent.html, ordstudio.json
node collection/serve.mjs                # then open http://localhost:8787/gallery.html
```

- **Gallery**: `serve.mjs` fakes ord's `/content` and `/r/` routes with made-up block hashes, so 12 pieces run their
  real chain path side by side, each in a sandboxed frame like on ordinals.com. `?n=0,7,42` picks pieces;
  `HOUR=22 node collection/serve.mjs` fixes the hour, `CHAIN=off` tests the fallbacks.
- **ordstudio**: drop the `collection/children/` folder into ordstudio. In Local mode the children load
  `/content/local:parent`. Once the parent is inscribed, run `node collection/make-children.mjs <PARENT_ID>` and
  inscribe the children with `--parent <PARENT_ID>`.
- **Traits**: `node collection/traits.mjs hashes.json` (`{"<n>": "<block hash>"}`) writes the trait table to
  `collection/out/traits.csv` and `.json` and prints a rarity summary; `--simulate` uses made-up hashes.
- `npm run build:dev` writes `dev.html` with the original's fly-through (`F`) and benchmark (`B`) tools.

CI ([`.github/workflows/build.yml`](.github/workflows/build.yml)) builds on every push and fails if the engine is over
40,000 B Brotli or any child over 300 B. It uses GitHub-hosted runners, so it only runs if Actions is enabled for the
account.

## WebGPU

The scene needs WebGPU, best in Chrome or Edge on a desktop computer. Without it the piece shows a card instead of the
scene. Wallets and marketplaces that preview inscriptions in their own viewers may not offer WebGPU.

## License

[MIT](LICENSE). Original world Copyright (c) 2026 Maksymilian Dendura ([Noniv/abyssal-garden](https://github.com/Noniv/abyssal-garden));
collection changes by Jerry.
