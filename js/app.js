/* Cardume · núcleo: estado, dados em tempo real, navegação, Início e Previsão */
{
const C = window.C = {};
const { fmt, H, D } = Env;
C.$ = (s, r = document) => r.querySelector(s);
C.$$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = C.esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeId = C.safeId = (s) => String(s).replace(/[^A-Za-z0-9_\-.~:@+]/g, '_').slice(0, 180);

const P = {
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h16a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',
  gauge: '<path d="M4.5 17a8.5 8.5 0 1 1 15 0"/><path d="m12 13 4-5"/><circle cx="12" cy="13" r="1.3"/>',
  drop: '<path d="M12 3.5s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/>',
  therm: '<path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 10v6"/>',
  rain: '<path d="M7 15a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 7.5a3.8 3.8 0 0 1-1 7.5"/><path d="m9 18-1 2.5M13 18l-1 2.5M17 18l-1 2.5"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 10.5a3.8 3.8 0 0 1-1 7.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  sunrise: '<path d="M4 18h16M6.5 18a5.5 5.5 0 0 1 11 0"/><path d="M12 3v5M9.5 5.5 12 3l2.5 2.5"/>',
  sunset: '<path d="M4 18h16M6.5 18a5.5 5.5 0 0 1 11 0"/><path d="M12 8V3M9.5 5.5 12 8l2.5-2.5"/>',
  moon: '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z"/>',
  wave: '<path d="M2 12c2.5-2.5 4.5-2.5 7 0s4.5 2.5 7 0 4.5-2.5 6 0"/><path d="M2 17c2.5-2.5 4.5-2.5 7 0s4.5 2.5 7 0 4.5-2.5 6 0"/><path d="M2 7c2.5-2.5 4.5-2.5 7 0s4.5 2.5 7 0 4.5-2.5 6 0"/>',
  tide: '<path d="M3 15c3-3 6-3 9 0s6 3 9 0"/><path d="M12 3v8M9 8l3 3 3-3"/>',
  fish: '<path d="M3 12c3-4.5 7.5-6 11.5-4.5L21 4v16l-6.5-3.5C10.5 18 6 16.5 3 12z"/><circle cx="7.5" cy="11" r=".9"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  chat: '<path d="M4 5.5h16v10H9.5L5 19.5v-4H4z"/>',
  share: '<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12v7.5h14V12"/>',
  bookmark: '<path d="M6.5 3.5h11v17L12 16.5l-5.5 4z"/>',
  star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z"/>',
  back: '<path d="M15 5 8 12l7 7"/>', next: '<path d="m9 5 7 7-7 7"/>', close: '<path d="M6 6l12 12M18 6 6 18"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  spark: '<path d="M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7z"/><path d="M19 15.5c.3 1.8 1 2.5 2.5 2.7-1.5.3-2.2 1-2.5 2.8-.3-1.8-1-2.5-2.5-2.8 1.5-.2 2.2-.9 2.5-2.7z"/>',
  camera: '<path d="M4 8h3.5L9 5.5h6L16.5 8H20v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.2"/>',
  flag: '<path d="M5 21V4.5M5 4.5h11l-2 4 2 4H5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4.5 6.5h15M9 6.5V4h6v2.5M6.5 6.5l1 13.5h9l1-13.5"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
  medal: '<circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 9.8 6 3h4l2 4.5L14 3h4l-2.5 6.8"/><path d="m12 12 .9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z"/>',
  hook: '<path d="M14 3v10.5a4.5 4.5 0 1 1-9 0V12l3 2"/><circle cx="14" cy="3" r="1"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.3 3-5 6-5s5.4 1.7 6 5"/><path d="M16 4.8a3 3 0 0 1 0 6.2M18 14.3c1.7.6 2.8 2.1 3 4.7"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  send: '<path d="M4 12 20 4l-5 16-3.5-6.5z"/><path d="M11.5 13.5 20 4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  map: '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5z"/><path d="M9 4v13M15 6.5v13"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.9 5.2 3.9 8.5s-1.3 6.1-3.9 8.5c-2.6-2.4-3.9-5.2-3.9-8.5s1.3-6.1 3.9-8.5z"/>',
  mountain: '<path d="m3 19 6.5-11 4 6.5 2.5-3.5L21 19z"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.3 3 7.7 7 9.5 4-1.8 7-5.2 7-9.5V6z"/>'
};
const ic = C.ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;
C.arrow = (deg, size = 16) => `<svg class="i" viewBox="0 0 24 24" style="width:${size}px;height:${size}px;transform:rotate(${deg + 180}deg)" aria-hidden="true"><path d="M12 4v16M6.5 9.5 12 4l5.5 5.5"/></svg>`;
C.wsrc = (w) => w && w.origin === 'a' ? C.src('a', 'Open-Meteo') : C.src('s');
C.msrc = (w) => w && w.marine === 'a' ? C.src('a', 'Open-Meteo Marine') : C.src('s');
C.wxReal = (w) => w && w.origin === 'a';
C.src = (k, label) => `<span class="src ${k}" title="${{ a: 'Fonte calculada/externa', b: 'Estimativa de modelo', c: 'Registro da comunidade', s: 'Dado simulado — integração ainda não ligada' }[k]}">${esc(label || { a: 'Astronômico', b: 'Estimativa', c: 'Comunidade', s: 'Simulado' }[k])}</span>`;

/* ---------------- estado ---------------- */
C.S = {
  route: 'inicio', uid: null, me: null, isOwner: false, canWrite: null,
  spots: new Map(), privSpots: new Map(), posts: [], likes: new Map(), comments: [], follows: [], profiles: new Map(), reports: [],
  mine: { favorites: [], saved: [], current: null, session: null, privacy: 'aproximada' }, sessions: [],
  peers: [], dbState: 'carregando', species: null, fcTab: 'lua', moonSel: null, calMonth: null, commTab: 'agora', histRange: 7,
  layers: { spots: true, catches: true, fishers: true, wind: false, fav: false }, seenPosts: new Set(), booted: false
};
const S = C.S;
C.DEFAULT_LOC = { id: null, name: 'Urca, Rio de Janeiro', lat: -22.9447, lon: -43.1631, water: 'salgada', kind: 'coordenada', region: 'Baía de Guanabara' };
C.allSpots = () => [...S.spots.values(), ...S.privSpots.values()];
C.spot = (id) => S.spots.get(id) || S.privSpots.get(id) || null;
C.cur = () => C.spot(S.mine.current) || C.spot(S.mine.favorites[0]) || C.spot('mureta-da-urca') || C.allSpots()[0] || C.DEFAULT_LOC;
C.name = (uid) => { const p = S.profiles.get(uid); return (p && p.nick) || (S.names && S.names[uid]) || 'Pescador'; };
C.initials = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
C.avatar = (uid, cls = '') => `<span class="avatar ${cls}" aria-hidden="true">${esc(C.initials(C.name(uid)))}</span>`;

/* ---------------- toast & folhas ---------------- */
let toastT;
C.toast = (msg, icon = 'info') => { const t = C.$('#toast'); t.innerHTML = ic(icon) + `<span>${esc(msg)}</span>`; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200); };
C.sheet = (title, html, onMount) => {
  C.$('#sheetTitle').textContent = title; const b = C.$('#sheetBody'); b.innerHTML = html; b.scrollTop = 0;
  C.$('#sheet').classList.add('on'); C.$('#scrim').classList.add('on'); onMount && onMount(b);
};
C.closeSheet = () => { C.$('#sheet').classList.remove('on'); if (!C.$('#page').classList.contains('on')) C.$('#scrim').classList.remove('on'); C.onSheetClose && C.onSheetClose(); C.onSheetClose = null; };
C.page = (html, onMount) => { const b = C.$('#pageBody'); b.innerHTML = html; b.scrollTop = 0; C.$('#page').classList.add('on'); onMount && onMount(b); };
C.closePage = () => { C.$('#page').classList.remove('on'); S.openSpot = null; C.onPageClose && C.onPageClose(); C.onPageClose = null; };
C.$('#sheetClose').onclick = C.closeSheet;
C.$('#scrim').onclick = () => { if (C.$('#sheet').classList.contains('on')) C.closeSheet(); };
addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (C.$('#sheet').classList.contains('on')) C.closeSheet(); else if (C.$('#page').classList.contains('on')) C.closePage(); } });

