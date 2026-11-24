/* Maré Alta · motor astronômico
   Algoritmos de posição do Sol e da Lua baseados em J. Meeus,
   "Astronomical Algorithms" (séries truncadas). Precisão típica:
   posição da Lua ~0,1°, horários de fase ~±10 min, nascer/pôr ~±2 min.
   Tudo é calculado no aparelho, para a data e a coordenada pedidas. */
(function (root) {
  const PI = Math.PI, rad = PI / 180, dayMs = 864e5;
  const J2000 = 2451545;
  const norm360 = (x) => ((x % 360) + 360) % 360;
  const jd = (date) => date.getTime() / dayMs + 2440587.5;
  const fromJd = (j) => new Date((j - 2440587.5) * dayMs);
  const sin = (d) => Math.sin(d * rad), cos = (d) => Math.cos(d * rad);

  function obliquity(T) { return 23.439291 - 0.0130042 * T; }

  // Sol: longitude eclíptica aparente (graus) e distância (UA)
  function sunEcl(j) {
    const T = (j - J2000) / 36525;
    const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    const M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
    const e = 0.016708634 - 0.000042037 * T;
    const C = (1.914602 - 0.004817 * T) * sin(M) + (0.019993 - 0.000101 * T) * sin(2 * M) + 0.000289 * sin(3 * M);
    const v = M + C;
    const R = (1.000001018 * (1 - e * e)) / (1 + e * cos(v));
    const omega = 125.04 - 1934.136 * T;
    const lambda = L0 + C - 0.00569 - 0.00478 * sin(omega);
    return { lon: norm360(lambda), lat: 0, dist: R * 149597870.7, T };
  }

  // Lua: série principal de Meeus cap. 47 (termos mais fortes)
  function moonEcl(j) {
    const T = (j - J2000) / 36525;
    const Lp = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T);
    const D = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T);
    const M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
    const Mp = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T);
    const F = norm360(93.272095 + 483202.0175233 * T - 0.0036539 * T * T);
    const E = 1 - 0.002516 * T;
    // [D, M, M', F, coef longitude (1e-6 grau), coef distância (1e-3 km)]
    const LR = [
      [0,0,1,0,6288774,-20905355],[2,0,-1,0,1274027,-3699111],[2,0,0,0,658314,-2955968],
      [0,0,2,0,213618,-569925],[0,1,0,0,-185116,48888],[0,0,0,2,-114332,-3149],
      [2,0,-2,0,58793,246158],[2,-1,-1,0,57066,-152138],[2,0,1,0,53322,-170733],
      [2,-1,0,0,45758,-204586],[0,1,-1,0,-40923,-129620],[1,0,0,0,-34720,108743],
      [0,1,1,0,-30383,104755],[2,0,0,-2,15327,10321],[0,0,1,2,-12528,0],
      [0,0,1,-2,10980,79661],[4,0,-1,0,10675,-34782],[0,0,3,0,10034,-23210],
      [4,0,-2,0,8548,-21636],[2,1,-1,0,-7888,24208],[2,1,0,0,-6766,30824],
      [1,0,-1,0,-5163,-8379],[1,1,0,0,4987,-16675],[2,-1,1,0,4036,-12831],
      [2,0,2,0,3994,-10445],[4,0,0,0,3861,-11650],[2,0,-3,0,3665,14403],
      [0,1,-2,0,-2689,-7003],[2,0,-1,2,-2602,0],[2,-1,-2,0,2390,10056],
      [1,0,1,0,-2348,6322],[2,-2,0,0,2236,-9884],[0,1,2,0,-2120,5751],
      [0,2,0,0,-2069,0],[2,-2,-1,0,2048,-4950],[2,0,1,-2,-1773,4130],
      [2,0,0,2,-1595,0],[4,-1,-1,0,1215,-3958],[0,0,2,2,-1110,0],
      [3,0,-1,0,-892,3258],[2,1,1,0,-810,2616],[4,-1,-2,0,759,-1897],
      [0,2,-1,0,-713,-2117],[2,2,-1,0,-700,2354],[2,1,-2,0,691,0],
      [2,-1,0,-2,596,0],[4,0,1,0,549,-1423],[0,0,4,0,537,-1117],
      [4,-1,0,0,520,-1571],[1,0,-2,0,-487,-1739],[2,1,0,-2,-399,0],
      [0,0,2,-2,-381,-4421],[1,1,1,0,351,0],[3,0,-2,0,-340,0],
      [4,0,-3,0,330,0],[2,-1,2,0,327,0],[0,2,1,0,-323,1165],
      [1,1,-1,0,299,0],[2,0,3,0,294,0],[2,0,-1,-2,0,8752]
    ];
    const B = [
      [0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],
      [2,0,-1,1,55413],[2,0,-1,-1,46271],[2,0,0,1,32573],[0,0,2,1,17198],
      [2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],
      [2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],[2,-1,0,1,2211],
      [2,-1,-1,-1,2065],[0,1,-1,-1,-1870],[4,0,-1,-1,1828],[0,1,0,1,-1794]
    ];
    let sl = 0, sr = 0, sb = 0;
    for (const [d, m, mp, f, cl, cr] of LR) {
      const arg = d * D + m * M + mp * Mp + f * F;
      const ef = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
      sl += cl * ef * sin(arg);
      sr += cr * ef * cos(arg);
    }
    for (const [d, m, mp, f, cb] of B) {
      const ef = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
      sb += cb * ef * sin(d * D + m * M + mp * Mp + f * F);
    }
    const A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.29 * T, A3 = 313.45 + 481266.484 * T;
    sl += 3958 * sin(A1) + 1962 * sin(Lp - F) + 318 * sin(A2);
    sb += -2235 * sin(Lp) + 382 * sin(A3) + 175 * sin(A1 - F) + 175 * sin(A1 + F) + 127 * sin(Lp - Mp) - 115 * sin(Lp + Mp);
    const omega = 125.04 - 1934.136 * T;
    return { lon: norm360(Lp + sl / 1e6 - 0.00478 * sin(omega)), lat: sb / 1e6, dist: 385000.56 + sr / 1000, T };
  }

  function eclToEq(lon, lat, T) {
    const e = obliquity(T);
    const ra = Math.atan2(sin(lon) * cos(e) - Math.tan(lat * rad) * sin(e), cos(lon));
    const dec = Math.asin(sin(lat) * cos(e) + cos(lat) * sin(e) * sin(lon));
    return { ra, dec }; // radianos
  }
  function gmst(j) {
    const T = (j - J2000) / 36525;
    return norm360(280.46061837 + 360.98564736629 * (j - J2000) + 0.000387933 * T * T) * rad;
  }
  function horizontal(eq, j, lat, lon, distKm) {
    const H = gmst(j) + lon * rad - eq.ra, phi = lat * rad;
    let alt = Math.asin(Math.sin(phi) * Math.sin(eq.dec) + Math.cos(phi) * Math.cos(eq.dec) * Math.cos(H));
    if (distKm) alt -= Math.asin(6378.14 / distKm) * Math.cos(alt); // paralaxe (Lua)
    const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(eq.dec) * Math.cos(phi));
    return { alt: alt / rad, az: norm360(az / rad + 180), H };
  }

  function sunPos(date, lat, lon) {
    const j = jd(date), s = sunEcl(j);
    return horizontal(eclToEq(s.lon, 0, s.T), j, lat, lon);
  }
  function moonPos(date, lat, lon) {
    const j = jd(date), m = moonEcl(j);
    return { ...horizontal(eclToEq(m.lon, m.lat, m.T), j, lat, lon, m.dist), dist: m.dist };
  }

  // Elongação em longitude (0 nova, 90 crescente, 180 cheia, 270 minguante)
  function elong(j) { return norm360(moonEcl(j).lon - sunEcl(j).lon); }

  function moonInfo(date) {
    const j = jd(date), m = moonEcl(j), s = sunEcl(j);
    const el = norm360(m.lon - s.lon);
    const cosPsi = cos(m.lat) * cos(m.lon - s.lon);
    const psi = Math.acos(cosPsi);
    const i = Math.atan2(s.dist * Math.sin(psi), m.dist - s.dist * cosPsi); // ângulo de fase
    const fraction = (1 + Math.cos(i)) / 2;
    const prevNew = findPhase(date, 0, -1);
    const age = (date - prevNew) / dayMs;
    return { fraction, elongation: el, phaseAngle: i / rad, waxing: el < 180, dist: m.dist, age, name: phaseName(el), prevNew };
  }

  function phaseName(el) {
    if (el < 6 || el >= 354) return 'Lua nova';
    if (el < 84) return 'Crescente côncava';
    if (el < 96) return 'Quarto crescente';
    if (el < 174) return 'Crescente gibosa';
    if (el < 186) return 'Lua cheia';
    if (el < 264) return 'Minguante gibosa';
    if (el < 276) return 'Quarto minguante';
    return 'Minguante côncava';
  }

  // Encontra o instante em que a elongação atinge `target` (graus), à frente (dir=1) ou atrás (-1)
  function findPhase(date, target, dir = 1) {
    const f = (j) => { let d = norm360(elong(j) - target); return d > 180 ? d - 360 : d; };
    let j0 = jd(date), step = 0.5 * dir, a = j0, fa = f(a);
    for (let k = 0; k < 80; k++) {
      const b = a + step, fb = f(b);
      const crosses = dir > 0 ? (fa < 0 && fb >= 0) : (fa >= 0 && fb < 0) || (fa > 0 && fb <= 0);
      if (crosses && Math.abs(fa - fb) < 90) {
        let lo = dir > 0 ? a : b, hi = dir > 0 ? b : a;
        for (let n = 0; n < 40; n++) { const mid = (lo + hi) / 2; if (f(mid) < 0) lo = mid; else hi = mid; }
        return fromJd((lo + hi) / 2);
      }
      a = b; fa = fb;
    }
    return null;
  }

  function nextPhases(date, count = 8) {
    const out = []; let t = date;
    const names = { 0: 'Lua nova', 90: 'Quarto crescente', 180: 'Lua cheia', 270: 'Quarto minguante' };
    while (out.length < count) {
      const cands = [0, 90, 180, 270].map((tg) => ({ tg, d: findPhase(t, tg, 1) }));
      cands.sort((a, b) => a.d - b.d);
      const c = cands[0];
      out.push({ target: c.tg, name: names[c.tg], date: c.d });
      t = new Date(c.d.getTime() + 3600e3);
    }
    return out;
  }

  // Cruzamentos de altitude ao longo de um dia local (start = 00:00 local em ms UTC)
  function riseSet(startMs, lat, lon, body) {
    const h0 = -0.833; // altitude topocêntrica: refração + semidiâmetro
    const pos = body === 'sun' ? sunPos : moonPos;
    const step = 10 * 60e3, out = { rise: null, set: null, transit: null, transitAlt: -90, lowTransit: null };
    let prevT = startMs, prev = pos(new Date(prevT), lat, lon).alt - h0, lowAlt = 90;
    for (let t = startMs + step; t <= startMs + dayMs; t += step) {
      const p = pos(new Date(t), lat, lon), a = p.alt - h0;
      if (prev < 0 && a >= 0 && !out.rise) out.rise = new Date(prevT + (step * -prev) / (a - prev));
      if (prev >= 0 && a < 0 && !out.set) out.set = new Date(prevT + (step * prev) / (prev - a));
      if (p.alt > out.transitAlt) { out.transitAlt = p.alt; out.transit = new Date(t); }
      if (p.alt < lowAlt) { lowAlt = p.alt; out.lowTransit = new Date(t); }
      prev = a; prevT = t;
    }
    if (out.transit && (out.transit.getTime() - startMs < step || startMs + dayMs - out.transit.getTime() < step)) out.transit = null;
    if (out.lowTransit && (out.lowTransit.getTime() - startMs < step || startMs + dayMs - out.lowTransit.getTime() < step)) out.lowTransit = null;
    return out;
  }

  function sunTwilight(startMs, lat, lon) {
    const step = 5 * 60e3; let dawn = null, dusk = null;
    let prev = sunPos(new Date(startMs), lat, lon).alt + 6;
    for (let t = startMs + step; t <= startMs + dayMs; t += step) {
      const a = sunPos(new Date(t), lat, lon).alt + 6;
      if (prev < 0 && a >= 0 && !dawn) dawn = new Date(t);
      if (prev >= 0 && a < 0 && !dusk) dusk = new Date(t);
      prev = a;
    }
    return { dawn, dusk };
  }

  const api = { jd, fromJd, sunPos, moonPos, moonInfo, findPhase, nextPhases, riseSet, sunTwilight, phaseName, elong, moonEcl, sunEcl };
  if (typeof module !== 'undefined') module.exports = api; else root.Astro = api;
})(typeof window !== 'undefined' ? window : globalThis);
