/* Cardume · mapa hiperlocal e página do ponto */
{
const { $, $$, esc, ic, S } = C;
const { fmt, H, D } = Env;
const LAT0 = -22.93, LON0 = -43.28, K = Math.cos(LAT0 * Math.PI / 180), U = 10000; // 1 unidade ≈ 11 m
const proj = (lat, lon) => [(lon - LON0) * K * U, -(lat - LAT0) * U];
const unproj = (x, y) => [LAT0 - y / U, LON0 + x / (K * U)];
const PLACES = [['Urca', -22.9478, -43.1655], ['Copacabana', -22.9711, -43.1863], ['Ipanema', -22.9838, -43.2058], ['Leblon', -22.9847, -43.2238], ['Botafogo', -22.9519, -43.1844], ['Centro', -22.9068, -43.1729], ['Niterói', -22.9008, -43.1035], ['Icaraí', -22.9056, -43.1103], ['Itaipu', -22.9667, -43.0451], ['Barra da Tijuca', -23.0004, -43.3659], ['Recreio', -23.0187, -43.4636], ['Ilha do Governador', -22.8089, -43.2073], ['São Conrado', -22.9988, -43.2652], ['Flamengo', -22.9330, -43.1760], ['Lagoa', -22.9711, -43.2128], ['Joá', -23.0115, -43.2878], ['Piratininga', -22.9500, -43.0750], ['São Gonçalo', -22.8269, -43.0539], ['Ilha de Paquetá', -22.7600, -43.1080]];
const WATERS = [['Baía de Guanabara', -22.86, -43.16], ['Oceano Atlântico', -23.06, -43.2]];
let LAND = null, landPath = '';

C.loadLand = async () => {
  if (LAND) return LAND;
  try {
    const r = await fetch('data/rio_land.json'); const raw = await r.json();
    LAND = raw.map((poly) => poly.map((ring) => { let x = 0, y = 0; const o = []; for (let i = 0; i < ring.length; i += 2) { x += ring[i]; y += ring[i + 1]; o.push([y / 1e5, x / 1e5]); } return o; }));
    landPath = LAND.map((poly) => poly.map((ring) => 'M' + ring.map(([la, lo]) => proj(la, lo).map((v) => v.toFixed(0)).join(' ')).join('L') + 'Z').join('')).join('');
  } catch { LAND = []; landPath = ''; }
  return LAND;
};

/* ------------ motor de mapa reutilizável ------------ */
C.makeMap = (host, opt = {}) => {
  host.innerHTML = `<div class="mapwrap"><svg class="base" aria-label="Mapa costeiro"><g class="grid"></g><g class="tf"><path class="land" d=""/></g><g class="labels"></g></svg><div class="winds"></div><div class="markers"></div></div>`;
  const wrap = host.firstElementChild, svg = $('svg', wrap), tf = $('.tf', wrap), land = $('.land', wrap), labels = $('.labels', wrap), grid = $('.grid', wrap), mk = $('.markers', wrap), winds = $('.winds', wrap);
  const [cx0, cy0] = proj(opt.lat ?? -22.95, opt.lon ?? -43.18);
  const view = { cx: cx0, cy: cy0, s: opt.scale ?? 0.06 };
  let W = host.clientWidth, Hh = host.clientHeight;
  const toScreen = (lat, lon) => { const [x, y] = proj(lat, lon); return [(x - view.cx) * view.s + W / 2, (y - view.cy) * view.s + Hh / 2]; };
  const toGeo = (sx, sy) => unproj((sx - W / 2) / view.s + view.cx, (sy - Hh / 2) / view.s + view.cy);
  C.loadLand().then(() => { land.setAttribute('d', landPath); update(); });
  function update() {
    W = host.clientWidth; Hh = host.clientHeight;
    const [bx0, by0] = proj(-22.52, -43.80), [bx1, by1] = proj(-23.16, -42.80);
    view.s = Math.max(W / (bx1 - bx0), Hh / (by1 - by0), Math.min(4, view.s));
    view.cx = Math.max(bx0 + W / 2 / view.s, Math.min(bx1 - W / 2 / view.s, view.cx));
    view.cy = Math.max(by0 + Hh / 2 / view.s, Math.min(by1 - Hh / 2 / view.s, view.cy));
    tf.setAttribute('transform', `translate(${W / 2 - view.cx * view.s} ${Hh / 2 - view.cy * view.s}) scale(${view.s})`);
    // grade de coordenadas
    const [la1, lo1] = toGeo(0, 0), [la2, lo2] = toGeo(W, Hh);
    const stepDeg = view.s > 0.8 ? 0.002 : view.s > 0.25 ? 0.005 : view.s > 0.08 ? 0.01 : 0.05;
    let g = '';
    for (let lo = Math.ceil(lo1 / stepDeg) * stepDeg; lo < lo2; lo += stepDeg) { const [x] = toScreen(la1, lo); g += `<line x1="${x}" x2="${x}" y1="0" y2="${Hh}"/>`; }
    for (let la = Math.floor(la1 / stepDeg) * stepDeg; la > la2; la -= stepDeg) { const [, y] = toScreen(la, lo1); g += `<line y1="${y}" y2="${y}" x1="0" x2="${W}"/>`; }
    grid.innerHTML = g;
    // rótulos
    let l = '';
    if (!opt.mini) {
      for (const [n, la, lo] of WATERS) { const [x, y] = toScreen(la, lo); if (x > -100 && x < W + 100 && y > 0 && y < Hh) l += `<text class="water" x="${x}" y="${y}" text-anchor="middle">${esc(n)}</text>`; }
      if (view.s > 0.13) for (const [n, la, lo] of PLACES) { const [x, y] = toScreen(la, lo); if (x > 0 && x < W && y > 0 && y < Hh) l += `<text class="place" x="${x}" y="${y}" text-anchor="middle">${esc(n)}</text>`; }
    }
    labels.innerHTML = l;
    opt.onUpdate && opt.onUpdate(api);
  }
  const api = { wrap, mk, winds, view, toScreen, toGeo, update, size: () => [W, Hh],
    flyTo(lat, lon, s) { const [tx, ty] = proj(lat, lon); const f = { ...view }, ts = s ?? Math.max(view.s, 0.5); const t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 650), e = 1 - Math.pow(1 - k, 3); view.cx = f.cx + (tx - f.cx) * e; view.cy = f.cy + (ty - f.cy) * e; view.s = f.s * Math.pow(ts / f.s, e); update(); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step); } };
  new ResizeObserver(update).observe(host);
  if (!opt.mini) {
    const pts = new Map(); let moved = 0, last = null, pinch = null, lastTap = 0;
    wrap.addEventListener('pointerdown', (e) => { if (e.target.closest('.mk')) return; wrap.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; last = [e.clientX, e.clientY];
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: view.s }; } });
    wrap.addEventListener('pointermove', (e) => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; view.s = pinch.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d; moved = 99; update(); return; }
      const dx = e.clientX - last[0], dy = e.clientY - last[1]; moved += Math.abs(dx) + Math.abs(dy); last = [e.clientX, e.clientY];
      view.cx -= dx / view.s; view.cy -= dy / view.s; update(); });
    const up = (e) => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
      if (moved < 6 && pts.size === 0) { const r = wrap.getBoundingClientRect(); const sx = e.clientX - r.left, sy = e.clientY - r.top; const now = Date.now();
        if (now - lastTap < 300) { const [la, lo] = toGeo(sx, sy); api.flyTo(la, lo, view.s * 2); } else opt.onTap && opt.onTap(...toGeo(sx, sy)); lastTap = now; } };
    wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
    wrap.addEventListener('wheel', (e) => { e.preventDefault(); const r = wrap.getBoundingClientRect(); const sx = e.clientX - r.left, sy = e.clientY - r.top;
      const [la, lo] = toGeo(sx, sy); view.s *= Math.exp(-e.deltaY * 0.0015); update(); const [nx, ny] = toScreen(la, lo); view.cx += (nx - sx) / view.s; view.cy += (ny - sy) / view.s; update(); }, { passive: false });
  }
  setTimeout(update);
  return api;
};