/* ---------------- capacidades (backend real) ---------------- */
C.cap = {};
C.boot = async () => {
  const use = (n) => (window.claude && claude.use ? claude.use(n).catch(() => null) : Promise.resolve(null));
  const [db, user, room, assets, sample] = await Promise.all(['db', 'user', 'room', 'assets', 'sample'].map(use));
  Object.assign(C.cap, { db, user, room, assets, sample });
  if (user) {
    try { S.uid = await user.id(); } catch { }
    try { S.me = await user.me(); } catch { }
    try { S.isOwner = !!(await user.isOwner()); } catch { }
    try { S.canWrite = await user.can('data.write'); } catch { }
  }
  C.mbxCheck && C.mbxCheck().then(() => { if (S.route === 'mapa') C.views.mapa(true); else C.render(); });
  if (!db) { S.dbState = 'off'; C.render(); return; }
  C.subscribe();
  C.joinRoom();
};

let loadTimer;
C.subscribe = () => {
  const db = C.cap.db;
  loadTimer = setTimeout(() => { if (S.dbState === 'carregando') { S.dbState = 'lento'; C.render(); } }, 10000);
  const ok = () => { clearTimeout(loadTimer); if (S.dbState !== 'ok') { S.dbState = 'ok'; } };
  const fail = (e) => { clearTimeout(loadTimer); S.dbState = e && e.code === 'revoked' ? 'off' : 'erro'; C.render(); };
  db.collection('spots').onSnapshot((snap) => { ok(); S.spots = new Map(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }])); C.render(); }, fail);
  db.collection('posts').orderBy('ts', 'desc').limit(300).onSnapshot((snap) => {
    ok();
    const fresh = snap.docChanges().filter((c) => c.type === 'added' && S.booted && !snap.metadata.hasPendingWrites).map((c) => c.doc.data());
    S.posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    for (const p of fresh) if (p.uid !== S.uid) C.notifyPost(p);
    S.booted = true; C.render();
  }, fail);
  db.collection('likes').limit(1000).onSnapshot((snap) => { S.likes = new Map(snap.docs.map((d) => [d.id, d.data()])); C.renderSoft(); }, () => { });
  db.collection('comments').orderBy('ts', 'asc').limit(1000).onSnapshot((snap) => { S.comments = snap.docs.map((d) => ({ id: d.id, ...d.data() })); C.renderSoft(); C.onComments && C.onComments(); }, () => { });
  db.collection('follows').limit(1000).onSnapshot((snap) => { S.follows = snap.docs.map((d) => d.data()); C.renderSoft(); }, () => { });
  db.collection('profiles').limit(1000).onSnapshot((snap) => {
    S.profiles = new Map(snap.docs.map((d) => [d.id, d.data()])); S.profilesLoaded = true; C.renderSoft();
    if (S.uid && !S.profiles.has(S.uid) && !S.obShown && !snap.metadata.fromCache) { S.obShown = true; setTimeout(() => C.onboarding && C.onboarding(), 600); }
  }, () => { });
  db.collection('idfb').limit(500).onSnapshot((snap) => { S.idfb = snap.docs.map((d) => d.data()); }, () => { });
  if (S.isOwner) db.collection('reports').limit(500).onSnapshot((snap) => { S.reports = snap.docs.map((d) => ({ id: d.id, ...d.data() })); }, () => { });
  if (S.uid) {
    const base = 'data/users/' + S.uid;
    db.doc(base + '/state').onSnapshot((d) => { if (d.exists) Object.assign(S.mine, d.data()); C.render(); }, () => { });
    db.collection(base).where('type', '==', 'session').limit(200).onSnapshot((snap) => { S.sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.start - a.start); C.renderSoft(); }, () => { });
    db.collection(base).where('type', '==', 'spot').limit(200).onSnapshot((snap) => { S.privSpots = new Map(snap.docs.map((d) => [d.id, { id: d.id, private: true, ...d.data() }])); C.render(); }, () => { });
  }
};
// grava o estado pessoal (favoritos, sessão, preferências) — uma escrita por vez
let saving = Promise.resolve();
C.saveMine = (patch) => {
  Object.assign(S.mine, patch);
  if (!C.cap.db || !S.uid) return Promise.resolve();
  const data = JSON.parse(JSON.stringify(S.mine));
  saving = saving.then(() => C.cap.db.doc('data/users/' + S.uid + '/state').set(data)).catch((e) => C.dbError(e));
  return saving;
};
C.dbError = (e) => {
  const code = e && e.code;
  if (code === 'invalid_argument') C.toast('Sem permissão para gravar aqui. Peça acesso de Colaborador ao dono.', 'lock');
  else if (code === 'quota_exceeded') C.toast('Limite de armazenamento atingido. Remova itens antigos.', 'info');
  else if (code === 'resource_exhausted') C.toast('Muitas ações seguidas. Aguarde alguns segundos.', 'clock');
  else C.toast('Não foi possível salvar agora. Tente de novo.', 'info');
};
C.needDb = () => { if (!C.cap.db) { C.toast('Entre na sua conta Claude para participar da comunidade.', 'lock'); return false; } if (!S.uid) { C.toast('Não foi possível identificar sua conta.', 'lock'); return false; } return true; };

/* ---------------- presença em tempo real (room) ---------------- */
C.joinRoom = () => {
  const room = C.cap.room; if (!room) return;
  room.onPeers((ch) => {
    const seen = new Set(), out = [];
    for (const p of ch.peers || []) {
      const st = p.presence || {}; if (p.kind !== 'viewer' || !st.spot || Date.now() - (st.since || 0) > 8 * H) continue;
      const uid = p.by || st.uid || p.peer; if (seen.has(uid)) continue; seen.add(uid);
      out.push({ uid, spot: String(st.spot), since: +st.since || 0, me: p.isMe });
    }
    S.peers = out; C.renderSoft();
  }, () => { });
  C.pushPresence();
  setInterval(() => C.pushPresence(), 4 * 60e3); // presença some ao fechar o app ou após 8h sem renovação
};
C.pushPresence = () => {
  const room = C.cap.room; if (!room) return;
  const s = S.mine.session;
  room.presence(s && s.share !== false ? { spot: s.spotId, since: s.start, uid: S.uid } : { spot: null, since: null, uid: null }).catch(() => { });
};
C.activeAt = (spotId) => S.peers.filter((p) => p.spot === spotId);

C.notifyPost = (p) => {
  const sp = C.spot(p.spotId);
  const fav = S.mine.favorites.includes(p.spotId);
  if ((fav && C.cfg.notifFav) || (!fav && C.cfg.notifComm && (S.route === 'comunidade' || S.route === 'inicio'))) C.toast(`${p.kind === 'relato' ? 'Novo relato' : (p.species || 'Captura')} ${sp ? 'em ' + sp.name : ''} · agora`, 'fish');
  S.seenPosts.add(p.id);
};

