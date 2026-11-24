/* Camada ambiental do Cardume.
   Cada valor sai com a sua ORIGEM:
     a = fonte externa medida/prevista (aqui: cálculo astronômico, que é exato)
     b = estimativa de modelo (maré harmônica simplificada, atividade, índice)
     s = SIMULADO (clima e mar enquanto a integração com Open-Meteo/Marinha não está ligada)
   Nada simulado é apresentado como medição. */
(function (root) {
  const A = root.Astro;
  const TZ = 'America/Sao_Paulo';
  const H = 3600e3, D = 864e5;

  // início do dia local (Brasil sem horário de verão desde 2019: UTC−3 fixo em SP/RJ)
  function dayStart(date, offsetH = -3) {
    const t = date.getTime() + offsetH * H;
    return Math.floor(t / D) * D - offsetH * H;
  }

  // ---------- clima SIMULADO (determinístico por ponto e hora) ----------
  function seed(lat, lon) { return Math.abs(Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453) % 1; }
  function smooth(t, s, periods) { let v = 0; periods.forEach(([p, a], i) => { v += a * Math.sin((t / p) * 2 * Math.PI + s * 6.28 * (i + 1)); }); return v; }

  function simWeather(spot, date) {
    const s = seed(spot.lat, spot.lon), th = date.getTime() / H;
    const localH = ((date.getUTCHours() - 3 + 24) % 24) + date.getUTCMinutes() / 60;
    const diurnal = Math.cos(((localH - 15) / 24) * 2 * Math.PI); // pico às 15h
    const synoptic = smooth(th, s, [[97, 1], [53, .6], [31, .35]]);
    const temp = 25.5 + 3.4 * diurnal + 1.8 * synoptic;
    const wind = Math.max(1.5, 10 + 6 * Math.sin(((localH - 14) / 24) * 2 * Math.PI) + 5 * smooth(th, s + .3, [[41, 1], [17, .4]]));
    const windDir = (110 + 70 * smooth(th, s + .5, [[61, 1], [23, .3]]) + (localH > 10 && localH < 19 ? 40 : -20) + 360) % 360;
    const pressure = 1013.5 + 4.2 * smooth(th, s + .7, [[120, 1], [46, .4]]);
    const pPrev = 1013.5 + 4.2 * smooth(th - 3, s + .7, [[120, 1], [46, .4]]);
    const humidity = Math.min(98, Math.max(48, 76 - 12 * diurnal + 8 * synoptic));
    const cloud = Math.min(100, Math.max(0, 45 + 40 * smooth(th, s + .9, [[37, 1], [13, .5]])));
    const rainProb = Math.round(Math.min(95, Math.max(0, (cloud - 55) * 1.6 + (1012 - pressure) * 6)));
    const rainMm = rainProb > 50 ? +((rainProb - 50) / 18).toFixed(1) : 0;
    const uv = localH > 6 && localH < 18 ? Math.max(0, Math.round(11 * Math.sin(((localH - 6) / 12) * Math.PI) * (1 - cloud / 160))) : 0;
    const feels = temp + (humidity - 60) * 0.06 - wind * 0.05;
    return {
      temp: +temp.toFixed(1), feels: +feels.toFixed(1), wind: +wind.toFixed(0), gust: +(wind * 1.45 + 3).toFixed(0), windDir: Math.round(windDir),
      pressure: +pressure.toFixed(1), pTrend: pressure - pPrev, humidity: Math.round(humidity), cloud: Math.round(cloud), rainProb, rainMm,
      vis: cloud > 85 ? 6 : 10, uv,
      waveH: +(0.6 + 0.5 * (1 + smooth(th, s + 1.2, [[71, 1], [29, .4]])) * (spot.water === 'doce' ? 0 : 1) * (spot.sheltered ? .3 : 1)).toFixed(1),
      waveT: Math.round(7 + 3 * (1 + smooth(th, s + 1.5, [[83, 1]]))), waveDir: Math.round((150 + 40 * smooth(th, s + 1.7, [[90, 1]]) + 360) % 360),
      waterT: +(23.2 + 1.2 * smooth(th / 24, s, [[9, 1]]) + (spot.water === 'doce' ? 1.5 : 0)).toFixed(1),
      current: +(0.2 + 0.25 * Math.abs(smooth(th, s + 2, [[12.42, 1]]))).toFixed(1),
      origin: 's'
    };
  }

  // ---------- CLIMA E MAR REAIS (Open-Meteo) ----------
  // Fora do Claude o app busca a previsão real; dentro dele a rede é bloqueada e fica o simulado.
  const REAL = new Map(), PENDING = new Map(), LS = 'cardume.wx.';
  const rk = (s) => s.lat.toFixed(2) + ',' + s.lon.toFixed(2);
  const idx = (blk, t) => { if (!blk || !blk.time) return -1; const i = Math.floor((t / 1000 - blk.time[0]) / 3600); return i >= 0 && i < blk.time.length ? i : -1; };
  function weather(spot, date) {
    const w = simWeather(spot, date);
    const r = REAL.get(rk(spot)); if (!r) return w;
    const t = date.getTime(), f = r.fc, i = idx(f, t);
    if (i >= 0 && f.temperature_2m[i] != null) {
      const g = (k) => f[k] && f[k][i];
      Object.assign(w, { temp: g('temperature_2m'), feels: g('apparent_temperature') ?? g('temperature_2m'), wind: Math.round(g('wind_speed_10m')), gust: Math.round(g('wind_gusts_10m') ?? g('wind_speed_10m')), windDir: Math.round(g('wind_direction_10m')),
        pressure: +(+g('pressure_msl')).toFixed(1), pTrend: i >= 3 && f.pressure_msl[i - 3] != null ? g('pressure_msl') - f.pressure_msl[i - 3] : 0, humidity: Math.round(g('relative_humidity_2m')), cloud: Math.round(g('cloud_cover')),
        rainProb: Math.round(g('precipitation_probability') ?? 0), rainMm: +(+(g('precipitation') ?? 0)).toFixed(1), vis: g('visibility') != null ? Math.round(g('visibility') / 1000) : w.vis, uv: Math.round(g('uv_index') ?? 0), origin: 'a', fetchedAt: r.at, cellKm: r.fcKm });
    }
    const m = r.mar, j = idx(m, t);
    if (spot.water !== 'doce' && j >= 0 && m.wave_height && m.wave_height[j] != null) {
      Object.assign(w, { waveH: +(+m.wave_height[j]).toFixed(1), waveT: Math.round(m.wave_period[j] ?? w.waveT), waveDir: Math.round(m.wave_direction[j] ?? w.waveDir),
        waterT: m.sea_surface_temperature && m.sea_surface_temperature[j] != null ? +(+m.sea_surface_temperature[j]).toFixed(1) : w.waterT,
        current: m.ocean_current_velocity && m.ocean_current_velocity[j] != null ? +(m.ocean_current_velocity[j] / 1.852).toFixed(1) : w.current, marine: 'a', marKm: r.marKm });
    } else w.marine = 's';
    return w;
  }
  const near = (resp, spot) => resp && resp.latitude != null ? distKm(spot, { lat: resp.latitude, lon: resp.longitude }) : null;
  async function ensureReal(spot) {
    if (!spot || spot.lat == null) return false;
    const k = rk(spot), cur = REAL.get(k);
    if (cur && Date.now() - cur.at < 3600e3) return false;
    if (!cur) { try { const c = JSON.parse(localStorage.getItem(LS + k) || 'null'); if (c && Date.now() - c.at < 12 * 3600e3) { REAL.set(k, c); memo.clear(); if (Date.now() - c.at < 3600e3) return true; } } catch { } }
    if (PENDING.has(k)) return PENDING.get(k);
    const job = (async () => {
      const ll = `latitude=${spot.lat.toFixed(4)}&longitude=${spot.lon.toFixed(4)}`, common = '&past_days=1&forecast_days=8&timezone=UTC&timeformat=unixtime';
      try {
        const [a, b] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?${ll}&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,uv_index&wind_speed_unit=kmh${common}`).then((r) => r.ok ? r.json() : null),
          spot.water === 'doce' ? null : fetch(`https://marine-api.open-meteo.com/v1/marine?${ll}&hourly=wave_height,wave_period,wave_direction,sea_surface_temperature,ocean_current_velocity${common}`).then((r) => r.ok ? r.json() : null).catch(() => null)
        ]);
        if (!a || !a.hourly) return false;
        const rec = { at: Date.now(), fc: a.hourly, mar: b && b.hourly, fcKm: near(a, spot), marKm: near(b, spot) };
        REAL.set(k, rec); memo.clear();
        try { localStorage.setItem(LS + k, JSON.stringify(rec)); } catch { }
        return true;
      } catch { return false; } finally { PENDING.delete(k); }
    })();
    PENDING.set(k, job); return job;
  }
  const hasReal = (spot) => !!REAL.get(rk(spot));

  // ---------- MARÉ: modelo harmônico simplificado ligado à Lua e ao Sol reais ----------
  // Amplitudes aproximadas da Baía de Guanabara (ordem de grandeza). A fase de sizígia/quadratura
  // segue a posição real da Lua; os horários absolutos não substituem a tábua oficial da Marinha (DHN).
  const TIDE_REF = { name: 'Ilha Fiscal (referência)', lat: -22.8967, lon: -43.1667 };
  function tideAt(spot, date) {
    const lat = TIDE_REF.lat, lon = TIDE_REF.lon;
    const m = A.moonPos(date, lat, lon), s = A.sunPos(date, lat, lon);
    const lag = 1.15; // atraso local (rad) da maré em relação à passagem da Lua
    const h = 0.72 + 0.31 * Math.cos(2 * m.H - lag) + 0.17 * Math.cos(2 * s.H - lag - 0.35) + 0.07 * Math.cos(m.H + s.H - 0.6) + 0.1 * Math.cos(m.H - 0.9);
    return h;
  }
  function tideSeries(spot, from, hours = 72, stepMin = 15) {
    const pts = [];
    for (let t = from; t <= from + hours * H; t += stepMin * 60e3) pts.push([t, tideAt(spot, new Date(t))]);
    const ext = [];
    for (let i = 1; i < pts.length - 1; i++) {
      const [t, v] = pts[i];
      if (v > pts[i - 1][1] && v >= pts[i + 1][1]) ext.push({ t, v, type: 'alta' });
      if (v < pts[i - 1][1] && v <= pts[i + 1][1]) ext.push({ t, v, type: 'baixa' });
    }
    return { pts, ext };
  }
  function tideState(spot, date) {
    const a = tideAt(spot, new Date(date.getTime() - 20 * 60e3)), b = tideAt(spot, new Date(date.getTime() + 20 * 60e3));
    const rate = (b - a) / (40 / 60); // m/h
    return { h: tideAt(spot, date), rate, state: Math.abs(rate) < 0.04 ? 'estofo' : rate > 0 ? 'enchente' : 'vazante' };
  }
  function distKm(a, b) {
    const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLon = (b.lon - a.lon) * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  // ---------- ESPÉCIES (perfil comportamental simplificado, para ponderar o modelo) ----------
  const SPECIES = {
    'Robalo-flecha': { water: 'salgada', dawnDusk: 1.3, night: .9, tide: 1.4, moon: 1.1 },
    'Robalo-peva': { water: 'salgada', dawnDusk: 1.3, night: .9, tide: 1.3, moon: 1.1 },
    'Corvina': { water: 'salgada', dawnDusk: .9, night: 1.4, tide: 1.1, moon: 1 },
    'Pescada-amarela': { water: 'salgada', dawnDusk: 1, night: 1.2, tide: 1.2, moon: 1 },
    'Espada': { water: 'salgada', dawnDusk: 1.1, night: 1.3, tide: 1, moon: 1.2 },
    'Xerelete': { water: 'salgada', dawnDusk: 1.3, night: .6, tide: 1.1, moon: .9 },
    'Anchova': { water: 'salgada', dawnDusk: 1.2, night: .7, tide: 1, moon: 1 },
    'Sargo': { water: 'salgada', dawnDusk: 1, night: 1, tide: 1.2, moon: 1 },
    'Tainha': { water: 'salgada', dawnDusk: 1.1, night: .5, tide: 1, moon: .9 },
    'Papa-terra': { water: 'salgada', dawnDusk: 1, night: .8, tide: 1.2, moon: .9 },
    'Bagre': { water: 'salgada', dawnDusk: .9, night: 1.4, tide: .9, moon: .9 },
    'Linguado': { water: 'salgada', dawnDusk: 1, night: .8, tide: 1.2, moon: 1 },
    'Cocoroca': { water: 'salgada', dawnDusk: 1, night: 1, tide: 1, moon: 1 },
    'Parati': { water: 'salgada', dawnDusk: 1.1, night: .7, tide: 1.1, moon: 1 },
    'Tucunaré': { water: 'doce', dawnDusk: 1.3, night: .3, tide: 0, moon: .8 },
    'Tilápia': { water: 'doce', dawnDusk: 1, night: .5, tide: 0, moon: .8 },
    'Traíra': { water: 'doce', dawnDusk: 1.4, night: 1.1, tide: 0, moon: 1 },
    'Pacu': { water: 'doce', dawnDusk: 1, night: .6, tide: 0, moon: .9 },
    'Lambari': { water: 'doce', dawnDusk: 1.1, night: .4, tide: 0, moon: .8 }
  };

  // ---------- ATIVIDADE ESTIMADA (modelo documentado) ----------
  const gauss = (x, s) => Math.exp(-(x * x) / (2 * s * s));
  function dayContext(spot, date) {
    const ds = dayStart(date);
    const moon = A.riseSet(ds, spot.lat, spot.lon, 'moon');
    const sun = A.riseSet(ds, spot.lat, spot.lon, 'sun');
    const tw = A.sunTwilight(ds, spot.lat, spot.lon);
    const mi = A.moonInfo(new Date(ds + 12 * H));
    return { ds, moon, sun, tw, mi };
  }
  function activity(spot, date, ctx, speciesName) {
    ctx = ctx || dayContext(spot, date);
    const sp = SPECIES[speciesName] || { dawnDusk: 1, night: 1, tide: 1, moon: 1 };
    const t = date.getTime(), hr = (x) => x ? (t - x.getTime()) / H : 99;
    const parts = {};
    // solunar (períodos maiores: passagem superior/inferior da Lua; menores: nascer/pôr)
    const major = Math.max(gauss(hr(ctx.moon.transit), .75), gauss(hr(ctx.moon.lowTransit), .75));
    const minor = Math.max(gauss(hr(ctx.moon.rise), .5), gauss(hr(ctx.moon.set), .5));
    parts.solunar = (major * 0.9 + minor * 0.55) * sp.moon;
    // luz (alvorada e crepúsculo)
    parts.luz = Math.max(gauss(hr(ctx.sun.rise) + .3, .9), gauss(hr(ctx.sun.set) - .2, .9)) * sp.dawnDusk;
    const sunAlt = A.sunPos(date, spot.lat, spot.lon).alt;
    parts.noite = sunAlt < -8 ? 0.35 * (sp.night - .7) : 0;
    // maré (movimento da água)
    let tideS = null;
    if (spot.water !== 'doce') { tideS = tideState(spot, date); parts.mare = Math.min(1, Math.abs(tideS.rate) / 0.14) * 0.6 * sp.tide; } else parts.mare = 0;
    // fase da Lua (sizígias)
    const el = ctx.mi.elongation, syz = Math.max(gauss(el, 25), gauss(el - 180, 25), gauss(el - 360, 25));
    parts.fase = syz * 0.22;
    // tempo (SIMULADO enquanto a API não está ligada)
    const w = weather(spot, date);
    parts.tempo = (w.pTrend < -0.3 && w.pTrend > -2 ? 0.15 : w.pTrend <= -2 ? -0.1 : 0) - Math.max(0, (w.wind - 22) / 40);
    const raw = 0.08 + parts.solunar * 0.26 + parts.luz * 0.24 + parts.noite + parts.mare * 0.3 + parts.fase * 0.6 + parts.tempo;
    return { score: Math.round(Math.max(3, Math.min(100, raw * 100))), parts, tide: tideS, w };
  }
  function dayActivity(spot, date, speciesName) {
    const ctx = dayContext(spot, date);
    const hours = [];
    for (let h = 0; h < 24; h++) hours.push(activity(spot, new Date(ctx.ds + (h + .5) * H), ctx, speciesName).score);
    // melhor janela contínua de 3h
    let best = 0, bi = 0;
    for (let i = 0; i <= 21; i++) { const s = hours[i] + hours[i + 1] + hours[i + 2]; if (s > best) { best = s; bi = i; } }
    return { ctx, hours, best: { from: bi, to: bi + 3, avg: Math.round(best / 3) } };
  }
  // Índice de pesca 0–100: 75% atividade média da melhor janela de 3h + 25% conforto/segurança
  function fishingIndex(spot, date, speciesName) {
    const da = dayActivity(spot, date, speciesName);
    const now = activity(spot, date, da.ctx, speciesName);
    const w = now.w;
    const comfort = 1 - Math.min(1, Math.max(0, (w.wind - 18) / 25)) * .6 - Math.min(1, w.rainProb / 100) * .25 - (w.waveH > 2 ? .3 : 0);
    const idx = Math.round(Math.max(0, Math.min(100, da.best.avg * 0.75 + comfort * 25)));
    return { idx, da, now, comfort };
  }
  function verdict(v) { return v >= 80 ? 'Excelente' : v >= 65 ? 'Boa' : v >= 45 ? 'Regular' : v >= 25 ? 'Fraca' : 'Desfavorável'; }

  const fmt = {
    time: (d) => d ? new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d) : '—',
    day: (d) => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, weekday: 'short', day: '2-digit', month: 'short' }).format(d).replace(/\./g, ''),
    dayLong: (d) => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(d),
    dm: (d) => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit' }).format(d),
    dir: (deg) => ['N', 'NNE', 'NE', 'ENE', 'L', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'][Math.round(deg / 22.5) % 16],
    n: (v, d = 0) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }),
    ago: (ts) => { const s = (Date.now() - ts) / 1000; if (s < 60) return 'agora'; if (s < 3600) return `há ${Math.floor(s / 60)} min`; if (s < 86400) return `há ${Math.floor(s / 3600)} h`; const d = Math.floor(s / 86400); return d === 1 ? 'ontem' : `há ${d} dias`; }
  };

  // cache por ponto/espécie/hora: o índice e a curva do dia só mudam de hora em hora
  const memo = new Map();
  const cached = (fn, name) => (spot, date, sp) => {
    const k = name + '|' + spot.lat.toFixed(4) + ',' + spot.lon.toFixed(4) + '|' + (spot.water || '') + '|' + (sp || '') + '|' + Math.floor(date.getTime() / H);
    if (memo.has(k)) return memo.get(k);
    if (memo.size > 400) memo.clear();
    const v = fn(spot, date, sp); memo.set(k, v); return v;
  };
  const fishingIndexC = cached(fishingIndex, 'fi'), dayActivityC = cached(dayActivity, 'da');
  root.Env = { weather, ensureReal, hasReal, tideAt, tideSeries, tideState, TIDE_REF, distKm, SPECIES, activity, dayActivity: dayActivityC, dayContext, fishingIndex: fishingIndexC, verdict, dayStart, fmt, TZ, H, D };
})(window);