/* ------------ tela MAPA ------------ */
let M = null, tmp = null, selSpot = null;
const LAYERS = [['spots', 'Pontos', 'pin'], ['fishers', 'Pescadores ativos', 'users'], ['catches', 'Capturas 30 dias', 'fish'], ['fav', 'Só favoritos', 'star'], ['wind', 'Vento', 'wind']];
const zl = (kind) => M && M.real ? { spot: 17, place: 14.5, coord: 17, gps: 16 }[kind] : { spot: 1.2, place: 0.25, coord: 1.2, gps: 1.2 }[kind];
S.mapStyle = S.mapStyle || 'ruas';
const STYLES = [['ruas', 'Mapa', 'map'], ['satelite', 'Satélite', 'globe'], ['relevo', 'Relevo', 'mountain'], ['carta', 'Carta offline', 'layers']];
C.views.mapa = (force) => {
  const v = $('#v-mapa');
  const wantReal = S.mapbox === 'ok' && S.mapStyle !== 'carta';
  if (!M || (force && !v.querySelector('.mapwrap')) || !!M.real !== wantReal) {
    const keep = M ? M.toGeo(...M.size().map((x) => x / 2)) : null;
    v.innerHTML = `<div id="mapHost" style="position:absolute;inset:0"></div>
    <div class="mapui"><div class="search">${ic('search')}<input id="mapq" placeholder="Buscar praia, endereço ou “-22.94, -43.16”" autocomplete="off" aria-label="Buscar"><button class="iconbtn" id="mapClear" aria-label="Limpar">${ic('close')}</button></div>
      <div class="results" id="mapRes" hidden></div>
      <div class="layers" id="styles"></div>
      <div class="layers" id="layers"></div></div>
    <div class="mapside"><button class="iconbtn" data-act="mzoom" data-z="1" aria-label="Aproximar">${ic('plus')}</button><button class="iconbtn" data-act="mzoom" data-z="-1" aria-label="Afastar">${ic('minus')}</button><button class="iconbtn" data-act="gps" aria-label="Minha localização">${ic('locate')}</button></div>
    <div class="coordbar num" id="coordbar"></div>`;
    const c = C.cur(), lat = keep ? keep[0] : c.lat, lon = keep ? keep[1] : c.lon;
    M = wantReal
      ? C.makeRealMap($('#mapHost'), { lat, lon, zoom: 14, style: () => S.mapStyle, onUpdate: drawMarkers, onTap: (la, lo) => tapAt(la, lo), onError: (code) => { C.toast(code === 'needs_reauth' ? 'Reconecte o Mapbox em Configurações › Conectores do claude.ai.' : code === 'server_not_connected' || code === 'not_in_manifest' ? 'Mapbox não conectado. Usando a carta offline.' : 'Não foi possível carregar o mapa agora.', 'info'); if (S.mapbox !== 'ok') C.views.mapa(true); } })
      : C.makeMap($('#mapHost'), { lat, lon, scale: 0.09, onUpdate: drawMarkers, onTap: (la, lo) => tapAt(la, lo) });
    $('#mapq').addEventListener('input', searchMap);
    $('#mapq').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const b = $('#mapRes button'); b && b.click(); } });
    $('#mapClear').onclick = () => { $('#mapq').value = ''; $('#mapRes').hidden = true; };
  }
  $('#styles').innerHTML = S.mapbox === 'ok' ? STYLES.map(([k, l, i]) => `<button class="chipbtn ${S.mapStyle === k ? 'on' : ''}" data-act="mstyle" data-k="${k}">${ic(i)}${l}</button>`).join('')
    : `<button class="chipbtn" data-act="mapreal">${ic('globe')}${S.mapbox === 'checking' ? 'Verificando mapa real…' : S.mapbox === 'auth' ? 'Reconectar mapa real (Mapbox)' : 'Ativar mapa real com satélite'}</button>`;
  $('#layers').innerHTML = LAYERS.map(([k, l, i]) => `<button class="chipbtn ${S.layers[k] ? 'on' : ''}" data-act="layer" data-k="${k}">${ic(i)}${l}</button>`).join('');
  drawMarkers(M);
};