/* ---------------- roteamento ---------------- */
const ROUTES = ['inicio', 'previsao', 'mapa', 'comunidade', 'perfil'];
C.go = (r) => { if (location.hash !== '#' + r) location.hash = r; else C.route(); };
C.route = () => {
  const r = ROUTES.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'inicio';
  S.route = r;
  for (const x of ROUTES) C.$('#v-' + x).hidden = x !== r;
  C.$$('#nav a').forEach((a) => a.classList.toggle('on', a.dataset.r === r));
  C.$('#fab').classList.toggle('hide', r === 'mapa');
  C.render(true);
};
addEventListener('hashchange', C.route);

let rq = 0, soft = 0;
C.render = (force) => { cancelAnimationFrame(rq); rq = requestAnimationFrame(() => { const v = C.views[S.route]; v && v(force); if (S.openSpot && C.refreshSpot) C.refreshSpot(); C.wantReal(); }); };
// busca clima/mar reais do local em uso (fora do Claude); re-renderiza quando chegam
C.wantReal = () => { const list = [C.cur()]; if (S.openSpot && S.openSpot !== '__virtual') list.push(C.spot(S.openSpot)); else if (S.virtualSpot && S.openSpot) list.push(S.virtualSpot); for (const s of list) s && Env.ensureReal(s).then((ch) => { if (ch) C.renderSoft(); }); };
C.renderSoft = () => { clearTimeout(soft); soft = setTimeout(() => C.render(), 120); };
C.views = {};

