/* Cardume · mapa real (Mapbox, via conector do usuário)
   As imagens vêm da API Static Images do Mapbox pelo conector "Mapbox" do claude.ai.
   O app conhece a projeção (Web Mercator, blocos de 512 px), então converte qualquer
   ponto da tela em latitude/longitude exatas e posiciona os marcadores por cima. */
{
const MBX = 'Mapbox';
const TOOLS = { img: 'static_map_image_tool', search: 'search_and_geocode_tool', rev: 'reverse_geocode_tool' };
const S = C.S;
S.mapbox = 'checking'; // checking | ok | off | auth
C.mbxCheck = async () => {
  try {
    const mcp = await claude.use('mcp'); if (!mcp) { S.mapbox = 'off'; return; }
    C.cap.mcp = mcp;
    const l = await mcp.listTools(MBX).catch(() => null);
    const sv = l && l.servers && l.servers.find((x) => x.server === MBX);
    S.mapbox = !sv ? 'off' : sv.authStatus === 'needs_reauth' ? 'auth' : 'ok';
  } catch { S.mapbox = 'off'; }
};
const errCode = (e) => (e && e.code) || 'upstream_error';
C.mbxFail = (e) => {
  const c = errCode(e);
  if (c === 'server_not_connected' || c === 'not_in_manifest' || c === 'not_granted' || c === 'capability_disabled') S.mapbox = 'off';
  else if (c === 'needs_reauth') S.mapbox = 'auth';
  return c;
};
// imagem estática → data URL
C.mbxImage = async (input) => {
  const r = await C.cap.mcp.callTool(MBX, TOOLS.img, input, { cache: { staleTime: 7 * 864e5, gcTime: 7 * 864e5 } });
  const img = (r.content || []).find((b) => b.type === 'image' && b.data);
  if (!img) throw { code: 'no_image' };
  return `data:${img.mimeType || 'image/png'};base64,${img.data}`;
};
C.mbxSearch = async (q, near) => {
  const inBR = near && near.lat < 5.4 && near.lat > -34 && near.lon > -74 && near.lon < -34.7;
  const input = { q: q.slice(0, 190), language: 'pt', auto_complete: true, proximity: { longitude: +near.lon.toFixed(5), latitude: +near.lat.toFixed(5) } };
  if (inBR) input.country = ['BR'];
  const r = await C.cap.mcp.callTool(MBX, TOOLS.search, input, { cache: { staleTime: 864e5, gcTime: 864e5 } });
  const fc = r.structuredContent || r.payload;
  return ((fc && fc.features) || []).filter((f) => f.geometry && Array.isArray(f.geometry.coordinates)).slice(0, 6).map((f) => ({
    name: String((f.properties && (f.properties.name || f.properties.name_preferred)) || q),
    addr: String((f.properties && (f.properties.full_address || f.properties.place_formatted)) || ''),
    lon: +f.geometry.coordinates[0], lat: +f.geometry.coordinates[1]
  }));
};
C.mbxReverse = async (lat, lon) => {
  const r = await C.cap.mcp.callTool(MBX, TOOLS.rev, { longitude: +lon.toFixed(6), latitude: +lat.toFixed(6), language: 'pt', format: 'json_string' }, { cache: { staleTime: 30 * 864e5, gcTime: 30 * 864e5 } });
  const fc = typeof r.payload === 'string' ? JSON.parse(r.payload) : (r.structuredContent || r.payload);
  const p = fc && fc.features && fc.features[0] && fc.features[0].properties;
  return p ? String(p.full_address || p.place_formatted || p.name || '') : '';
};

/* ---------- motor do mapa real ---------- */
const TILE = 512;
const lon2x = (lon, z) => (lon + 180) / 360 * TILE * 2 ** z;
const lat2y = (lat, z) => { const s = Math.sin(lat * Math.PI / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TILE * 2 ** z; };
const x2lon = (x, z) => x / (TILE * 2 ** z) * 360 - 180;
const y2lat = (y, z) => { const n = Math.PI - 2 * Math.PI * y / (TILE * 2 ** z); return 180 / Math.PI * Math.atan(Math.sinh(n)); };
C.STYLE_IDS = { ruas: 'mapbox/streets-v12', satelite: 'mapbox/satellite-streets-v12', relevo: 'mapbox/outdoors-v12' };

C.makeRealMap = (host, opt = {}) => {
  host.innerHTML = `<div class="mapwrap realwrap"><div class="tiles"><img class="t0" alt="" draggable="false"><img class="t1" alt="" draggable="false"></div><div class="winds"></div><div class="markers"></div><div class="maploading" hidden>${C.ic('clock')}Carregando mapa…</div></div>`;
  const wrap = host.firstElementChild, mk = wrap.querySelector('.markers'), winds = wrap.querySelector('.winds'), load = wrap.querySelector('.maploading');
  const imgs = [...wrap.querySelectorAll('.tiles img')];
  const v = { lat: opt.lat ?? -22.95, lon: opt.lon ?? -43.18, z: opt.zoom ?? 13 };
  const shown = { el: null, lat: 0, lon: 0, z: 0, w: 0, h: 0 };
  let W = host.clientWidth, Hh = host.clientHeight, timer = null, seq = 0, front = 0;
  const style = () => C.STYLE_IDS[opt.style ? opt.style() : 'ruas'] || C.STYLE_IDS.ruas;
  const toScreen = (lat, lon) => [lon2x(lon, v.z) - lon2x(v.lon, v.z) + W / 2, lat2y(lat, v.z) - lat2y(v.lat, v.z) + Hh / 2];
  const toGeo = (sx, sy) => [y2lat(lat2y(v.lat, v.z) + sy - Hh / 2, v.z), x2lon(lon2x(v.lon, v.z) + sx - W / 2, v.z)];
  const clampZ = () => { v.z = Math.max(3, Math.min(20, v.z)); v.lat = Math.max(-84, Math.min(84, v.lat)); };
  function place() {
    if (!shown.el) return;
    const s = 2 ** (v.z - shown.z), [cx, cy] = toScreen(shown.lat, shown.lon);
    shown.el.style.transform = `translate(${cx - shown.w * s / 2}px,${cy - shown.h * s / 2}px) scale(${s})`;
  }
  function update(refetch = true) {
    W = host.clientWidth; Hh = host.clientHeight; clampZ(); place();
    opt.onUpdate && opt.onUpdate(api);
    if (refetch) { clearTimeout(timer); timer = setTimeout(fetchImg, 280); }
  }
  async function fetchImg() {
    if (!W || !Hh || S.mapbox !== 'ok') return;
    const my = ++seq, want = { lat: v.lat, lon: v.lon, z: Math.round(v.z * 4) / 4, w: Math.min(1280, Math.round(W)), h: Math.min(1280, Math.round(Hh)) };
    if (shown.el && Math.abs(want.z - shown.z) < .01 && Math.abs(lon2x(want.lon, want.z) - lon2x(shown.lon, want.z)) < 2 && Math.abs(lat2y(want.lat, want.z) - lat2y(shown.lat, want.z)) < 2 && shown.style === style()) return;
    load.hidden = false;
    try {
      const url = await C.mbxImage({ center: { longitude: +want.lon.toFixed(6), latitude: +want.lat.toFixed(6) }, zoom: want.z, size: { width: want.w, height: want.h }, style: style(), highDensity: true });
      if (my !== seq) return;
      const el = imgs[1 - front];
      el.onload = () => {
        if (my !== seq) return;
        el.style.width = want.w + 'px'; el.style.height = want.h + 'px';
        Object.assign(shown, { el, lat: want.lat, lon: want.lon, z: want.z, w: want.w, h: want.h, style: style() });
        place(); el.classList.add('on'); imgs[front].classList.remove('on'); front = 1 - front; load.hidden = true;
      };
      el.src = url;
    } catch (e) { load.hidden = true; const c = C.mbxFail(e); opt.onError && opt.onError(c); }
  }
  const api = { wrap, mk, winds, view: v, toScreen, toGeo, size: () => [W, Hh], update, real: true, refresh: () => { shown.style = null; fetchImg(); },
    scaleLabel: () => { const mpp = 156543.03 * Math.cos(v.lat * Math.PI / 180) / 2 ** v.z / 2; const m = mpp * 100; return m > 1000 ? `~${(m / 1000).toFixed(1).replace('.', ',')} km` : `~${Math.round(m)} m`; },
    flyTo(lat, lon, z) { const f = { ...v }, tz = z ?? Math.max(v.z, 15), t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 600), e = 1 - (1 - k) ** 3; v.lat = f.lat + (lat - f.lat) * e; v.lon = f.lon + (lon - f.lon) * e; v.z = f.z + (tz - f.z) * e; update(k >= 1); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step); },
    zoomBy(d) { v.z += d; update(); } };
  // interação (arrastar, pinça, roda, toque duplo, toque)
  const pts = new Map(); let moved = 0, last = null, pinch = null, lastTap = 0;
  wrap.addEventListener('pointerdown', (e) => { if (e.target.closest('.mk')) return; wrap.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; last = [e.clientX, e.clientY];
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: v.z }; } });
  wrap.addEventListener('pointermove', (e) => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; v.z = pinch.z + Math.log2(Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d); moved = 99; update(false); return; }
    const dx = e.clientX - last[0], dy = e.clientY - last[1]; moved += Math.abs(dx) + Math.abs(dy); last = [e.clientX, e.clientY];
    const [la, lo] = toGeo(W / 2 - dx, Hh / 2 - dy); v.lat = la; v.lon = lo; update(false); });
  const up = (e) => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
    if (pts.size === 0) { if (moved < 6) { const r = wrap.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top, now = Date.now();
      if (now - lastTap < 300) { const [la, lo] = toGeo(sx, sy); api.flyTo(la, lo, v.z + 1); } else opt.onTap && opt.onTap(...toGeo(sx, sy)); lastTap = now; } else update(true); } };
  wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
  wrap.addEventListener('wheel', (e) => { e.preventDefault(); const r = wrap.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top, [la, lo] = toGeo(sx, sy);
    v.z -= e.deltaY * 0.002; clampZ(); const [nx, ny] = toScreen(la, lo); const [cl, co] = toGeo(W / 2 + nx - sx, Hh / 2 + ny - sy); v.lat = cl; v.lon = co; update(true); }, { passive: false });
  new ResizeObserver(() => update(true)).observe(host);
  setTimeout(() => update(true));
  return api;
};

// imagem de satélite fixa para a página do ponto
C.mbxSpotImage = async (box, s) => {
  if (S.mapbox !== 'ok' || !box) return false;
  try {
    const w = Math.min(1280, Math.round(box.clientWidth || 400)), h = Math.round(box.clientHeight || 160);
    const url = await C.mbxImage({ center: { longitude: +s.lon.toFixed(6), latitude: +s.lat.toFixed(6) }, zoom: 16.5, size: { width: w, height: h }, style: C.STYLE_IDS.satelite, highDensity: true,
      overlays: [{ type: 'marker', longitude: +s.lon.toFixed(6), latitude: +s.lat.toFixed(6), size: 'large', color: 'ff6a5c' }] });
    if (!box.isConnected) return true;
    box.innerHTML = `<img src="${url}" alt="Imagem de satélite de ${C.esc(s.name)}" style="width:100%;height:100%;object-fit:cover;display:block"><span class="mapcredit">Satélite · Mapbox</span>`;
    return true;
  } catch (e) { C.mbxFail(e); return false; }
};
}