function drawMarkers(api) {
  if (!api || !$('#coordbar')) return;
  const [W, Hh] = api.size(); const [la, lo] = api.toGeo(W / 2, Hh / 2);
  $('#coordbar').textContent = `${la.toFixed(5)}, ${lo.toFixed(5)} · ${api.real ? api.scaleLabel() + ' / 100 px' : 'escala ' + (api.view.s > 0.8 ? '~50 m' : api.view.s > 0.25 ? '~200 m' : api.view.s > 0.08 ? '~1 km' : '~5 km')}`;
  let spots = C.allSpots();
  if (S.layers.fav) spots = spots.filter((s) => S.mine.favorites.includes(s.id));
  const pos = spots.map((s) => ({ s, p: api.toScreen(s.lat, s.lon) })).filter(({ p }) => p[0] > -40 && p[0] < W + 40 && p[1] > -40 && p[1] < Hh + 60);
  // agrupamento simples por distância de tela
  const groups = [];
  for (const o of pos) { const g = groups.find((g) => Math.hypot(g.p[0] - o.p[0], g.p[1] - o.p[1]) < 46); if (g) g.items.push(o); else groups.push({ p: o.p, items: [o] }); }
  const since = Date.now() - 30 * D;
  let h = '';
  if (S.layers.spots || S.layers.fav) for (const g of groups) {
    if (g.items.length > 1) { h += `<button class="mk cluster" style="left:${g.p[0]}px;top:${g.p[1]}px" data-act="cluster" data-lat="${g.items[0].s.lat}" data-lon="${g.items[0].s.lon}" aria-label="${g.items.length} pontos"><span class="pin num">${g.items.length}</span></button>`; continue; }
    const s = g.items[0].s, act = S.layers.fishers ? C.activeAt(s.id).length : 0, n = S.layers.catches ? S.posts.filter((p) => p.spotId === s.id && p.ts > since && p.kind !== 'relato').length : 0;
    h += `<button class="mk ${selSpot === s.id ? 'sel' : ''}" style="left:${g.p[0]}px;top:${g.p[1]}px" data-act="mk" data-id="${esc(s.id)}" aria-label="${esc(s.name)}"><span class="pin">${ic(s.private ? 'lock' : 'fish')}${n ? `<span class="num">${n}</span>` : ''}</span>${act ? `<span class="live num">${act}</span>` : ''}<span class="stem"></span>${(api.real ? api.view.z >= 13 : api.view.s > 0.07) ? `<span class="lab">${esc(s.name)}</span>` : ''}</button>`;
  }
  if (tmp) { const p = api.toScreen(tmp.lat, tmp.lon); h += `<span class="mk tmp" style="left:${p[0]}px;top:${p[1]}px"><span class="pin">${ic('pin')}</span><span class="stem"></span></span>`; }
  api.mk.innerHTML = h;
  // camada de vento (simulada)
  let wv = '';
  if (S.layers.wind) { const st = 80; for (let y = 120; y < Hh - 40; y += st) for (let x = 40; x < W; x += st) { const [a, b] = api.toGeo(x, y); const w = Env.weather({ lat: a, lon: b }, new Date()); wv += `<span class="wind" style="left:${x}px;top:${y}px;transform:translate(-50%,-50%) rotate(${w.windDir + 180}deg)"><svg viewBox="0 0 24 24" width="${16 + w.wind}" height="${16 + w.wind}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v18M7 8l5-5 5 5"/></svg></span>`; } }
  api.winds.innerHTML = wv;
}