/* ---------------- INÍCIO ---------------- */
function greet() { const h = +new Intl.DateTimeFormat('pt-BR', { timeZone: Env.TZ, hour: 'numeric', hour12: false }).format(new Date()); return h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
C.myName = () => (S.uid && S.profiles.get(S.uid)?.nick) || (S.me && S.me.name) || 'pescador';

/* ---------- ajustes, tema e unidades ---------- */
const CFG_KEY = 'cardume.settings';
const CFG_DEF = { theme: 'auto', text: 'md', motion: 'on', temp: 'c', wind: 'kmh', weight: 'kg', length: 'cm', region: 'auto', notifFav: true, notifComm: true, sharePresence: true };
C.cfg = (() => { try { return { ...CFG_DEF, ...JSON.parse(localStorage.getItem(CFG_KEY) || '{}') }; } catch { return { ...CFG_DEF }; } })();
C.setCfg = (patch) => { Object.assign(C.cfg, patch); try { localStorage.setItem(CFG_KEY, JSON.stringify(C.cfg)); } catch { } C.applyTheme(); C.render(true); };
C.scheme = () => document.documentElement.dataset.scheme || 'light';
C.applyTheme = () => {
  const r = document.documentElement, m = C.cfg.theme, viewer = r.getAttribute('data-theme');
  const dark = m === 'dark' || (m === 'auto' && (viewer ? viewer === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches));
  r.dataset.scheme = dark ? 'dark' : 'light'; r.dataset.text = C.cfg.text; r.dataset.motion = C.cfg.motion;
  const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = dark ? '#0A1C2B' : '#F2F9FA';
};
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (C.cfg.theme === 'auto') { C.applyTheme(); C.render(true); } });
new MutationObserver(() => { if (C.cfg.theme === 'auto') { const before = C.scheme(); C.applyTheme(); if (C.scheme() !== before) C.render(true); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
C.applyTheme();
// unidades: internamente tudo em °C, km/h, kg e cm
C.T = (c, d = 0) => C.cfg.temp === 'f' ? `${fmt.n(c * 9 / 5 + 32, d)}°F` : `${fmt.n(c, d)}°`;
C.W = (k) => C.cfg.wind === 'kn' ? `${fmt.n(k / 1.852, 0)} nós` : C.cfg.wind === 'ms' ? `${fmt.n(k / 3.6, 1)} m/s` : `${fmt.n(k, 0)} km/h`;
C.KG = (kg) => C.cfg.weight === 'lb' ? `${fmt.n(kg * 2.20462, 1)} lb` : `${fmt.n(kg, kg < 10 ? 2 : 1)} kg`;
C.CM = (cm) => C.cfg.length === 'in' ? `${fmt.n(cm / 2.54, 1)} pol` : `${fmt.n(cm, 0)} cm`;
C.gear = () => `<button class="iconbtn" data-act="settings" aria-label="Ajustes">${ic('gear')}</button>`;

/* ---------- cena do dia (topo da Início) ---------- */
// cor do céu pela altura real do Sol no ponto
C.skyFor = (alt) => alt > 12 ? { top: '#5BB8F0', mid: '#9ED8F7', low: '#FFE7B0', ink: '#0F2E47', day: true }
  : alt > 2 ? { top: '#5CA8E6', mid: '#FFC98A', low: '#FF9C72', ink: '#2A1508', day: true }
  : alt > -6 ? { top: '#2C4C8A', mid: '#E97E7A', low: '#FFB36B', ink: '#FFFFFF', day: false }
  : { top: '#071A33', mid: '#122E55', low: '#1D4470', ink: '#FFFFFF', day: false };
C.heroScene = (sp, now) => {
  const sun = Astro.sunPos(now, sp.lat, sp.lon), mi = Astro.moonInfo(now), mp = Astro.moonPos(now, sp.lat, sp.lon), c = C.skyFor(sun.alt);
  // astro visível desenhado no arco do céu: x pelo azimute (leste→oeste), y pela altura
  const body = sun.alt > -2 ? { alt: sun.alt, az: sun.az, kind: 'sun' } : { alt: mp.alt, az: mp.az, kind: 'moon' };
  const ax = 200 - Math.sin(body.az * Math.PI / 180) * 160; // leste à esquerda, oeste à direita
  const ay = 192 - Math.max(-8, Math.min(80, body.alt)) * 0.8; // abaixo do título, acima do mar
  const stars = !c.day ? Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 97) % 400}" cy="${(i * 53) % 120 + 6}" r="${i % 5 ? .7 : 1.2}" fill="#fff" opacity="${.35 + (i % 4) * .15}"/>`).join('') : '';
  const moonG = `<circle cx="${ax}" cy="${ay}" r="26" fill="#E8EEFF" opacity=".12"/>`;
  const sunG = `<g transform="translate(${ax} ${ay})"><circle r="34" fill="#FFE07A" opacity=".35"/><circle r="20" fill="#FFD84D"/></g>`;
  const moonPos = body.kind === 'moon' && body.alt > -4 ? { x: ax / 4, y: ay / 3 } : null;
  return { c, moonPos, mi, svg: `<svg class="scene" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs><linearGradient id="skyg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.top}"/><stop offset=".62" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.low}"/></linearGradient>
  <linearGradient id="seag" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.day ? '#1FB5C4' : '#123E63'}"/><stop offset="1" stop-color="${c.day ? '#0B7FA6' : '#0A2443'}"/></linearGradient></defs>
  <rect width="400" height="300" fill="url(#skyg)"/>${stars}${body.alt > -4 ? (body.kind === 'sun' ? sunG : moonG) : ''}
  <path d="M0 196 C40 170 70 150 104 158 C130 128 150 96 176 104 C196 110 206 150 232 170 C260 160 300 176 330 184 C360 176 384 182 400 186 V230 H0Z" fill="${c.day ? '#2E8A6E' : '#0E2B3E'}" opacity="${c.day ? .55 : .9}"/>
  <rect y="206" width="400" height="94" fill="url(#seag)"/>
  <path fill="#fff" opacity=".22"><animate attributeName="d" dur="8s" repeatCount="indefinite" values="M0 214 C60 206 120 222 200 212 S330 206 400 214 V222 H0Z;M0 212 C70 222 140 204 210 216 S340 220 400 210 V222 H0Z;M0 214 C60 206 120 222 200 212 S330 206 400 214 V222 H0Z"/></path>
  <path fill="#fff" opacity=".14"><animate attributeName="d" dur="11s" repeatCount="indefinite" values="M0 246 C80 238 160 254 240 244 S360 240 400 246 V252 H0Z;M0 244 C90 254 170 236 250 248 S370 252 400 242 V252 H0Z;M0 246 C80 238 160 254 240 244 S360 240 400 246 V252 H0Z"/></path>
  </svg>` };
};

// escala padrão de semáforo: vermelho fraca → amarelo regular → verde-claro boa → verde muito boa
C.SCALE = [[75, 'var(--q4)', 'Muito boa'], [55, 'var(--q3)', 'Boa'], [35, 'var(--q2)', 'Regular'], [0, 'var(--q1)', 'Fraca']];
C.actColor = (v) => C.SCALE.find(([min]) => v >= min)[1];
C.actBars = (hours, nowH) => `<div class="act" role="img" aria-label="Atividade estimada por hora">${hours.map((v, h) => `<i class="${h === nowH ? 'now' : ''}" style="height:${Math.max(5, v)}%;background:${C.actColor(v)};animation-delay:${h * 18}ms" title="${String(h).padStart(2, '0')}h · ${v}"></i>`).join('')}</div><div class="acth"><span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span></div>
<div class="legend">${C.SCALE.map(([, c, l]) => `<span><i style="background:${c}"></i>${l}</span>`).join('')}</div>`;

C.nowHour = () => +new Intl.DateTimeFormat('pt-BR', { timeZone: Env.TZ, hour: 'numeric', hour12: false }).format(new Date()) % 24;
const hh = (h) => String(h % 24).padStart(2, '0') + 'h';
C.hh = hh;

C.dataBanner = () => {
  if (S.dbState === 'off') return `<div class="banner">${ic('info')}<span>Modo offline: previsões e lua funcionam, mas a comunidade em tempo real precisa da sua conta Claude conectada.</span></div>`;
  if (S.dbState === 'lento') return `<div class="banner">${ic('clock')}<span>Ainda conectando à comunidade… os dados podem estar desatualizados.</span></div>`;
  if (S.dbState === 'erro') return `<div class="banner">${ic('info')}<span>A conexão com a comunidade caiu. Recarregue a página para reconectar.</span></div>`;
  return '';
};
const VERDICT = { Excelente: 'Dia excelente para pescar', Boa: 'Boa pesca hoje', Regular: 'Pesca regular hoje', Fraca: 'Dia fraco para pescar', 'Desfavorável': 'Melhor esperar outro dia' };

C.views.inicio = () => {
  const v = C.$('#v-inicio'), sp = C.cur(), now = new Date();
  const fi = Env.fishingIndex(sp, now, S.species), w = fi.now.w, ctx = fi.da.ctx;
  const tide = sp.water !== 'doce' ? Env.tideState(sp, now) : null;
  const tser = tide ? Env.tideSeries(sp, now.getTime(), 30) : null;
  const nextHi = tser && tser.ext.find((e) => e.type === 'alta'), nextLo = tser && tser.ext.find((e) => e.type === 'baixa');
  const curMi = Astro.moonInfo(now);
  const recent = S.posts.slice(0, 3);
  const favs = S.mine.favorites.map(C.spot).filter(Boolean);
  const list = (favs.length ? favs : C.allSpots().filter((s) => s.id !== sp.id)).map((s) => ({ s, d: Env.distKm(sp, s) })).sort((a, b) => a.d - b.d).slice(0, 8);
  const active = S.peers.length, scene = C.heroScene(sp, now), vd = Env.verdict(fi.idx);
  const sealCol = fi.idx >= 75 ? ['#1E9E5A', '#ffffff'] : fi.idx >= 55 ? ['#8BCB4A', '#16300A'] : fi.idx >= 35 ? ['#F5B700', '#3B2800'] : ['#E5484D', '#ffffff'];
  v.innerHTML = `
  <div class="top"><button class="avatar" data-go="perfil" aria-label="Seu perfil">${esc(C.initials(C.myName()))}</button><div class="who"><div class="hello">${esc(greet())},</div><h1>${esc(C.myName().split(' ')[0])}</h1></div>
    <button class="iconbtn" data-act="ai" aria-label="Assistente de pesca">${ic('spark')}</button>${C.gear()}</div>
  <button class="loc" data-act="pickspot"><span class="tile t-sea">${ic('pin')}</span><span class="grow"><b>${esc(sp.name)}</b><br><span class="xs muted num">${sp.lat.toFixed(4)}, ${sp.lon.toFixed(4)} · ${esc(sp.region || '')}</span></span>${ic('next')}</button>
  ${C.dataBanner()}
  <section class="hero" style="--heroInk:${scene.c.ink};--sealBg:${sealCol[0]};--sealInk:${sealCol[1]}">${scene.svg}${scene.moonPos ? `<canvas id="heroMoon" style="position:absolute;left:${scene.moonPos.x}%;top:${scene.moonPos.y}%;width:34px;height:34px;transform:translate(-50%,-50%)" aria-hidden="true"></canvas>` : ''}<div class="in">
    <div class="head"><div class="grow"><div class="verdict">${esc(VERDICT[vd])}${S.species ? `<br><span style="font-size:17px;font-weight:500">para ${esc(S.species)}</span>` : ''}</div>
      <div class="when">Melhor horário <b class="num">${hh(fi.da.best.from)} às ${hh(fi.da.best.to)}</b></div></div>
      <div class="seal" role="img" aria-label="Índice de pesca ${fi.idx} de 100"><b class="num">${fi.idx}</b><span>de 100</span></div></div>
    <div class="chips">
      ${tide ? `<span class="hchip"><span class="dot t-sea">${ic('tide')}</span>Maré ${esc(tide.state)}</span>` : ''}
      <span class="hchip"><span class="dot t-moon">${ic('moon')}</span>${esc(curMi.name)}</span>
      <span class="hchip"><span class="dot t-sky">${ic('wind')}</span>Vento ${w.wind <= 15 ? 'fraco' : w.wind <= 25 ? 'moderado' : 'forte'}</span>
    </div>
    <div class="note2"><span>Estimativa do modelo · clima ${C.wxReal(w) ? 'real (Open-Meteo)' : 'simulado'}</span><button class="link" style="color:#fff;font-size:12px;text-decoration:underline" data-act="method">Como calculamos</button></div>
  </div></section>
  <div class="pad" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
    <button class="chipbtn" data-act="species">${ic('fish')}${esc(S.species || 'Todas as espécies')}</button>
    <button class="chipbtn ${S.mine.session ? 'on' : ''}" data-act="session">${ic(S.mine.session ? 'stop' : 'play')}${S.mine.session ? 'Encerrar pescaria' : 'Iniciar pescaria'}</button>
  </div>

  <section class="sec"><header><h2><span class="tile t-coral">${ic('fish')}</span>Atividade dos peixes</h2><a data-go="previsao" data-tab="peixes">Por espécie</a></header>
    ${C.actBars(fi.da.hours, C.nowHour())}</section>

  <section class="sec"><header><h2><span class="tile t-sky">${ic('sun')}</span>Tempo agora</h2>${C.wsrc(w)}</header>
    <div class="readings"><div class="big"><span class="tile ${w.rainProb > 50 ? 't-sky' : 't-sun'}">${ic(w.rainProb > 50 ? 'rain' : w.cloud > 60 ? 'cloud' : 'sun')}</span><div class="t num">${C.T(w.temp)}</div>
      <div class="sm muted">Sensação ${C.T(w.feels)}<br>Chuva ${w.rainProb}% · Nuvens ${w.cloud}%</div></div>
      <div class="grid">
        <div><span><i class="tile t-sky">${ic('wind')}</i>Vento</span><b class="num">${C.W(w.wind)} ${C.arrow(w.windDir, 14)}</b></div>
        <div><span><i class="tile t-sky">${ic('wind')}</i>Rajadas</span><b class="num">${C.W(w.gust)}</b></div>
        <div><span><i class="tile t-moon">${ic('gauge')}</i>Pressão</span><b class="num">${fmt.n(w.pressure, 0)} hPa</b></div>
        <div><span><i class="tile t-sea">${ic('drop')}</i>Umidade</span><b class="num">${w.humidity}%</b></div>
        <div><span><i class="tile t-sea">${ic('wave')}</i>Ondas</span><b class="num">${sp.water === 'doce' ? '—' : fmt.n(w.waveH, 1) + ' m'}</b></div>
        <div><span><i class="tile t-coral">${ic('therm')}</i>Água</span><b class="num">${C.T(w.waterT, 1)}</b></div>
      </div>
      <div class="foot"><span>${C.wxReal(w) ? `Previsão Open-Meteo · atualizada ${fmt.time(new Date(w.fetchedAt))}${w.cellKm != null ? ` · célula do modelo a ${fmt.n(w.cellKm, 1)} km` : ''}` : 'Dados simulados: a previsão real aparece no app hospedado (fora do Claude)'}</span></div></div></section>

  <section class="sec"><header><h2><span class="tile t-moon">${ic('moon')}</span>Céu e maré</h2><a data-go="previsao" data-tab="lua">Calendário lunar</a></header>
    <div class="sky"><canvas id="homeMoon" width="240" height="240" aria-label="${esc(curMi.name)}"></canvas>
      <dl class="kv"><dt>${ic('sunrise')} Sol</dt><dd class="num">${fmt.time(ctx.sun.rise)} – ${fmt.time(ctx.sun.set)}</dd>
        <dt>${ic('moon')} Lua</dt><dd class="num">${fmt.time(ctx.moon.rise)} / ${fmt.time(ctx.moon.set)}</dd>
        <dt>Iluminação</dt><dd class="num">${fmt.n(curMi.fraction * 100, 0)}%</dd>
        ${tide ? `<dt>${ic('tide')} Maré alta</dt><dd class="num">${nextHi ? fmt.time(new Date(nextHi.t)) + ' · ' + fmt.n(nextHi.v, 1) + ' m' : '—'}</dd><dt>Maré baixa</dt><dd class="num">${nextLo ? fmt.time(new Date(nextLo.t)) + ' · ' + fmt.n(nextLo.v, 1) + ' m' : '—'}</dd>` : ''}
      </dl></div>
    <p class="pad xs dim" style="margin:8px 0 0">Sol e Lua ${C.src('a', 'cálculo astronômico')} · Maré ${C.src('b', 'modelo')} — não use para navegação.</p></section>

  <section class="sec"><header><h2><span class="tile t-good">${ic('users')}</span>Aconteceu agora</h2>${S.dbState === 'ok' ? '<span class="live">Ao vivo</span>' : ''}</header>
    ${recent.length ? recent.map(C.postHtml).join('') : C.emptyFeed()}
    ${S.posts.length > 3 ? `<div class="pad"><button class="btn ghost block" data-go="comunidade">Ver toda a comunidade</button></div>` : ''}</section>

  <section class="sec"><header><h2><span class="tile t-sun">${ic('pin')}</span>${favs.length ? 'Seus pontos' : 'Pontos próximos'}</h2><a data-go="mapa">Mapa</a></header>
    <p class="pad sm muted" style="margin:-6px 0 10px">${active ? `<span class="live">${active} ${active === 1 ? 'pescador ativo' : 'pescadores ativos'} agora</span>` : 'Ninguém compartilhando presença agora'}</p>
    ${list.length ? `<div class="hscroll">${list.map(({ s, d }) => C.spotCard(s, d)).join('')}</div>` : `<div class="empty">${ic('pin')}<b>Nenhum ponto cadastrado ainda</b>Abra o mapa e toque no local exato onde você pesca.</div>`}</section>
  <div class="spacer"></div>`;
  const cv = C.$('#homeMoon'); if (cv) MoonRender.draw(cv, { elongation: curMi.elongation, phaseAngle: curMi.phaseAngle, south: sp.lat < 0 });
  const hm = C.$('#heroMoon'); if (hm) MoonRender.draw(hm, { elongation: curMi.elongation, phaseAngle: curMi.phaseAngle, south: sp.lat < 0, earthshine: 0 });
};

C.spotCard = (s, d) => {
  const fi = Env.fishingIndex(s, new Date(), S.species);
  const act = C.activeAt(s.id).length;
  const band = fi.idx >= 75 ? 'linear-gradient(120deg,#25B36A,#178A4E)' : fi.idx >= 55 ? 'linear-gradient(120deg,#9BD45A,#6DB33A)' : fi.idx >= 35 ? 'linear-gradient(120deg,#FFC93C,#F0A500)' : 'linear-gradient(120deg,#F06A6E,#D93B40)';
  return `<button class="spotcard" data-spot="${esc(s.id)}"><span class="band" style="background:${band}"><b class="num">${fi.idx}</b><span>${esc(Env.verdict(fi.idx))}</span></span>
  <span class="body"><span class="k">${esc(C.kindLabel(s.kind))}${d != null ? ' · ' + fmt.n(d, 1) + ' km' : ''}</span><span class="nm">${esc(s.name)}</span>
  <span class="sm muted">Melhor <b class="num" style="color:var(--ink)">${hh(fi.da.best.from)}–${hh(fi.da.best.to)}</b></span>
  <span class="xs ${act ? '' : 'dim'}">${act ? `<span class="live">${act} ativo${act > 1 ? 's' : ''}</span>` : 'Ninguém ativo agora'}</span></span></button>`;
};
C.KINDS = { mureta: 'Mureta', costao: 'Costão', praia: 'Praia', pier: 'Píer', molhe: 'Molhe', rio: 'Rio', lago: 'Lago', represa: 'Represa', ponte: 'Ponte', embarcada: 'Embarcada', coordenada: 'Coordenada' };
C.kindLabel = (k) => C.KINDS[k] || 'Ponto de pesca';
C.emptyFeed = () => S.dbState === 'off' ? `<div class="empty">${ic('users')}<b>Comunidade indisponível offline</b>Conecte sua conta para ver capturas em tempo real.</div>` : S.dbState === 'carregando' ? `<div style="padding:0 18px"><div class="skel" style="height:130px"></div></div>` : `<div class="empty">${ic('fish')}<b>Nenhuma captura registrada ainda</b>Seja o primeiro: toque em <b style="display:inline">Registrar</b> quando pescar algo.</div>`;

/* ---------------- PREVISÃO ---------------- */
C.views.previsao = () => {
  const v = C.$('#v-previsao'), sp = C.cur();
  const tabs = [['lua', 'Lua'], ['mares', 'Marés'], ['tempo', 'Tempo'], ['mar', 'Mar'], ['peixes', 'Peixes']];
  v.innerHTML = `<div class="top"><div class="who"><div class="hello">Central de previsão</div><h1>${esc(sp.name.split(',')[0])}</h1></div><button class="iconbtn" data-act="pickspot" aria-label="Trocar local">${ic('pin')}</button>${C.gear()}</div>
  <div class="tabs"><div class="seg" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${S.fcTab === k}" class="${S.fcTab === k ? 'on' : ''}" data-fc="${k}">${l}</button>`).join('')}</div></div>
  <div id="fcBody"></div><div class="spacer"></div>`;
  C.fc[S.fcTab](C.$('#fcBody'), sp);
};
C.fc = {};

const moonCanvas = (cls, sz) => `<canvas class="${cls}" width="${sz}" height="${sz}"></canvas>`;
C.drawMoonAt = (cv, date, south) => { const mi = Astro.moonInfo(date); MoonRender.draw(cv, { elongation: mi.elongation, phaseAngle: mi.phaseAngle, south }); return mi; };

C.fc.lua = (el, sp) => {
  const now = new Date(), south = sp.lat < 0;
  const sel = S.moonSel ? new Date(S.moonSel) : now;
  const ds = Env.dayStart(sel);
  const mi = Astro.moonInfo(sel);
  const rs = Astro.riseSet(ds, sp.lat, sp.lon, 'moon');
  const nextP = Astro.nextPhases(now, 8);
  const today0 = Env.dayStart(now);
  const days = Array.from({ length: 30 }, (_, i) => today0 + i * D + 12 * H);
  const selDayIdx = Math.round((ds - today0) / D);
  const nxt = nextP.find((p) => p.date > sel) || nextP[0];
  const key = (tg) => nextP.find((p) => p.target === tg);
  el.innerHTML = `
  <div class="moonhero"><div class="stage"><canvas id="bigMoon" width="600" height="600" aria-label="Lua em ${esc(fmt.dayLong(sel))}"></canvas></div>
    <div class="ph" id="mName">${esc(mi.name)}</div><div class="ill num" id="mIll">${fmt.n(mi.fraction * 100, 1)}% iluminada · ${esc(fmt.dayLong(sel))}</div>
    <div style="margin-top:8px">${C.src('a', 'Cálculo astronômico · ±2 min')}</div></div>
  <div class="stats3"><div><span>Idade</span><b class="num">${fmt.n(mi.age, 1)} d</b></div><div><span>Nascer</span><b class="num">${fmt.time(rs.rise)}</b></div><div><span>Pôr</span><b class="num">${fmt.time(rs.set)}</b></div></div>
  <div class="stats3" style="margin-top:8px"><div><span>Distância</span><b class="num">${fmt.n(mi.dist, 0)} km</b></div><div><span>Passagem</span><b class="num">${fmt.time(rs.transit)}</b></div><div><span>Próxima fase</span><b class="num" style="font-size:13px">${esc(nxt.name.replace('Quarto ', 'Q. '))}<br>${fmt.dm(nxt.date)}</b></div></div>
  <section class="sec"><header><h2>Calendário lunar</h2><span class="xs muted">próximos 30 dias</span></header>
    <div class="hscroll mstrip" id="mstrip">${days.map((t, i) => `<button data-mday="${t}" class="${i === selDayIdx ? 'on' : ''}"><span>${i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : esc(fmt.day(new Date(t)).split(',')[0])}</span>${moonCanvas('ms', 72)}<b class="num">${fmt.dm(new Date(t))}</b></button>`).join('')}</div></section>
  <section class="sec"><header><h2>Próximas fases principais</h2></header>
    <div class="timeline">${nextP.slice(0, 6).map((p) => `<div class="ev">${moonCanvas('tl', 80)}<div><b>${esc(p.name)}</b><div class="xs muted">${esc(fmt.dayLong(p.date))}</div></div><div class="when num"><b>${fmt.time(p.date)}</b><div class="xs muted">${C.inTime(p.date)}</div></div></div>`).join('')}</div></section>
  <section class="sec"><header><h2>Calendário mensal</h2></header><div class="cal" id="cal"></div></section>
  <section class="sec"><header><h2>Lua e pesca</h2>${C.src('b')}</header><div class="card sm" style="line-height:1.55">
    <p style="margin:0 0 8px">Perto da <b>lua nova</b> (${fmt.dm(key(0).date)}) e da <b>lua cheia</b> (${fmt.dm(key(180).date)}) acontecem as marés de sizígia: maior amplitude e correntes mais fortes, o que costuma movimentar iscas e peixes. Nos quartos (${fmt.dm(key(90).date)}, ${fmt.dm(key(270).date)}) as marés são de quadratura, mais fracas.</p>
    <p style="margin:0">Os períodos solunares maiores ocorrem na passagem da Lua pelo meridiano (hoje às ${fmt.time(rs.transit)}) e no ponto oposto. Muitos pescadores relatam mais atividade nesses horários, mas a relação é estatística e varia por espécie e local — não é garantia de captura.</p></div></section>`;
  const big = C.$('#bigMoon');
  C.animMoon(big, mi, south);
  C.$$('#mstrip canvas').forEach((cv, i) => C.drawMoonAt(cv, new Date(days[i]), south));
  C.$$('.timeline canvas').forEach((cv, i) => C.drawMoonAt(cv, nextP[i].date, south));
  const on = C.$('#mstrip .on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' });
  C.renderCal(sp);
};
let lastMoon = null, moonAnim;
C.animMoon = (cv, mi, south) => {
  cancelAnimationFrame(moonAnim);
  const from = lastMoon && Math.abs(lastMoon.elongation - mi.elongation) < 200 ? lastMoon : mi; lastMoon = mi;
  const t0 = performance.now(), dur = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
  const step = (t) => {
    const k = dur ? Math.min(1, (t - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
    let de = mi.elongation - from.elongation; if (de > 180) de -= 360; if (de < -180) de += 360;
    const el = (from.elongation + de * e + 360) % 360;
    MoonRender.draw(cv, { elongation: el, south, libration: (1 - e) * 4 });
    if (k < 1) moonAnim = requestAnimationFrame(step);
  };
  moonAnim = requestAnimationFrame(step);
};
C.renderCal = (sp) => {
  const box = C.$('#cal'); if (!box) return;
  const now = new Date();
  const base = S.calMonth || (() => { const p = new Intl.DateTimeFormat('en-CA', { timeZone: Env.TZ, year: 'numeric', month: '2-digit' }).format(now).split('-'); return { y: +p[0], m: +p[1] - 1 }; })();
  S.calMonth = base;
  const first = Date.UTC(base.y, base.m, 1, 3), daysIn = new Date(Date.UTC(base.y, base.m + 1, 0)).getUTCDate();
  const dow0 = new Date(first).getUTCDay();
  const phases = Astro.nextPhases(new Date(first - 2 * D), 7).filter((p) => p.date >= first && p.date < first + daysIn * D);
  const keyDay = new Map(phases.map((p) => [Math.floor((p.date.getTime() - first) / D) + 1, p]));
  const todayKey = Env.dayStart(now), selKey = S.moonSel ? Env.dayStart(new Date(S.moonSel)) : todayKey;
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(first));
  let cells = '';
  for (let i = 0; i < dow0; i++) cells += '<span></span>';
  for (let d = 1; d <= daysIn; d++) { const t = first + (d - 1) * D; const k = keyDay.get(d);
    cells += `<button class="d ${k ? 'key' : ''} ${t === todayKey ? 'today' : ''} ${t === selKey ? 'sel' : ''}" data-mday="${t + 12 * H}" title="${k ? esc(k.name) : ''}">${moonCanvas('cm', 52)}<span class="num">${d}</span></button>`; }
  box.innerHTML = `<div class="ch"><button class="iconbtn" data-cal="-1" aria-label="Mês anterior">${ic('back')}</button><b>${esc(monthName.charAt(0).toUpperCase() + monthName.slice(1))}</b><button class="iconbtn" data-cal="1" aria-label="Próximo mês">${ic('next')}</button></div>
   <div class="grid">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((x) => `<span class="dow">${x}</span>`).join('')}${cells}</div>
   <div class="xs muted" style="margin-top:8px">${phases.map((p) => `${esc(p.name)}: ${fmt.dm(p.date)} ${fmt.time(p.date)}`).join(' · ')}</div>`;
  C.$$('#cal canvas').forEach((cv) => C.drawMoonAt(cv, new Date(+cv.parentElement.dataset.mday), sp.lat < 0));
};

C.inTime = (d) => { const h = (d - Date.now()) / H; return h < 1 ? 'em minutos' : h < 24 ? `em ${Math.round(h)} h` : `em ${Math.round(h / 24)} dia${Math.round(h / 24) > 1 ? 's' : ''}`; };
C.svgChart = (el, draw) => { const ro = new ResizeObserver(() => { if (!el.isConnected) { ro.disconnect(); return; } draw(el.clientWidth, el.clientHeight); }); ro.observe(el); };

C.fc.mares = (el, sp) => {
  if (sp.water === 'doce') { el.innerHTML = `<div class="empty" style="margin-top:12px">${ic('tide')}<b>Sem maré neste ponto</b>${esc(sp.name)} é de água doce.</div>`; return; }
  const now = Date.now(), from = Env.dayStart(new Date()), ser = Env.tideSeries(sp, from, 72, 15), st = Env.tideState(sp, new Date());
  const dist = Env.distKm(sp, Env.TIDE_REF);
  el.innerHTML = `<div class="readings" style="margin-top:6px"><div class="big">${ic('tide')}<div class="t num">${fmt.n(st.h, 2)}<span style="font-size:20px"> m</span></div><div class="sm muted"><b style="color:var(--ink);font-size:16px">${st.state[0].toUpperCase() + st.state.slice(1)}</b><br>${fmt.n(Math.abs(st.rate) * 100, 0)} cm/h</div></div>
   <div class="foot"><span>Referência: ${esc(Env.TIDE_REF.name)} · ${fmt.n(dist, 1)} km do ponto</span>${C.src('b', 'Modelo')}</div></div>
  <section class="sec"><header><h2>Variação · 3 dias</h2></header><div class="fig" id="tideFig" style="height:200px"></div></section>
  <section class="sec"><header><h2>Tábua estimada</h2></header><div class="card" style="padding:4px 12px"><table class="tbl"><thead><tr><th>Dia</th><th>Maré</th><th class="r">Hora</th><th class="r">Altura</th></tr></thead><tbody>
   ${ser.ext.map((e) => `<tr style="${e.t < now ? 'opacity:.5' : ''}"><td>${esc(fmt.day(new Date(e.t)))}</td><td>${e.type === 'alta' ? 'Alta' : 'Baixa'}</td><td class="r num">${fmt.time(new Date(e.t))}</td><td class="r num">${fmt.n(e.v, 2)} m</td></tr>`).join('')}</tbody></table></div></section>
  <div class="note" style="margin-top:14px"><b>Como esta maré é calculada.</b> Modelo harmônico simplificado (M2, S2, K1, O1) ligado às posições reais da Lua e do Sol: a alternância entre sizígia e quadratura é correta, mas horários e alturas são estimativas. Para navegação, use a tábua oficial da Marinha do Brasil (DHN/CHM). A integração com a tábua oficial está prevista no backend.</div>`;
  C.svgChart(C.$('#tideFig'), (W, Hh) => {
    const pts = ser.pts, t0 = pts[0][0], t1 = pts[pts.length - 1][0], vmin = Math.min(...pts.map((p) => p[1])) - .1, vmax = Math.max(...pts.map((p) => p[1])) + .1;
    const x = (t) => ((t - t0) / (t1 - t0)) * W, y = (v) => Hh - 22 - ((v - vmin) / (vmax - vmin)) * (Hh - 44);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)} ${y(p[1]).toFixed(1)}`).join('');
    const days = [0, 1, 2].map((i) => t0 + i * D);
    C.$('#tideFig').innerHTML = `<svg viewBox="0 0 ${W} ${Hh}"><defs><linearGradient id="tg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--acc2)" stop-opacity=".35"/><stop offset="1" stop-color="var(--acc2)" stop-opacity="0"/></linearGradient></defs>
     ${days.map((t) => `<line x1="${x(t)}" x2="${x(t)}" y1="0" y2="${Hh - 18}" stroke="var(--line2)"/><text x="${x(t) + 4}" y="${Hh - 4}" font-size="11" fill="var(--ink3)">${esc(fmt.day(new Date(t)))}</text>`).join('')}
     <path d="${d}L${W} ${Hh - 22}L0 ${Hh - 22}Z" fill="url(#tg)"/><path d="${d}" fill="none" stroke="var(--acc2)" stroke-width="2"/>
     ${W > 420 ? ser.ext.map((e) => `<circle cx="${x(e.t)}" cy="${y(e.v)}" r="3" fill="var(--acc2)"/><text x="${x(e.t)}" y="${y(e.v) + (e.type === 'alta' ? -8 : 15)}" font-size="10.5" text-anchor="middle" fill="var(--ink2)">${fmt.time(new Date(e.t))}</text>`).join('') : ''}
     <line x1="${x(now)}" x2="${x(now)}" y1="0" y2="${Hh - 22}" stroke="var(--acc)" stroke-dasharray="3 3"/><circle cx="${x(now)}" cy="${y(st.h)}" r="5" fill="var(--acc)" stroke="var(--bg)" stroke-width="2"/></svg>`;
  });
};

