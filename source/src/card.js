// ============================================================================
// no WebGPU: a painted card of this piece instead of the dive (also what marketplace thumbnails show)
// ============================================================================
function card() {
  const P = PIECE, pl = P.pal, T = P.ter, c = canvas.getContext('2d'), lt = 0.2 + 0.8 * DAY;
  const col = (o, k = 1, a = 1, add = 0) => `rgba(${[0, 1, 2].map((i) => min(255, (pl[o + i] * k + add) * 255) | 0)},${a})`;
  body.className = 'g v';
  const draw = () => {
    const w = canvas.width = canvas.clientWidth * devicePixelRatio | 0, h = canvas.height = canvas.clientHeight * devicePixelRatio | 0, u = min(w, h) / 100;
    rseed(77);
    // water: sunlit near the surface, the palette's colour sinking into the dark (faster in the deep bands)
    let g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, col(0, 1.25 * lt / P.dep[1], 1, 0.08 * lt)); g.addColorStop(0.5, col(0, 0.5 * lt / P.dep[0])); g.addColorStop(1, col(0, 0.06));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const x = rr(-0.3, 1) * w, s = rr(0.01, 0.06) * w; g = c.createLinearGradient(0, 0, 0, h * 0.9);
      g.addColorStop(0, col(6, 0.12 * lt * P.dep[3])); g.addColorStop(1, col(6, 0, 0));
      c.fillStyle = g; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + s, 0); c.lineTo(x + s + h * 0.5, h); c.lineTo(x + h * 0.42, h); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    // seabed: the terrain trait's plateaus and relief, read from the same noise offset as the 3D seabed
    const gy = [], N = 120;
    for (let i = 0; i <= N; i++) {
      const x = i / N, n = fbm(x * 3 + P.ox, 1.7, P.oz, 4), pt = sstep(0.5 + T[0], 0.565 + T[0], n);
      gy.push(h * (0.8 - (fbm(x * 9 + P.ox, 3, P.oz, 3) - 0.5) * 0.12 * T[2] - pt * 0.28 * T[1]) + (rnd() - 0.5) * u * T[3]);
    }
    const ground = (x) => gy[clamp(round(x / w * N), 0, N)];
    const silhouette = (k) => { c.fillStyle = col(0, k * lt); c.beginPath(); c.moveTo(0, h); for (let i = 0; i <= N; i++) c.lineTo(i / N * w, gy[i]); c.lineTo(w, h); c.fill(); };
    silhouette(0.16);
    // the wreck on the seabed, the glowing trench cut into it
    if (P.wreck) {
      const x = w * 0.68, y = ground(x) + u, s = u * 7;
      c.fillStyle = col(0, 0.1 * lt); c.beginPath(); c.moveTo(x - s * 2.2, y - s * 0.9); c.quadraticCurveTo(x - s * 1.6, y + s * 0.4, x, y + s * 0.3); c.quadraticCurveTo(x + s * 2, y + s * 0.1, x + s * 2.6, y - s * 1.2); c.lineTo(x + s * 1.2, y - s * 0.6); c.closePath(); c.fill();
      c.strokeStyle = c.fillStyle; c.lineWidth = u * 0.5; c.beginPath(); c.moveTo(x + s * 0.8, y - s * 0.5); c.lineTo(x + s * 1.1, y - s * 3.1); c.moveTo(x - s * 0.7, y - s * 0.4); c.lineTo(x - s * 1.4, y - s * 2); c.stroke();
    }
    if (P.trench) {
      const x = w * 0.36, y = ground(x) + u * 2; g = c.createRadialGradient(x, y, 0, x, y, u * 26);
      g.addColorStop(0, col(18, 1, 0.9, 0.3)); g.addColorStop(1, col(18, 1, 0));
      c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - u * 26, y - u * 26, u * 52, u * 52); c.globalCompositeOperation = 'source-over';
    }
    // kelp: tinted stems swaying up from the seabed, as many and as tall as the kelp trait and growth make them
    const nk = 26 * P.km * P.gs | 0;
    for (let i = 0; i < nk; i++) {
      const x = rnd() * w, y = ground(x), H = rr(0.25, 0.6) * h * P.gs, b = rr(-1, 1) * u * 6;
      c.strokeStyle = `rgba(${[0.2, 0.3, 0.06].map((v, j) => min(255, v * pl[12 + j] * lt * rr(0.6, 1.4) * 255) | 0)},.9)`; c.lineWidth = rr(0.4, 1) * u;
      c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + b, y - H * 0.4, x - b, y - H * 0.7, x + b * 0.5, y - H); c.stroke();
    }
    silhouette(0.07);
    // coral and sponges in the palette's coral tint
    for (let i = 0; i < 40; i++) { const x = rnd() * w; c.fillStyle = `rgba(${[0.8, 0.12, 0.2].map((v, j) => min(255, v * pl[15 + j] * (0.35 + 0.65 * lt) * rr(0.5, 1.2) * 255) | 0)},.85)`; c.beginPath(); c.arc(x, ground(x) + u * rr(0.5, 2), u * rr(0.3, 1.1), 0, TAU); c.fill(); }
    // bioluminescence: more of it in the deep and at night
    c.globalCompositeOperation = 'lighter';
    for (let i = 0, n = 50 * pl[21] * P.dep[5] * (3.5 - 2.5 * DAY) * (P.trench ? 2 : 1); i < n; i++) {
      const x = rnd() * w, y = rr(0.35, 1) * h, r = u * rr(0.3, 1.2); g = c.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, col(18, 1, rr(0.3, 0.9), 0.3)); g.addColorStop(1, col(18, 1, 0));
      c.fillStyle = g; c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    }
    c.globalCompositeOperation = 'source-over';
    g = c.createRadialGradient(w / 2, h / 2, min(w, h) * 0.3, w / 2, h / 2, max(w, h) * 0.75); g.addColorStop(0, '#0000'); g.addColorStop(1, '#000a');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // name, traits, credit
    c.fillStyle = '#e8fbff'; c.textBaseline = 'top'; c.shadowColor = '#000'; c.shadowBlur = u;
    c.font = `900 ${u * 6}px system-ui,sans-serif`; c.fillText(NAME.toUpperCase(), u * 5, u * 5);
    c.font = `700 ${u * 2.6}px system-ui,sans-serif`; c.fillText(TRAITS_LINE, u * 5, u * 12.5);
    c.globalAlpha = 0.7; c.textBaseline = 'bottom'; c.fillText('Abyssal Garden © 2026 Maksymilian Dendura · MIT', u * 5, h - u * 4);
    c.textAlign = 'right'; c.fillText('Open in a WebGPU browser to dive in', w - u * 5, h - u * 4); c.textAlign = 'left'; c.globalAlpha = 1; c.shadowBlur = 0;
  };
  draw();
  addEventListener('resize', draw);
}