function tapAt(lat, lon) {
  tmp = { lat, lon }; selSpot = null; drawMarkers(M);
  const near = C.allSpots().map((s) => ({ s, d: Env.distKm({ lat, lon }, s) })).sort((a, b) => a.d - b.d)[0];
  const covered = lat > -23.1 && lat < -22.74 && lon > -43.62 && lon < -42.95;
  C.sheet('Coordenada selecionada', `<div class="pad"><div class="card"><div class="num" style="font-size:20px;font-weight:600">${lat.toFixed(5)}, ${lon.toFixed(5)}</div><div class="xs muted" style="margin-top:4px">Latitude, longitude · WGS84${covered || M.real ? '' : ' · fora da área com carta detalhada'}</div>${S.mapbox === 'ok' ? '<div class="sm" id="revAddr" style="margin-top:8px;color:var(--ink2)">Buscando endereço…</div>' : ''}
    ${near && near.d < 0.15 ? `<div class="banner" style="margin:10px 0 0">${ic('info')}<span>Já existe <b>${esc(near.s.name)}</b> a ${Math.round(near.d * 1000)} m daqui.</span></div>` : ''}</div>
    <div style="display:grid;gap:10px;margin-top:14px">
      <button class="btn block" data-act="coordcond" data-lat="${lat}" data-lon="${lon}">${ic('eye')}Ver condições desta coordenada</button>
      <button class="btn ghost block" data-act="newspot" data-lat="${lat}" data-lon="${lon}">${ic('plus')}Cadastrar ponto de pesca aqui</button>
      ${near && near.d < 0.15 ? `<button class="btn ghost block" data-spot="${esc(near.s.id)}">${ic('pin')}Abrir ${esc(near.s.name)}</button>` : ''}
      <button class="btn ghost block" data-act="copycoord" data-lat="${lat}" data-lon="${lon}">${ic('copy')}Copiar coordenadas</button></div></div>`);
  C.onSheetClose = () => { tmp = null; M && drawMarkers(M); };
  if (S.mapbox === 'ok') C.mbxReverse(lat, lon).then((a) => { const el = $('#revAddr'); if (el) el.textContent = a ? a : 'Endereço não encontrado (provavelmente na água).'; }).catch((e) => { C.mbxFail(e); const el = $('#revAddr'); if (el) el.textContent = ''; });
}