C.fc.tempo = (el, sp) => {
  const now = Date.now(), from = Math.floor(now / H) * H;
  const hrs = Array.from({ length: 24 }, (_, i) => ({ t: from + i * H, w: Env.weather(sp, new Date(from + i * H)) }));
  const d0 = Env.dayStart(new Date());
  const daily = Array.from({ length: 7 }, (_, i) => { const ws = Array.from({ length: 24 }, (_, h) => Env.weather(sp, new Date(d0 + i * D + h * H))); return { t: d0 + i * D, max: Math.max(...ws.map((w) => w.temp)), min: Math.min(...ws.map((w) => w.temp)), rain: Math.max(...ws.map((w) => w.rainProb)), wind: Math.max(...ws.map((w) => w.wind)), dir: ws[14].windDir }; });
  const w = hrs[0].w;
  el.innerHTML = `${C.wxReal(w) ? '' : `<div class="banner">${ic('info')}<span><b>Dados simulados.</b> Dentro do Claude a internet externa é bloqueada; no app hospedado a previsão vem da Open-Meteo.</span></div>`}
  <section class="sec" style="margin-top:14px"><div class="readings"><div class="grid">
    <div><span><i class="tile t-coral">${ic('therm')}</i>Temperatura</span><b class="num">${C.T(w.temp, 1)}</b></div><div><span>Sensação</span><b class="num">${C.T(w.feels, 1)}</b></div><div><span>${ic('drop')}Umidade</span><b class="num">${w.humidity}%</b></div>
    <div><span><i class="tile t-sky">${ic('wind')}</i>Vento</span><b class="num">${C.W(w.wind)} ${fmt.dir(w.windDir)}</b></div><div><span>Rajadas</span><b class="num">${C.W(w.gust)}</b></div><div><span>${ic('gauge')}Pressão</span><b class="num">${fmt.n(w.pressure, 1)}</b></div>
    <div><span>${ic('cloud')}Nuvens</span><b class="num">${w.cloud}%</b></div><div><span>${ic('rain')}Chuva</span><b class="num">${w.rainProb}% · ${fmt.n(w.rainMm, 1)} mm</b></div><div><span>${ic('sun')}UV · Visib.</span><b class="num">${w.uv} · ${w.vis} km</b></div>
  </div><div class="foot"><span>${C.wxReal(w) ? 'Atualizado ' + fmt.time(new Date(w.fetchedAt)) : 'Simulado'}</span>${C.wsrc(w)}</div></div></section>
  <section class="sec"><header><h2>Próximas 24 horas</h2><span class="xs muted">temperatura e vento</span></header><div class="fig" id="wFig" style="height:190px"></div></section>
  <section class="sec"><header><h2>7 dias</h2></header><div class="card" style="padding:4px 12px"><table class="tbl"><tbody>${daily.map((d, i) => `<tr><td>${i === 0 ? 'Hoje' : esc(fmt.day(new Date(d.t)))}</td><td class="num">${ic(d.rain > 50 ? 'rain' : 'sun')} ${d.rain}%</td><td class="num">${C.arrow(d.dir, 13)} ${C.W(d.wind)}</td><td class="r num"><span class="muted">${C.T(d.min)}</span> <b>${C.T(d.max)}</b></td></tr>`).join('')}</tbody></table></div></section>`;
  C.svgChart(C.$('#wFig'), (W, Hh) => {
    const ts = hrs.map((h) => h.w.temp), tmin = Math.min(...ts) - 1, tmax = Math.max(...ts) + 1, wmax = Math.max(...hrs.map((h) => h.w.gust));
    const bw = W / 24, x = (i) => i * bw + bw / 2, y = (v) => 16 + (1 - (v - tmin) / (tmax - tmin)) * (Hh * .45);
    const line = hrs.map((h, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(h.w.temp).toFixed(1)}`).join('');
    const step = W < 420 ? 4 : 3;
    C.$('#wFig').innerHTML = `<svg viewBox="0 0 ${W} ${Hh}">${hrs.map((h, i) => { const bh = (h.w.wind / wmax) * (Hh * .32); return `<rect x="${i * bw + 2}" y="${Hh - 20 - bh}" width="${bw - 4}" height="${bh}" rx="3" fill="var(--acc2)" opacity=".28"/>`; }).join('')}
     <path d="${line}" fill="none" stroke="var(--warn)" stroke-width="2"/>
     ${hrs.map((h, i) => i % step ? '' : `<text x="${x(i)}" y="${y(h.w.temp) - 8}" font-size="11" text-anchor="middle" fill="var(--ink)">${C.T(h.w.temp)}</text><text x="${x(i)}" y="${Hh - 5}" font-size="10.5" text-anchor="middle" fill="var(--ink3)">${fmt.time(new Date(h.t)).slice(0, 2)}h</text><text x="${x(i)}" y="${Hh - 26 - (h.w.wind / wmax) * (Hh * .32)}" font-size="10" text-anchor="middle" fill="var(--acc2)">${h.w.wind}</text>`).join('')}</svg>`;
  });
};

C.fc.mar = (el, sp) => {
  if (sp.water === 'doce') { el.innerHTML = `<div class="empty" style="margin-top:12px">${ic('wave')}<b>Condições marítimas não se aplicam</b>${esc(sp.name)} é de água doce.</div>`; return; }
  const w = Env.weather(sp, new Date());
  const rough = w.waveH >= 2 || w.wind >= 30;
  el.innerHTML = `${w.marine === 'a' ? `<p class="pad xs muted" style="margin:4px 0 0">Open-Meteo Marine${w.marKm != null ? ` · célula do modelo a ${fmt.n(w.marKm, 1)} km do ponto` : ''}. Alertas oficiais de mau tempo: Marinha (CHM).</p>` : `<div class="banner">${ic('info')}<span><b>Dados simulados.</b> No app hospedado, ondas, água e correntes vêm da Open-Meteo Marine.</span></div>`}
  ${rough ? `<div class="banner" style="margin-top:8px">${ic('flag')}<span><b>Mar agitado:</b> evite costões e pedras molhadas. Confira avisos de mau tempo da Marinha.</span></div>` : ''}
  <section class="sec" style="margin-top:14px"><div class="cond">
    <div><span>${ic('wave')}Altura das ondas</span><b class="num">${fmt.n(w.waveH, 1)} m</b><em>${C.msrc(w)}</em></div>
    <div><span>Período</span><b class="num">${w.waveT} s</b><em>${C.msrc(w)}</em></div>
    <div><span>Direção das ondas</span><b class="num">${C.arrow(w.waveDir, 14)} ${fmt.dir(w.waveDir)}</b><em>${C.msrc(w)}</em></div>
    <div><span>${ic('therm')}Água</span><b class="num">${C.T(w.waterT, 1)}</b><em>${C.msrc(w)}</em></div>
    <div><span>Corrente</span><b class="num">${fmt.n(w.current, 1)} nós</b><em>${C.msrc(w)}</em></div>
    <div><span>Mar</span><b>${w.waveH < .8 ? 'Calmo' : w.waveH < 1.6 ? 'Moderado' : 'Agitado'}</b><em>${C.msrc(w)}</em></div>
  </div></section>`;
};

C.fc.peixes = (el, sp) => {
  const da = Env.dayActivity(sp, new Date(), S.species), tom = Env.dayActivity(sp, new Date(Date.now() + D), S.species);
  const list = Object.keys(Env.SPECIES).filter((k) => Env.SPECIES[k].water === (sp.water || 'salgada'));
  const ranked = list.map((k) => ({ k, v: Env.dayActivity(sp, new Date(), k).best.avg })).sort((a, b) => b.v - a.v);
  const reg = S.posts.filter((p) => p.spotId === sp.id && p.kind !== 'relato').length;
  el.innerHTML = `<section class="sec" style="margin-top:6px"><header><h2>Hoje${S.species ? ' · ' + esc(S.species) : ''}</h2>${C.src('b')}</header>${C.actBars(da.hours, C.nowHour(), da.best)}
  <p class="pad sm" style="margin:10px 0 0">Melhor janela: <b class="num">${hh(da.best.from)}–${hh(da.best.to)}</b> (média ${da.best.avg}). Amanhã: <b class="num">${hh(tom.best.from)}–${hh(tom.best.to)}</b>.</p></section>
  <section class="sec"><header><h2>Por espécie</h2><span class="xs muted">melhor janela de hoje</span></header>
  <div class="list">${ranked.map(({ k, v }) => `<button data-setsp="${esc(k)}">${ic('fish')}<span class="grow"><b>${esc(k)}</b><span class="meter" style="display:block;margin-top:6px"><i style="width:${v}%"></i></span></span><b class="num">${v}</b></button>`).join('')}</div></section>
  <section class="sec"><header><h2>Estimativa × registros</h2></header><div class="note">As barras acima são <b>estimativas algorítmicas</b>. Capturas efetivamente registradas neste ponto: <b>${reg}</b>${reg < 5 ? ' — ainda poucas para conclusões.' : '. Veja a inteligência histórica na página do ponto.'}</div></section>`;
};

/* ---------------- delegação de cliques ---------------- */
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go],[data-act],[data-fc],[data-spot],[data-mday],[data-cal],[data-setsp],[data-post],[data-like],[data-cmt],[data-follow],[data-user],[data-save],[data-share],[data-report],[data-del]');
  if (!t) return;
  if (t.dataset.go) { if (t.dataset.tab) S.fcTab = t.dataset.tab; C.closeSheet(); if (C.$('#page').classList.contains('on')) C.closePage(); C.go(t.dataset.go); return; }
  if (t.dataset.fc) { S.fcTab = t.dataset.fc; C.$('#v-previsao').scrollTop = 0; C.render(); return; }
  if (t.dataset.mday) { S.moonSel = +t.dataset.mday; const v = C.$('#v-previsao'); const y = v.scrollTop; C.fc.lua(C.$('#fcBody'), C.cur()); v.scrollTop = y; return; }
  if (t.dataset.cal) { const m = S.calMonth; let mm = m.m + +t.dataset.cal, yy = m.y; if (mm < 0) { mm = 11; yy--; } if (mm > 11) { mm = 0; yy++; } S.calMonth = { y: yy, m: mm }; C.renderCal(C.cur()); return; }
  if (t.dataset.setsp) { S.species = t.dataset.setsp === S.species ? null : t.dataset.setsp; C.toast(S.species ? 'Previsão ajustada para ' + S.species : 'Todas as espécies', 'fish'); C.render(); return; }
  if (t.dataset.spot) { C.closeSheet(); C.openSpot(t.dataset.spot); return; }
  C.actions(t, e);
});
C.$('#fab').onclick = () => C.quickMenu();
}
