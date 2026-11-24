/* Renderizador da Lua: esfera iluminada por pixel.
   - mapa de albedo procedural com os mares lunares em suas posições selenográficas reais
   - crateras com relevo (sombras perto do terminador)
   - reflectância de Lommel-Seeliger (o disco não escurece na borda, como a Lua real)
   - luz cinérea fraca no lado noturno
   - orientação conforme o hemisfério do observador (no Sul a Lua aparece "de cabeça para baixo") */
(function (root) {
  const TW = 720, TH = 360;
  let albedo = null, height = null;

  function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const s = (t) => t * t * (3 - 2 * t);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf);
  }
  function fbm(x, y) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < 5; i++) { v += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return v; }

  // [longitude, latitude, raio lon, raio lat, escurecimento]
  const MARIA = [
    [-57, 20, 26, 28, 0.46], [-48, -2, 14, 12, 0.36], [-16, 33, 17, 13, 0.46], [17, 28, 10, 9, 0.44],
    [31, 8.5, 13, 10, 0.44], [59, 17, 7, 6, 0.48], [51, -7, 9, 10, 0.38], [35, -15, 5, 5, 0.36],
    [-17, -21, 11, 9, 0.38], [-39, -24, 5, 5, 0.42], [3, 56, 34, 4.5, 0.32], [4, 13, 5, 4, 0.36],
    [-31, 7, 9, 6, 0.36], [-23, -10, 6, 5, 0.34], [2, 2, 4, 3, 0.3], [27, 20, 6, 5, 0.3], [87, 3, 6, 9, 0.3]
  ];
  const BRIGHT = [[-11.4, -43.3, 2.6, 0.24], [-20, 9.6, 2, 0.16], [-38, 8.1, 1.5, 0.12], [-47.4, 23.7, 1.1, 0.28], [-9.3, -12.8, 1.1, 0.1], [61, -17, 1.4, 0.12]];

  function build() {
    albedo = new Float32Array(TW * TH); height = new Float32Array(TW * TH);
    const craters = [];
    for (let i = 0; i < 700; i++) {
      const r = Math.pow(hash(i, 7), 4) * 5 + 0.4;
      craters.push([hash(i, 1) * 360 - 180, Math.asin(hash(i, 2) * 2 - 1) * 57.3, r]);
    }
    for (let y = 0; y < TH; y++) {
      const lat = 90 - (y + 0.5) * 180 / TH, cl = Math.cos(lat * Math.PI / 180);
      for (let x = 0; x < TW; x++) {
        const lon = (x + 0.5) * 360 / TW - 180;
        let a = 0.68 + (fbm(x / 40, y / 40) - 0.5) * 0.16 + (fbm(x / 9, y / 9) - 0.5) * 0.08 + (fbm(x / 2.5, y / 2.5) - 0.5) * 0.05 - lat * 0.0006;
        let mare = 0;
        for (const [ml, mb, rl, rb, k] of MARIA) {
          let dl = ((lon - ml + 540) % 360) - 180;
          const d = Math.hypot((dl * cl) / rl, (lat - mb) / rb);
          const edge = 1 + (fbm(x / 18 + ml, y / 18 + mb) - 0.5) * 1.5 + (fbm(x / 6, y / 6) - 0.5) * 0.35;
          if (d < edge) mare = Math.max(mare, k * Math.min(1, (edge - d) * 1.6));
        }
        a -= mare * 0.72 * (0.85 + fbm(x / 6, y / 6) * 0.3);
        for (const [bl, bb, r, k] of BRIGHT) {
          let dl = ((lon - bl + 540) % 360) - 180; const d = Math.hypot(dl * cl, lat - bb);
          if (d < r * 6) { // raios ejetados
            const ang = Math.atan2(lat - bb, dl * cl);
            const ray = Math.pow(Math.max(0, Math.sin(ang * 9 + bl) * Math.sin(ang * 5)), 6);
            a += k * (Math.exp(-(d * d) / (r * r)) + ray * 0.5 * Math.max(0, 1 - d / (r * 6)));
          }
        }
        albedo[y * TW + x] = Math.max(0.05, Math.min(1.1, a));
      }
    }
    for (const [cl0, cb, r] of craters) {
      const rr = r * 2.2, cosb = Math.cos(cb * Math.PI / 180) || 0.01;
      const y0 = Math.max(0, Math.floor((90 - cb - rr) * TH / 180)), y1 = Math.min(TH - 1, Math.ceil((90 - cb + rr) * TH / 180));
      const dx = rr / cosb;
      for (let y = y0; y <= y1; y++) {
        const lat = 90 - (y + 0.5) * 180 / TH;
        for (let lx = cl0 - dx; lx <= cl0 + dx; lx += 0.5) {
          const x = Math.floor(((((lx + 180) % 360) + 360) % 360) * TW / 360);
          const d = Math.hypot((lx - cl0) * cosb, lat - cb) / r;
          if (d > 2.2) continue;
          let h = d < 1 ? -(1 - d * d) * 0.35 : Math.exp(-((d - 1) * (d - 1)) * 6) * 0.18;
          height[y * TW + x] += h * Math.min(1, r / 3);
          
        }
      }
    }
  }

  function sample(arr, u, v) {
    const x = Math.min(TW - 1, Math.max(0, u)), y = Math.min(TH - 1, Math.max(0, v));
    const x0 = x | 0, y0 = y | 0, x1 = Math.min(TW - 1, x0 + 1), y1 = Math.min(TH - 1, y0 + 1), fx = x - x0, fy = y - y0;
    const a = arr[y0 * TW + x0], b = arr[y0 * TW + x1], c = arr[y1 * TW + x0], d = arr[y1 * TW + x1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }

  /* draw(canvas, {elongation, phaseAngle, south, earthshine, libration})
     elongation: 0..360 (graus); phaseAngle: ângulo Sol-Lua-Terra (graus, 0 = cheia) */
  const cache = new Map();
  function draw(cv, o) {
    if (!albedo) build();
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    const css = cv.clientWidth || cv.width;
    const N = Math.max(16, Math.round(css * dpr));
    if (cv.width !== N) { cv.width = N; cv.height = N; }
    const ctx = cv.getContext('2d');
    // luas pequenas (calendário, faixa, linha do tempo) são reaproveitadas: mesma fase em 0,5° = mesma imagem
    const key = N <= 160 && !o.libration ? N + '|' + Math.round((o.elongation ?? 0) * 2) + '|' + (o.south ? 1 : 0) + '|' + Math.round(o.phaseAngle ?? -1) : null;
    if (key && cache.has(key)) { ctx.clearRect(0, 0, N, N); ctx.drawImage(cache.get(key), 0, 0); return; }
    const img = ctx.createImageData(N, N), px = img.data;
    const i = (o.phaseAngle ?? Math.abs(180 - o.elongation)) * Math.PI / 180;
    const waxing = (o.elongation ?? 90) < 180;
    // vetor da luz no referencial de visão (x direita, y cima, z para o observador), Norte para cima
    let Lx = Math.sin(i) * (waxing ? 1 : -1), Ly = 0, Lz = Math.cos(i);
    const flip = !!o.south;
    const R = N / 2 - 1, lib = (o.libration || 0);
    const bump = N > 120 ? 0.9 : N > 60 ? 0.5 : 0.2;
    const es = o.earthshine ?? 0.05;
    for (let py = 0; py < N; py++) {
      for (let pxl = 0; pxl < N; pxl++) {
        let x = (pxl + 0.5 - N / 2) / R, y = -(py + 0.5 - N / 2) / R;
        const r2 = x * x + y * y, k = (py * N + pxl) * 4;
        if (r2 > 1) { px[k + 3] = 0; continue; }
        if (flip) { x = -x; y = -y; } // observador no hemisfério Sul
        const z = Math.sqrt(1 - r2);
        const lon = Math.atan2(x, z) * 57.2958 + lib, lat = Math.asin(y) * 57.2958;
        const u = (lon + 180) * TW / 360 - 0.5, v = (90 - lat) * TH / 180 - 0.5;
        const a = sample(albedo, u, v);
        const hx = sample(height, u + 1, v) - sample(height, u - 1, v), hy = sample(height, u, v - 1) - sample(height, u, v + 1);
        let nx = x - Math.max(-.25, Math.min(.25, hx * bump * 0.08)), ny = y + Math.max(-.25, Math.min(.25, hy * bump * 0.08)), nz = z;
        const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
        const mu0 = nx * Lx + ny * Ly + nz * Lz, mu = z;
        let lit = mu0 > 0 ? (2 * mu0 / (mu0 + mu)) * 0.98 : 0;
        const term = Math.max(0, Math.min(1, (mu0 + 0.015) / 0.05)); // terminador suave
        lit *= term;
        const night = es * (1 - term);
        const val = a * lit;
        // tom levemente quente na luz, azulado na luz cinérea
        const edge = Math.min(1, (1 - Math.sqrt(r2)) * R * 0.9);
        px[k] = Math.min(255, (val * 252 + a * night * 150) * 1.0);
        px[k + 1] = Math.min(255, (val * 246 + a * night * 165));
        px[k + 2] = Math.min(255, (val * 232 + a * night * 200));
        px[k + 3] = Math.round(255 * Math.max(0, Math.min(1, edge)));
      }
    }
    ctx.putImageData(img, 0, 0);
    if (key) { if (cache.size > 300) cache.clear(); const c = document.createElement('canvas'); c.width = c.height = N; c.getContext('2d').putImageData(img, 0, 0); cache.set(key, c); }
  }

  root.MoonRender = { draw, warm: () => { if (!albedo) build(); } };
})(window);