let remoteT, remoteSeq = 0;
function searchMap() {
  const q = $('#mapq').value.trim(), res = $('#mapRes');
  if (!q) { res.hidden = true; return; }
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const items = [];
  const m = q.match(/^\s*(-?\d{1,2}(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)\s*$/);
  if (m) { const la = parseFloat(m[1].replace(',', '.')), lo = parseFloat(m[2].replace(',', '.')); if (Math.abs(la) <= 90 && Math.abs(lo) <= 180) items.push(`<button data-act="gocoord" data-lat="${la}" data-lon="${lo}">${ic('locate')}<span class="grow"><b class="num">${la.toFixed(5)}, ${lo.toFixed(5)}</b><br><span class="xs muted">Ir para coordenada</span></span></button>`); }
  const nq = norm(q);
  for (const s of C.allSpots()) if (norm(s.name + ' ' + (s.region || '')).includes(nq)) items.push(`<button data-act="gospot" data-id="${esc(s.id)}">${ic('fish')}<span class="grow"><b>${esc(s.name)}</b><br><span class="xs muted">${esc(C.kindLabel(s.kind))} · ${esc(s.region || '')}</span></span></button>`);
  for (const [n, la, lo] of PLACES) if (norm(n).includes(nq)) items.push(`<button data-act="gocoord" data-lat="${la}" data-lon="${lo}" data-z="0.25">${ic('pin')}<span class="grow"><b>${esc(n)}</b><br><span class="xs muted">Bairro / região · Rio de Janeiro</span></span></button>`);
  const local = items.slice(0, 6).join('');
  res.innerHTML = local + (S.mapbox === 'ok' && q.length >= 3 && !m ? `<div class="pad xs muted" id="remoteRes" style="padding:10px 14px">Buscando endereços e lugares…</div>` : '') || `<div class="pad sm muted" style="padding:14px">Nada encontrado. Toque no mapa para marcar o ponto exato ou digite coordenadas.</div>`;
  res.hidden = false;
  clearTimeout(remoteT);
  if (S.mapbox === 'ok' && q.length >= 3 && !m) remoteT = setTimeout(async () => {
    const my = ++remoteSeq, [W, Hh] = M.size(), [la, lo] = M.toGeo(W / 2, Hh / 2);
    try {
      const hits = await C.mbxSearch(q, { lat: la, lon: lo }); if (my !== remoteSeq) return;
      const box = $('#remoteRes'); if (!box) return;
      box.outerHTML = hits.length ? hits.map((h) => `<button data-act="gocoord" data-lat="${h.lat}" data-lon="${h.lon}">${ic('pin')}<span class="grow"><b>${esc(h.name)}</b><br><span class="xs muted">${esc(h.addr)}</span></span><span class="xs dim">Mapbox</span></button>`).join('') : '<div class="pad xs muted" style="padding:10px 14px">Nenhum endereço encontrado.</div>';
      if (!local && !hits.length) res.innerHTML = `<div class="pad sm muted" style="padding:14px">Nada encontrado. Toque no mapa para marcar o ponto exato.</div>`;
    } catch (e) { C.mbxFail(e); const box = $('#remoteRes'); if (box) box.textContent = 'Busca de endereços indisponível agora.'; }
  }, 380);
}
function mapRealInfo() {
  C.sheet('Mapa real com satélite', `<div class="pad sm" style="line-height:1.6">
    <p style="margin-top:0">O mapa de ruas, a imagem de satélite e a busca de endereços vêm do <b>Mapbox</b>, o mesmo provedor de mapas usado por apps como Strava e Instagram, com precisão de nível de rua.</p>
    <p>Para ativar, conecte o <b>Mapbox</b> na sua conta: <b>claude.ai › Configurações › Conectores › Mapbox</b> (é preciso uma conta gratuita do Mapbox). Depois, volte aqui e toque em "Tentar de novo".</p>
    <p class="muted">Enquanto isso, a carta offline continua funcionando, com a costa do IBGE e as coordenadas exatas do toque.</p>
    <button class="btn block" id="mbxRetry">${ic('globe')}Tentar de novo</button></div>`, (b) => {
    $('#mbxRetry', b).onclick = async () => { S.mapbox = 'checking'; await C.mbxCheck(); C.closeSheet(); C.toast(S.mapbox === 'ok' ? 'Mapa real ativado' : 'Mapbox ainda não está conectado', S.mapbox === 'ok' ? 'globe' : 'info'); C.views.mapa(true); };
  });
}

C.mapAct = (t) => {
  const a = t.dataset.act;
  if (a === 'layer') { S.layers[t.dataset.k] = !S.layers[t.dataset.k]; C.views.mapa(); return true; }
  if (a === 'mzoom') { if (M.real) M.zoomBy(+t.dataset.z); else { M.view.s *= +t.dataset.z > 0 ? 1.6 : .62; M.update(); } return true; }
  if (a === 'mstyle') { S.mapStyle = t.dataset.k; C.views.mapa(); if (M.real) M.refresh(); return true; }
  if (a === 'mapreal') { mapRealInfo(); return true; }
  if (a === 'cluster') { M.flyTo(+t.dataset.lat, +t.dataset.lon, M.real ? M.view.z + 2 : M.view.s * 2.5); return true; }
  if (a === 'mk') { selSpot = t.dataset.id; drawMarkers(M); spotPreview(C.spot(t.dataset.id)); return true; }
  if (a === 'gospot') { const s = C.spot(t.dataset.id); $('#mapRes').hidden = true; $('#mapq').blur(); M.flyTo(s.lat, s.lon, zl('spot')); selSpot = s.id; setTimeout(() => spotPreview(s), 400); return true; }
  if (a === 'gocoord') { $('#mapRes').hidden = true; $('#mapq').blur(); const la = +t.dataset.lat, lo = +t.dataset.lon; M.flyTo(la, lo, zl(t.dataset.z ? 'place' : 'coord')); if (!t.dataset.z || t.dataset.tap) setTimeout(() => tapAt(la, lo), 650); return true; }
  if (a === 'gps') {
    if (!navigator.geolocation) { C.toast('GPS indisponível neste navegador.', 'locate'); return true; }
    navigator.geolocation.getCurrentPosition((p) => { M.flyTo(p.coords.latitude, p.coords.longitude, zl('gps')); tapAt(p.coords.latitude, p.coords.longitude); },
      () => C.toast('O GPS está bloqueado nesta visualização. Digite coordenadas na busca ou toque no mapa (no app nativo o GPS é usado direto).', 'locate'), { timeout: 8000 });
    return true;
  }
  if (a === 'copycoord') { navigator.clipboard?.writeText(`${(+t.dataset.lat).toFixed(5)}, ${(+t.dataset.lon).toFixed(5)}`).then(() => C.toast('Coordenadas copiadas', 'copy'), () => C.toast('Não foi possível copiar', 'copy')); return true; }
  if (a === 'coordcond') { C.closeSheet(); C.openSpot(null, { id: null, name: `Coordenada ${(+t.dataset.lat).toFixed(4)}, ${(+t.dataset.lon).toFixed(4)}`, lat: +t.dataset.lat, lon: +t.dataset.lon, kind: 'coordenada', water: 'salgada', region: 'Ponto livre' }); return true; }
  if (a === 'newspot') { C.newSpotForm(+t.dataset.lat, +t.dataset.lon); return true; }
  return false;
};

function spotPreview(s) {
  if (!s) return;
  const fi = Env.fishingIndex(s, new Date(), S.species), act = C.activeAt(s.id).length;
  const n7 = S.posts.filter((p) => p.spotId === s.id && p.ts > Date.now() - 7 * D).length;
  C.sheet(s.name, `<div class="pad"><div class="sm muted">${esc(C.kindLabel(s.kind))} · ${esc(s.region || '')} · <span class="num">${s.lat.toFixed(5)}, ${s.lon.toFixed(5)}</span></div>
   <div class="cond" style="margin:14px 0 0"><div><span>Índice agora</span><b class="num">${fi.idx} · ${Env.verdict(fi.idx)}</b><em>${C.src('b')}</em></div><div><span>Melhor janela</span><b class="num">${C.hh(fi.da.best.from)}–${C.hh(fi.da.best.to)}</b><em>${C.src('b')}</em></div>
   <div><span>Ativos agora</span><b class="num">${act}</b><em>${C.src('c', 'Presença')}</em></div><div><span>Registros 7 dias</span><b class="num">${n7}</b><em>${C.src('c')}</em></div></div>
   <button class="btn block" style="margin-top:14px" data-spot="${esc(s.id)}">Abrir ponto</button></div>`);
  C.onSheetClose = () => { selSpot = null; M && drawMarkers(M); };
}

/* ------------ página do PONTO ------------ */
C.openSpot = (id, virtual) => {
  const s = id ? C.spot(id) : virtual; if (!s) { C.toast('Ponto não encontrado', 'pin'); return; }
  S.openSpot = s.id || '__virtual'; S.virtualSpot = virtual || null;
  C.page('<div id="spotPage"></div>');
  C.refreshSpot(true);
};
C.refreshSpot = (first) => {
  const host = $('#spotPage'); if (!host) return;
  const s = S.openSpot === '__virtual' ? S.virtualSpot : C.spot(S.openSpot); if (!s) return;
  const y = $('#pageBody').scrollTop, now = new Date();
  const fi = Env.fishingIndex(s, now, S.species), w = fi.now.w, ctx = fi.da.ctx, mi = Astro.moonInfo(now);
  const tide = s.water !== 'doce' ? Env.tideState(s, now) : null;
  const ser = tide ? Env.tideSeries(s, now.getTime(), 30) : null;
  const hi = ser && ser.ext.find((e) => e.type === 'alta'), lo = ser && ser.ext.find((e) => e.type === 'baixa');
  const fav = s.id && S.mine.favorites.includes(s.id), act = s.id ? C.activeAt(s.id) : [], mineHere = S.mine.session && S.mine.session.spotId === s.id;
  const range = S.histRange, since = Date.now() - range * D;
  const all = s.id ? S.posts.filter((p) => p.spotId === s.id) : [];
  const posts = all.filter((p) => p.ts >= since);
  const catches = all.filter((p) => p.kind !== 'relato');
  const species = [...catches.reduce((m, p) => m.set(p.species, (m.get(p.species) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]);
  const intel = C.similarity(s, catches, now);
  host.innerHTML = `
  <div class="spothead"><div class="crumbs"><button class="iconbtn" data-act="closepage" aria-label="Voltar">${ic('back')}</button><span class="grow"></span>
    ${s.id ? `<button class="iconbtn" data-act="fav" data-id="${esc(s.id)}" aria-label="${fav ? 'Remover dos favoritos' : 'Favoritar'}" style="${fav ? 'color:var(--warn)' : ''}">${ic('star', fav ? 'filled' : '')}</button>` : ''}
    <button class="iconbtn" data-act="ai" data-spot="" aria-label="Perguntar ao assistente">${ic('spark')}</button></div>
    <div class="xs muted">${esc(C.kindLabel(s.kind))} · ${esc(s.region || '')} · ${s.water === 'doce' ? 'Água doce' : 'Água salgada'}${s.private ? ' · Privado' : ''}</div>
    <h1 style="margin-top:4px">${esc(s.name)}</h1>
    <div class="coords num">${s.lat.toFixed(5)}°, ${s.lon.toFixed(5)}° <button class="link" data-act="copycoord" data-lat="${s.lat}" data-lon="${s.lon}">copiar</button></div>
    ${s.desc ? `<p class="sm muted" style="margin:8px 0 0">${esc(s.desc)}</p>` : ''}
    <div class="minimap" id="miniMap"></div></div>
  ${s.id ? `<div class="presence"><div class="faces">${act.slice(0, 4).map((p) => C.avatar(p.uid, 'sm')).join('') || `<span class="avatar sm" style="background:var(--s3);color:var(--ink3)">${ic('users')}</span>`}</div>
    <div class="grow"><b>${act.length} ${act.length === 1 ? 'pescador ativo' : 'pescadores ativos'}</b><div class="xs muted">${act.length ? 'compartilhando presença agora' : 'Ninguém compartilhando presença agora'}</div></div>
    <button class="btn ${mineHere ? 'danger' : ''}" style="height:42px;padding:0 14px" data-act="${mineHere ? 'endsession' : 'startsession'}" data-id="${esc(s.id)}">${ic(mineHere ? 'stop' : 'play')}${mineHere ? 'Encerrar' : 'Pescar aqui'}</button></div>` : `<div class="note" style="margin-top:14px">Esta é uma coordenada livre. <button class="link" data-act="newspot" data-lat="${s.lat}" data-lon="${s.lon}">Cadastre como ponto</button> para ter feed, presença e histórico.</div>`}

  <section class="sec"><header><h2>Condições agora</h2><span class="xs muted">${fmt.time(now)}</span></header>
   <div class="cond">
    <div><span>Índice de pesca</span><b class="num">${fi.idx} · ${Env.verdict(fi.idx)}</b><em>${C.src('b')}</em></div>
    <div><span>Atividade agora</span><b class="num">${fi.now.score}/100</b><em>${C.src('b')}</em></div>
    <div><span>${ic('therm')}Temperatura</span><b class="num">${C.T(w.temp, 1)} · sens. ${C.T(w.feels)}</b><em>${C.wsrc(w)}</em></div>
    <div><span>${ic('wind')}Vento</span><b class="num">${C.W(w.wind)} ${C.arrow(w.windDir, 13)} ${fmt.dir(w.windDir)}</b><em>rajadas ${C.W(w.gust)} · ${C.wsrc(w)}</em></div>
    <div><span>${ic('gauge')}Pressão</span><b class="num">${fmt.n(w.pressure, 1)} hPa</b><em>${Math.abs(w.pTrend) < .4 ? 'estável' : w.pTrend < 0 ? 'em queda' : 'subindo'} · ${C.wsrc(w)}</em></div>
    <div><span>${ic('drop')}Umidade · chuva</span><b class="num">${w.humidity}% · ${fmt.n(w.rainMm, 1)} mm</b><em>${C.wsrc(w)}</em></div>
    <div><span>${ic('moon')}Lua</span><b>${esc(mi.name)}</b><em class="num">${fmt.n(mi.fraction * 100, 0)}% · ${C.src('a', 'Astronômico')}</em></div>
    <div><span>${ic('sunrise')}Sol</span><b class="num">${fmt.time(ctx.sun.rise)} – ${fmt.time(ctx.sun.set)}</b><em>${C.src('a', 'Astronômico')}</em></div>
    ${tide ? `<div><span>${ic('tide')}Maré</span><b class="num">${fmt.n(tide.h, 2)} m · ${tide.state}</b><em>${C.src('b', 'Modelo')} · ref. a ${fmt.n(Env.distKm(s, Env.TIDE_REF), 1)} km</em></div>
    <div><span>Próximas</span><b class="num" style="display:flex;align-items:center;gap:4px">${ic('up')} ${hi ? fmt.time(new Date(hi.t)) : '—'} ${ic('down')} ${lo ? fmt.time(new Date(lo.t)) : '—'}</b><em>${C.src('b', 'Modelo')}</em></div>
    <div><span>${ic('wave')}Ondas</span><b class="num">${fmt.n(w.waveH, 1)} m · ${w.waveT} s · ${fmt.dir(w.waveDir)}</b><em>${C.msrc(w)}</em></div>
    <div><span>Água · corrente</span><b class="num">${C.T(w.waterT, 1)} · ${fmt.n(w.current, 1)} nó</b><em>${C.msrc(w)}</em></div>` : `<div><span>${ic('therm')}Água</span><b class="num">${C.T(w.waterT, 1)}</b><em>${C.msrc(w)}</em></div><div><span>Maré</span><b>Não se aplica</b><em>água doce</em></div>`}
   </div>
   <p class="pad xs dim" style="margin:8px 0 0">${C.wxReal(w) ? `Clima: Open-Meteo${w.cellKm != null ? ` (célula a ${fmt.n(w.cellKm, 1)} km)` : ''}${w.marine === 'a' ? ` · Mar: Open-Meteo Marine${w.marKm != null ? ` (célula a ${fmt.n(w.marKm, 1)} km)` : ''}` : ''}. Previsões de modelo, não medições no local.` : 'Clima e mar simulados dentro do Claude; no app hospedado vêm da Open-Meteo, com a distância da célula do modelo.'}</p></section>

  <section class="sec"><header><h2>Atividade estimada hoje</h2><span class="xs muted">melhor ${C.hh(fi.da.best.from)}–${C.hh(fi.da.best.to)}</span></header>${C.actBars(fi.da.hours, C.nowHour(), fi.da.best)}</section>

  ${s.id ? `<section class="sec"><header><h2>Inteligência do ponto</h2>${C.src('c', 'Registros')}</header><div class="insight">${intel}</div></section>
  <section class="sec"><header><h2>Espécies registradas aqui</h2></header>${species.length ? `<div class="pad chips">${species.map(([k, n]) => `<span class="tag"><b>${esc(k)}</b> ${n}</span>`).join('')}</div>` : `<div class="empty">${ic('fish')}<b>Sem registros ainda</b>${s.species && s.species.length ? 'Espécies conhecidas (informadas no cadastro): ' + esc(s.species.join(', ')) : 'As capturas registradas aqui aparecem automaticamente.'}</div>`}</section>
  <section class="sec"><header><h2>Atividades deste ponto</h2>${S.dbState === 'ok' ? '<span class="live">Ao vivo</span>' : ''}</header>
   <div class="pad" style="margin-bottom:12px"><div class="seg">${[[1, '24 h'], [7, '7 dias'], [30, '30 dias'], [182, '6 meses'], [365, '1 ano']].map(([d, l]) => `<button class="${range === d ? 'on' : ''}" data-act="hist" data-d="${d}">${l}</button>`).join('')}</div></div>
   ${posts.length ? posts.map(C.postHtml).join('') : `<div class="empty">${ic('chat')}<b>Nada registrado neste período</b>Inicie uma pescaria aqui e registre o que encontrar — sua publicação aparece na hora para quem acompanha o ponto.</div>`}
   <div class="pad" style="margin-top:12px;display:grid;gap:10px"><button class="btn block" data-act="capture" data-id="${esc(s.id)}">${ic('fish')}Registrar captura aqui</button><button class="btn ghost block" data-act="report" data-id="${esc(s.id)}">${ic('chat')}Escrever relato do local</button></div></section>` : ''}
  <div style="height:40px"></div>`;
  $('#pageBody').scrollTop = first ? 0 : y;
  const mbox = $('#miniMap');
  if (S.mapbox === 'ok') { mbox.innerHTML = '<div class="skel" style="position:absolute;inset:0;border-radius:0"></div>'; C.mbxSpotImage(mbox, s).then((ok) => { if (!ok && mbox.isConnected) miniVector(); }); } else miniVector();
  function miniVector() { C.makeMap(mbox, { lat: s.lat, lon: s.lon, scale: 0.55, mini: true, onUpdate: (api) => { const p = api.toScreen(s.lat, s.lon); api.mk.innerHTML = `<span class="mk sel" style="left:${p[0]}px;top:${p[1]}px"><span class="pin">${ic('fish')}</span><span class="stem"></span></span>`; } }); }
};

// comparação com condições registradas anteriormente no mesmo ponto
C.condSnap = (s, date) => {
  const mi = Astro.moonInfo(date), t = s.water !== 'doce' ? Env.tideState(s, date) : null, w = Env.weather(s, date);
  const h = +new Intl.DateTimeFormat('pt-BR', { timeZone: Env.TZ, hour: 'numeric', hour12: false }).format(date) % 24;
  return { phase: mi.name, phaseB: Math.round(mi.elongation / 90) % 4, illum: Math.round(mi.fraction * 100), tide: t ? t.state : null, tideH: t ? +t.h.toFixed(2) : null, hour: h, hourB: Math.floor(h / 6), wind: w.wind, windSim: true, pressure: w.pressure };
};
C.similarity = (s, catches, now) => {
  const n = catches.length;
  if (n < 5) return `<b>Ainda não há dados históricos suficientes.</b><p class="muted">${n ? `Este ponto tem ${n} captura${n > 1 ? 's' : ''} registrada${n > 1 ? 's' : ''}.` : 'Nenhuma captura registrada até agora.'} Com pelo menos 5 registros começamos a comparar as condições de hoje com os dias de captura.</p>`;
  const cur = C.condSnap(s, now);
  const sim = catches.filter((p) => p.cond).map((p) => { let m = 0; if (p.cond.phaseB === cur.phaseB) m++; if (p.cond.tide && p.cond.tide === cur.tide) m++; if (p.cond.hourB === cur.hourB) m++; return { p, m }; }).filter((x) => x.m >= 2);
  const days = new Set(sim.map(({ p }) => new Date(p.ts).toISOString().slice(0, 10))).size;
  const sp = [...sim.reduce((m, { p }) => m.set(p.species, (m.get(p.species) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]);
  const hist = Array(24).fill(0); catches.forEach((p) => { if (p.cond) hist[p.cond.hour]++; });
  const mx = Math.max(...hist); let bi = 0, bs = 0; for (let i = 0; i < 24; i++) { const v = hist[i] + hist[(i + 1) % 24] + hist[(i + 2) % 24]; if (v > bs) { bs = v; bi = i; } }
  const conf = n >= 40 ? 'alta' : n >= 15 ? 'média' : 'baixa';
  return `${days ? `<b>Hoje as condições se parecem com as de ${days} dia${days > 1 ? 's' : ''} em que houve captura neste ponto${sp[0] ? ` (principalmente ${esc(sp[0][0])})` : ''}.</b>` : '<b>As condições de hoje não se parecem com os dias de captura registrados aqui.</b>'}
   <p class="muted">Comparamos fase da lua, estado da maré e período do dia. Os registros da comunidade mostram maior frequência de capturas entre <b class="num" style="color:var(--ink)">${C.hh(bi)} e ${C.hh(bi + 3)}</b>. Base: ${n} capturas · confiança ${conf}. Correlação não é garantia de captura.</p>
   <div class="hist" aria-label="Capturas por hora">${hist.map((v) => `<i style="height:${mx ? Math.max(3, v / mx * 100) : 3}%"></i>`).join('')}</div><div class="acth" style="padding:4px 0 0"><span>00h</span><span>12h</span><span>23h</span></div>`;
};

/* ------------ cadastro de ponto ------------ */
C.newSpotForm = (lat, lon) => {
  const near = C.allSpots().filter((s) => Env.distKm({ lat, lon }, s) < 0.15);
  C.sheet('Novo ponto de pesca', `<form class="form" id="spotForm">
    <div class="note" style="margin:0">${ic('pin')} <b class="num">${lat.toFixed(5)}, ${lon.toFixed(5)}</b>${near.length ? `<br>Atenção: ${near.map((s) => esc(s.name)).join(', ')} fica a menos de 150 m. Evite duplicar pontos.` : ''}</div>
    <label class="field"><span>Nome do ponto</span><input class="input" name="name" required maxlength="60" placeholder="Ex.: Mureta da Urca — trecho do bondinho"></label>
    <div class="row2"><label class="field"><span>Ambiente</span><select class="input" name="kind">${Object.entries(C.KINDS).filter(([k]) => k !== 'coordenada').map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
    <label class="field"><span>Água</span><select class="input" name="water"><option value="salgada">Salgada</option><option value="doce">Doce</option></select></label></div>
    <label class="field"><span>Região</span><input class="input" name="region" maxlength="60" placeholder="Ex.: Urca, Rio de Janeiro"></label>
    <label class="field"><span>Espécies conhecidas (separe por vírgula)</span><input class="input" name="species" maxlength="160"></label>
    <label class="field"><span>Descrição e observações</span><textarea class="input" name="desc" maxlength="400" placeholder="Acesso, fundo, cuidados, regras locais…"></textarea></label>
    <div class="field"><span>Visibilidade</span><div class="seg" id="visSeg"><button type="button" class="on" data-v="public">Público</button><button type="button" data-v="private">Só eu</button></div></div>
    <button class="btn block" type="submit">Salvar ponto</button></form>`, (b) => {
    let vis = 'public';
    $$('#visSeg button', b).forEach((x) => x.onclick = () => { vis = x.dataset.v; $$('#visSeg button', b).forEach((y) => y.classList.toggle('on', y === x)); });
    $('#spotForm', b).onsubmit = async (e) => {
      e.preventDefault(); if (!C.needDb()) return;
      const f = new FormData(e.target), name = String(f.get('name')).trim(); if (!name) return;
      const id = C.safeId(name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '-' + Date.now().toString(36));
      const doc = { type: 'spot', name, lat: +lat.toFixed(6), lon: +lon.toFixed(6), kind: f.get('kind'), water: f.get('water'), region: String(f.get('region') || '').trim(), species: String(f.get('species') || '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 12), desc: String(f.get('desc') || '').trim(), createdBy: S.uid, ts: Date.now(), status: 'ativo' };
      try {
        if (vis === 'private') await C.cap.db.doc(`data/users/${S.uid}/${id}`).set(doc);
        else await C.cap.db.doc('spots/' + id).set(doc);
        C.closeSheet(); C.toast('Ponto cadastrado', 'pin'); setTimeout(() => C.openSpot(id), 300);
      } catch (err) { C.dbError(err); }
    };
  });
};

/* ------------ escolha do local atual ------------ */
C.pickSpot = () => {
  const cur = C.cur(), list = C.allSpots().sort((a, b) => (S.mine.favorites.includes(b.id) - S.mine.favorites.includes(a.id)) || a.name.localeCompare(b.name));
  C.sheet('Escolher local', `${list.length ? `<div class="list">${list.map((s) => `<button data-act="setcur" data-id="${esc(s.id)}">${ic(S.mine.favorites.includes(s.id) ? 'star' : 'pin')}<span class="grow"><b>${esc(s.name)}</b><br><span class="xs muted">${esc(C.kindLabel(s.kind))} · ${esc(s.region || '')}</span></span>${s.id === cur.id ? ic('next') : ''}</button>`).join('')}</div>` : `<div class="empty">${ic('pin')}<b>Nenhum ponto cadastrado</b>Use o mapa para marcar um local.</div>`}
  <div class="pad" style="margin-top:12px"><button class="btn ghost block" data-go="mapa">${ic('search')}Buscar no mapa</button></div>`);
};
}
