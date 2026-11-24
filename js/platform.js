/* Cardume · camada de plataforma
   Dentro do Claude o app usa os recursos do Claude (window.claude já existe).
   Fora dele (GitHub Pages, celular) esta camada cria um window.claude equivalente usando:
   - Firebase Authentication + Firestore  → login, banco, tempo real, presença e fotos
   - API da Anthropic (chave do próprio usuário, guardada só no aparelho) → IA
   - API do Mapbox (token público do config.js) → mapa, satélite e endereços */
(function () {
  if (window.claude && window.claude.use) { window.CARDUME_HOSTED = false; return; }
  window.CARDUME_HOSTED = true;
  const CFG = window.CARDUME_CONFIG || {};
  const FB_VER = '10.14.1';
  const load = (src) => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Falha ao carregar ' + src)); document.head.appendChild(s); });
  const configured = CFG.firebase && CFG.firebase.apiKey && !/COLE_AQUI/.test(CFG.firebase.apiKey);
  let fb = null, auth = null, fs = null, me = null;

  /* ---------- tela de entrada ---------- */
  function gate(msg, actions) {
    let g = document.getElementById('gate');
    if (!g) { g = document.createElement('div'); g.id = 'gate'; document.body.appendChild(g); }
    g.innerHTML = `<div class="gate-in"><img src="icons/icon.svg" alt="" width="88" height="88"><h1>Cardume</h1><p>${msg}</p><div class="gate-act"></div></div>`;
    const box = g.querySelector('.gate-act');
    for (const [label, fn, ghost] of actions || []) { const b = document.createElement('button'); b.className = 'btn block' + (ghost ? ' ghost' : ''); b.textContent = label; b.onclick = fn; box.appendChild(b); }
    g.hidden = false;
  }
  const hideGate = () => { const g = document.getElementById('gate'); if (g) g.hidden = true; };

  const ready = (async () => {
    if (!configured) { gate('Falta configurar o Firebase no arquivo <b>js/config.js</b> (passo 1 do LEIA-ME). Enquanto isso, previsão, lua e mapa funcionam; a comunidade fica desligada.', [['Usar sem comunidade', () => hideGate()]]); return false; }
    try {
      await load(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app-compat.js`);
      await Promise.all([load(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-auth-compat.js`), load(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-firestore-compat.js`)]);
      fb = firebase.initializeApp(CFG.firebase); auth = firebase.auth(); fs = firebase.firestore();
      try { await fs.enablePersistence({ synchronizeTabs: true }); } catch { }
      await auth.getRedirectResult().catch(() => null);
      me = await new Promise((ok) => { const off = auth.onAuthStateChanged((u) => { off(); ok(u); }); });
      if (!me) me = await new Promise((ok) => {
        gate('Pesca, maré, lua e a comunidade de pescadores em tempo real.', [
          ['Entrar com Google', async () => { const p = new firebase.auth.GoogleAuthProvider(); try { const r = await auth.signInWithPopup(p); ok(r.user); } catch (e) { if (e && /popup/i.test(e.code || '')) auth.signInWithRedirect(p); else alert('Não foi possível entrar: ' + (e.message || e)); } }],
          ['Entrar como convidado', async () => { try { const r = await auth.signInAnonymously(); ok(r.user); } catch (e) { alert('Ative o login Anônimo no Firebase (passo 1.3 do LEIA-ME).'); } }, true]
        ]);
      });
      hideGate();
      await seed();
      return true;
    } catch (e) {
      console.error(e);
      gate('Não foi possível conectar ao Firebase. Confira o js/config.js e a internet.', [['Usar sem comunidade', () => hideGate()]]);
      return false;
    }
  })();

  // primeiros pontos de pesca (só se o banco estiver vazio)
  async function seed() {
    try {
      const snap = await fs.collection('spots').limit(1).get();
      if (!snap.empty) return;
      const r = await fetch('data/spots.json'); const list = await r.json();
      const batch = fs.batch();
      for (const s of list) { const { id, ...d } = s; batch.set(fs.doc('spots/' + id), { ...d, createdBy: me.uid, ts: Date.now() }); }
      await batch.commit();
    } catch (e) { console.warn('seed', e); }
  }

  /* ---------- db: o Firestore já tem a mesma forma (coleções, docs, onSnapshot) ---------- */
  const wrapErr = (e) => ({ code: e && e.code === 'permission-denied' ? 'invalid_argument' : e && e.code === 'resource-exhausted' ? 'resource_exhausted' : 'unavailable', message: String(e && e.message || e) });
  const db = {
    doc: (p) => wrapRef(fs.doc(p)),
    collection: (p) => wrapQuery(fs.collection(p), true)
  };
  function wrapRef(r) {
    return { id: r.id, path: r.path, get: () => r.get(), set: (d) => r.set(d).catch((e) => { throw wrapErr(e); }), update: (d) => r.update(d).catch((e) => { throw wrapErr(e); }), delete: () => r.delete().catch((e) => { throw wrapErr(e); }),
      onSnapshot: (n, er) => r.onSnapshot({ includeMetadataChanges: false }, n, (e) => er && er(wrapErr(e))), collection: (c) => wrapQuery(r.collection(c), true) };
  }
  function wrapQuery(q, isCol) {
    const o = { where: (f, op, v) => wrapQuery(q.where(f, op, v)), orderBy: (f, d) => wrapQuery(q.orderBy(f, d || 'asc')), limit: (n) => wrapQuery(q.limit(n)), get: () => q.get(),
      onSnapshot: (n, er) => q.onSnapshot(n, (e) => er && er(wrapErr(e))) };
    if (isCol) { o.doc = (id) => wrapRef(id ? q.doc(id) : q.doc()); o.add = (d) => q.add(d).then(wrapRef).catch((e) => { throw wrapErr(e); }); o.path = q.path; }
    return o;
  }

  /* ---------- user ---------- */
  const user = {
    id: async () => me && me.uid, me: async () => ({ name: (me && (me.displayName || (me.isAnonymous ? 'Convidado' : ''))) || 'Pescador' }),
    isOwner: async () => !!(me && CFG.ownerUid && me.uid === CFG.ownerUid), can: async () => true, canEdit: async () => false,
    signOut: async () => { await auth.signOut(); location.reload(); }
  };

  /* ---------- room: presença em Firestore (expira sozinha) ---------- */
  const room = {
    onPeers(fn) {
      const since = () => Date.now() - 10 * 60e3;
      let unsub = null;
      const sub = () => { unsub && unsub(); unsub = fs.collection('presence').where('at', '>', since()).onSnapshot((snap) => {
        fn({ peers: snap.docs.map((d) => ({ kind: 'viewer', by: d.id, peer: d.id, isMe: me && d.id === me.uid, presence: d.data() })) });
      }, () => { }); };
      sub(); setInterval(sub, 5 * 60e3);
      return () => unsub && unsub();
    },
    async presence(patch) {
      if (!me) return;
      const ref = fs.doc('presence/' + me.uid);
      if (!patch.spot) return ref.delete().catch(() => { });
      return ref.set({ spot: patch.spot, since: patch.since || Date.now(), uid: me.uid, at: Date.now() }).catch(() => { });
    }
  };
  addEventListener('pagehide', () => { if (me && fs) fs.doc('presence/' + me.uid).delete().catch(() => { }); });

  /* ---------- assets: foto comprimida guardada no Firestore (não exige plano pago) ---------- */
  async function compress(blob, max = 1280, q = 0.8) {
    const bmp = await createImageBitmap(blob).catch(() => null);
    if (!bmp) throw { code: 'bad_image' };
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    let url = c.toDataURL('image/jpeg', q); if (url.length > 900000) url = c.toDataURL('image/jpeg', 0.6);
    return url;
  }
  const assets = {
    async upload(blob) {
      if (!blob.type.startsWith('image/')) throw { code: 'only_images', message: 'No app hospedado, apenas fotos (sem vídeo).' };
      const data = await compress(blob); const ref = fs.collection('photos').doc();
      await ref.set({ data, uid: me.uid, ts: Date.now() });
      return { id: ref.id, url: data, contentType: 'image/jpeg' };
    }
  };
  window.CARDUME_PHOTO = async (id) => { const d = await fs.doc('photos/' + id).get(); return d.exists ? d.data().data : null; };

  /* ---------- sample: IA com a chave do próprio usuário ---------- */
  const MODELS = { complex: 'claude-opus-5-5', default: 'claude-sonnet-5-5', quick: 'claude-haiku-5-5' };
  const key = () => { try { return JSON.parse(localStorage.getItem('cardume.settings') || '{}').aiKey || ''; } catch { return ''; } };
  async function toB64(blob) {
    const bmp = await createImageBitmap(blob); const s = Math.min(1, 1568 / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.88).split(',')[1];
  }
  async function ask(input, opts = {}, wantJson) {
    const k = key(); if (!k) throw { code: 'not_granted', message: 'Coloque sua chave da IA em Ajustes › Inteligência artificial.' };
    let msgs = typeof input === 'string' ? [{ role: 'user', content: input }] : input.map((m) => ({ role: m.role, content: m.content }));
    // une turnos seguidos do mesmo papel
    msgs = msgs.reduce((a, m) => { const l = a[a.length - 1]; if (l && l.role === m.role) l.content += '\n\n' + m.content; else a.push({ ...m }); return a; }, []);
    if (opts.images && opts.images.length) {
      const last = msgs[msgs.length - 1], imgs = [];
      for (const b of [...opts.images].slice(0, 4)) imgs.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: await toB64(b) } });
      last.content = [...imgs, { type: 'text', text: last.content }];
    }
    const body = { model: MODELS[opts.modelTier] || MODELS.default, max_tokens: 2000, messages: msgs };
    if (wantJson) body.system = 'Responda somente com JSON válido, sem texto antes ou depois.';
    let r;
    try {
      r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', signal: opts.signal, headers: { 'content-type': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify(body) });
    } catch (e) { throw { code: e && e.name === 'AbortError' ? 'cancelled' : 'upstream_error', message: String(e) }; }
    if (!r.ok) { const t = await r.text(); throw { code: r.status === 401 ? 'not_granted' : r.status === 429 ? 'rate_limited' : 'upstream_error', message: t.slice(0, 300) }; }
    const j = await r.json(); const text = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    opts.onText && opts.onText({ text, delta: text });
    return { text, truncated: j.stop_reason === 'max_tokens' };
  }
  const sample = (input, opts) => ask(input, opts, false);
  sample.json = async (input, opts) => {
    const { text } = await ask(input, opts, true);
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/); const raw = m ? m[1] : text.slice(Math.min(...['{', '['].map((c) => { const i = text.indexOf(c); return i < 0 ? 1e9 : i; })), Math.max(text.lastIndexOf('}'), text.lastIndexOf(']')) + 1);
    try { return JSON.parse(raw); } catch { throw { code: 'invalid_json', message: 'Resposta não veio em JSON', text }; }
  };
  sample.limits = async () => ({ maxPromptBytes: 200000, images: key() ? { maxCount: 4, maxInputBytes: 20e6, mediaTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } : undefined });

  /* ---------- mcp: imita o conector Mapbox chamando a API com o token público ---------- */
  const MB = CFG.mapboxToken && !/COLE_AQUI/.test(CFG.mapboxToken) ? CFG.mapboxToken : '';
  const blobToB64 = (b) => new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.readAsDataURL(b); });
  const mcp = {
    async listTools() { return { servers: MB ? [{ server: 'Mapbox', authStatus: 'connected', tools: [] }] : [] }; },
    async callTool(server, tool, input) {
      if (!MB) throw { code: 'server_not_connected', message: 'Token do Mapbox não configurado (js/config.js).' };
      const enc = encodeURIComponent;
      if (tool === 'static_map_image_tool') {
        const ov = (input.overlays || []).filter((o) => o.type === 'marker').map((o) => `pin-${o.size === 'large' ? 'l' : 's'}+${o.color || 'ff6a5c'}(${o.longitude},${o.latitude})`).join(',');
        const url = `https://api.mapbox.com/styles/v1/${input.style || 'mapbox/streets-v12'}/static/${ov ? ov + '/' : ''}${input.center.longitude},${input.center.latitude},${input.zoom},0/${input.size.width}x${input.size.height}${input.highDensity ? '@2x' : ''}?logo=true&attribution=true&access_token=${MB}`;
        const r = await fetch(url); if (!r.ok) throw { code: r.status === 401 ? 'needs_reauth' : 'tool_error', message: 'Mapbox ' + r.status };
        const b = await r.blob(); return { content: [{ type: 'image', data: await blobToB64(b), mimeType: b.type || 'image/png' }] };
      }
      if (tool === 'search_and_geocode_tool') {
        const p = input.proximity ? `&proximity=${input.proximity.longitude},${input.proximity.latitude}` : '', c = input.country ? `&country=${input.country.join(',').toLowerCase()}` : '';
        const urls = [`https://api.mapbox.com/search/searchbox/v1/forward?q=${enc(input.q)}${p}${c}&language=pt&limit=6&access_token=${MB}`, `https://api.mapbox.com/search/geocode/v6/forward?q=${enc(input.q)}${p}${c}&language=pt&limit=6&access_token=${MB}`];
        let features = [];
        for (const u of urls) { try { const r = await fetch(u); if (r.ok) { const j = await r.json(); features = features.concat(j.features || []); } } catch { } if (features.length >= 3) break; }
        return { content: [], structuredContent: { type: 'FeatureCollection', features } };
      }
      if (tool === 'reverse_geocode_tool') {
        const r = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?longitude=${input.longitude}&latitude=${input.latitude}&language=pt&limit=1&access_token=${MB}`);
        const j = r.ok ? await r.json() : { features: [] }; return { content: [], payload: JSON.stringify(j) };
      }
      throw { code: 'not_in_manifest', message: tool };
    }
  };

  window.claude = {
    use: async (name) => {
      const ok = await ready;
      if (name === 'mcp') return mcp;
      if (name === 'sample') return sample;
      if (!ok) return null;
      return { db, user, room, assets }[name] || null;
    }
  };
  // app instalável: guarda os arquivos para abrir mais rápido e sem internet
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
})();
