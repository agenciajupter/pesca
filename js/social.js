/* Cardume · comunidade, perfil, registros, diário, IA e inicialização */
{
const { $, $$, esc, ic, S } = C;
const { fmt, H, D } = Env;
const likeId = (pid) => C.safeId(pid + '__' + S.uid);
const likesOf = (pid) => { let n = 0; for (const v of S.likes.values()) if (v.postId === pid) n++; return n; };
const following = (uid) => S.follows.some((f) => f.from === S.uid && f.to === uid);

/* ---------------- publicação ---------------- */
C.postHtml = (p) => {
  const sp = C.spot(p.spotId), liked = S.uid && S.likes.has(likeId(p.id)), nl = likesOf(p.id), nc = S.comments.filter((c) => c.postId === p.id).length;
  const saved = S.mine.saved.includes(p.id);
  const loc = p.privacy === 'sem' ? 'Local não informado' : sp ? (p.privacy === 'aproximada' ? (sp.region || 'Região aproximada') : sp.name) : 'Local removido';
  const okId = p.photoId && /^[A-Za-z0-9_\-]+$/.test(p.photoId);
  const photo = !okId ? '' : window.CARDUME_HOSTED ? `<img class="photo" data-photo="${esc(p.photoId)}" alt="${esc(p.species || 'Foto do relato')}">` : `<img class="photo" src="/_blob/${esc(p.photoId)}" alt="${esc(p.species || 'Foto do relato')}" loading="lazy">`;
  const c = p.cond || {};
  return `<article class="post ${S.seenPosts.has(p.id) ? 'fresh' : ''}" data-pid="${esc(p.id)}">
   <div class="ph"><button data-user="${esc(p.uid)}" aria-label="Perfil">${C.avatar(p.uid, 'sm')}</button><div class="grow"><b>${esc(C.name(p.uid))}</b><div class="xs muted">${p.privacy !== 'sem' && sp ? `<button class="link" style="font-size:12px" data-spot="${esc(sp.id)}">${esc(loc)}</button>` : esc(loc)} · ${esc(fmt.ago(p.ts))}</div></div>
   ${p.uid !== S.uid && S.uid ? `<button class="chipbtn ${following(p.uid) ? 'on' : ''}" style="height:32px" data-follow="${esc(p.uid)}">${following(p.uid) ? 'Seguindo' : 'Seguir'}</button>` : ''}</div>
   ${photo}
   ${p.kind === 'relato' ? `<div class="catch"><div class="sp" style="font-size:17px">${ic('chat')} Relato do local</div></div>` : `<div class="catch"><div><div class="sp">${esc(p.species || 'Espécie não identificada')}</div>${p.sci ? `<div class="xs muted"><i>${esc(p.sci)}</i></div>` : ''}<div class="xs muted">${p.released ? 'Solto com vida · ' : ''}${esc(p.mode || '')}</div></div>
     <div class="w">${p.weightKg ? `<b class="num">${C.KG(p.weightKg)}</b>` : ''}${p.lengthCm ? `<span class="num">${C.CM(p.lengthCm)}</span>` : ''}</div></div>`}
   ${(p.bait || p.gear) ? `<div class="meta">${p.bait ? `<span class="tag coral">${ic('hook')}<b>${esc(p.bait)}</b></span>` : ''}${p.gear ? `<span class="tag">Equip. <b>${esc(p.gear)}</b></span>` : ''}</div>` : ''}
   ${p.text ? `<div class="txt">${esc(p.text)}</div>` : ''}
   ${c.phase ? `<div class="meta"><span class="tag moon">${ic('moon')}${esc(c.phase)}</span>${c.tide ? `<span class="tag sea">${ic('tide')}Maré ${esc(c.tide)}</span>` : ''}<span class="tag sun">${ic('clock')}<span class="num">${C.hh(c.hour)}</span></span>${p.water ? `<span class="tag">Água: ${esc(p.water)}</span>` : ''}</div>` : ''}
   <div class="bar"><button class="${liked ? 'on' : ''}" data-like="${esc(p.id)}" aria-label="Curtir">${ic('heart')}<span class="num">${nl || ''}</span></button>
    <button data-cmt="${esc(p.id)}" aria-label="Comentários">${ic('chat')}<span class="num">${nc || ''}</span></button>
    <button data-share="${esc(p.id)}" aria-label="Compartilhar">${ic('share')}</button><span class="grow"></span>
    <button data-save="${esc(p.id)}" aria-label="Salvar" style="${saved ? 'color:var(--acc)' : ''}">${ic('bookmark', saved ? 'filled' : '')}</button>
    ${p.uid === S.uid || S.isOwner ? `<button data-del="${esc(p.id)}" aria-label="Excluir">${ic('trash')}</button>` : `<button data-report="${esc(p.id)}" aria-label="Denunciar">${ic('flag')}</button>`}</div></article>`;
};

/* ---------------- COMUNIDADE ---------------- */
C.views.comunidade = () => {
  const v = $('#v-comunidade'), tab = S.commTab;
  const tabs = [['agora', 'Agora'], ['feed', 'Feed'], ['seguindo', 'Seguindo'], ['ranking', 'Ranking']];
  let list = S.posts;
  if (tab === 'agora') list = S.posts.filter((p) => Date.now() - p.ts < 6 * H);
  if (tab === 'seguindo') { const fol = new Set(S.follows.filter((f) => f.from === S.uid).map((f) => f.to)); list = S.posts.filter((p) => fol.has(p.uid)); }
  v.innerHTML = `<div class="top"><div class="who"><div class="hello">Rede da pesca${S.dbState === 'ok' ? ' · <span class="live">ao vivo</span>' : ''}</div><h1>Comunidade</h1></div>${C.gear()}</div>
  ${C.dataBanner()}
  <div class="tabs"><div class="seg">${tabs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="comm" data-t="${k}">${l}</button>`).join('')}</div></div>
  ${tab === 'ranking' ? C.rankingHtml() : list.length ? list.slice(0, 80).map(C.postHtml).join('') : tab === 'seguindo' ? `<div class="empty">${ic('users')}<b>Você ainda não segue ninguém</b>Toque em “Seguir” em uma publicação do feed.</div>` : tab === 'agora' && S.posts.length ? `<div class="empty">${ic('clock')}<b>Nada nas últimas 6 horas</b>Veja o feed completo ou registre a primeira captura do dia.</div>` : C.emptyFeed()}
  <div class="spacer"></div>`;
};
C.rankingHtml = () => {
  const since = Date.now() - 30 * D, by = new Map();
  for (const p of S.posts) { if (p.ts < since || p.kind === 'relato') continue; const o = by.get(p.uid) || { uid: p.uid, n: 0, sp: new Set(), rel: 0 }; o.n++; o.sp.add(p.species); if (p.released) o.rel++; by.set(p.uid, o); }
  const rows = [...by.values()].sort((a, b) => b.sp.size - a.sp.size || b.rel - a.rel || b.n - a.n).slice(0, 20);
  return `<div class="note" style="margin-bottom:12px">Ranking dos últimos 30 dias por <b>diversidade de espécies</b> e <b>solturas</b> — premiamos conhecimento e pesca consciente, não volume abatido.</div>
  ${rows.length ? `<div class="list">${rows.map((r, i) => `<button data-user="${esc(r.uid)}"><span class="rank num">${i + 1}</span>${C.avatar(r.uid, 'sm')}<span class="grow"><b>${esc(C.name(r.uid))}</b><br><span class="xs muted num">${r.sp.size} espécies · ${r.rel} solturas · ${r.n} registros</span></span></button>`).join('')}</div>` : `<div class="empty">${ic('medal')}<b>Ranking vazio</b>Os registros dos últimos 30 dias formam o ranking.</div>`}`;
};

/* ---------------- PERFIL ---------------- */
C.statsFor = (uid) => {
  const mine = S.posts.filter((p) => p.uid === uid && p.kind !== 'relato');
  const big = mine.filter((p) => p.weightKg).sort((a, b) => b.weightKg - a.weightKg)[0];
  const sp = [...mine.reduce((m, p) => m.set(p.species, (m.get(p.species) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]);
  const spots = [...mine.reduce((m, p) => m.set(p.spotId, (m.get(p.spotId) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]);
  const hours = Array(24).fill(0); mine.forEach((p) => { if (p.cond) hours[p.cond.hour]++; });
  const months = Array(6).fill(0); const now = new Date(); mine.forEach((p) => { const d = new Date(p.ts); const k = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth(); if (k >= 0 && k < 6) months[5 - k]++; });
  const relatos = S.posts.filter((p) => p.uid === uid && p.kind === 'relato').length;
  return { mine, big, sp, spots, hours, months, relatos, released: mine.filter((p) => p.released).length };
};
C.medals = (st) => [
  ['Primeira captura', st.mine.length >= 1], ['10 capturas', st.mine.length >= 10], ['Madrugador', st.mine.some((p) => p.cond && p.cond.hour < 6)],
  ['Explorador · 3 pontos', st.spots.length >= 3], ['5 espécies', st.sp.length >= 5], ['Pesca consciente · 5 solturas', st.released >= 5], ['Cronista · 5 relatos', st.relatos >= 5]];

C.views.perfil = () => {
  const v = $('#v-perfil'), uid = S.uid, prof = (uid && S.profiles.get(uid)) || {}, st = C.statsFor(uid);
  const mx = Math.max(1, ...st.months), mnames = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 5 + i); return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(d).replace('.', ''); });
  const followers = S.follows.filter((f) => f.to === uid).length, followingN = S.follows.filter((f) => f.from === uid).length;
  v.innerHTML = `<div class="phead"><span class="avatar lg">${esc(C.initials(C.myName()))}</span><div class="grow"><h1 style="font-size:24px">${esc(C.myName())}</h1>
    <div class="sm muted">${esc([prof.city, prof.level].filter(Boolean).join(' · ') || 'Complete seu perfil')}</div><div class="xs muted num" style="margin-top:4px">${followers} seguidores · ${followingN} seguindo</div></div>
    <button class="iconbtn" data-act="editprofile" aria-label="Editar perfil">${ic('edit')}</button>${C.gear()}</div>
  ${prof.bio ? `<p class="pad sm" style="margin:-6px 0 0">${esc(prof.bio)}</p>` : ''}
  ${(prof.modes || []).length || (prof.species || []).length ? `<div class="pad chips" style="margin-top:10px">${[...(prof.modes || []), ...(prof.species || [])].map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>` : ''}
  ${C.dataBanner()}
  <section class="sec"><div class="statgrid"><div><b class="num">${st.mine.length}</b><span>capturas</span></div><div><b class="num">${st.big ? C.KG(st.big.weightKg) : '—'}</b><span>${st.big ? esc(st.big.species) : 'maior peixe'}</span></div><div><b class="num">${st.sp.length}</b><span>espécies</span></div></div></section>
  <section class="sec"><header><h2>Evolução mensal</h2></header><div class="card"><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;align-items:end;height:90px">${st.months.map((n) => `<div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;align-items:center;gap:4px"><span class="xs num">${n || ''}</span><i style="display:block;width:100%;height:${Math.max(4, n / mx * 70)}px;border-radius:6px;background:var(--acc);opacity:${n ? 1 : .2}"></i></div>`).join('')}</div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);text-align:center" class="xs muted">${mnames.map((m) => `<span>${esc(m)}</span>`).join('')}</div></div></section>
  <section class="sec"><header><h2>Recordes e preferências</h2></header><div class="list">
    <div>${ic('fish')}<span class="grow">Espécie mais capturada</span><b>${st.sp[0] ? esc(st.sp[0][0]) : '—'}</b></div>
    <div>${ic('pin')}<span class="grow">Local mais visitado</span><b>${st.spots[0] && C.spot(st.spots[0][0]) ? esc(C.spot(st.spots[0][0]).name) : '—'}</b></div>
    <div>${ic('clock')}<span class="grow">Seu melhor horário</span><b class="num">${st.mine.length >= 3 ? C.hh(st.hours.indexOf(Math.max(...st.hours))) : '—'}</b></div>
    <div>${ic('heart')}<span class="grow">Solturas</span><b class="num">${st.released}</b></div></div></section>
  <section class="sec"><header><h2>Medalhas</h2></header><div class="medals">${C.medals(st).map(([n, on]) => `<div class="medal ${on ? 'on' : ''}">${ic('medal')}${esc(n)}</div>`).join('')}</div></section>
  <section class="sec"><header><h2>Diário de pescarias</h2>${S.mine.session ? '<span class="live">Em andamento</span>' : ''}</header>
    ${S.sessions.length ? `<div class="list">${S.sessions.slice(0, 12).map((s) => `<button data-act="sessionview" data-id="${esc(s.id)}">${ic('calendar')}<span class="grow"><b>${esc(s.spotName || 'Pescaria')}</b><br><span class="xs muted num">${esc(fmt.day(new Date(s.start)))} · ${fmt.time(new Date(s.start))}–${fmt.time(new Date(s.end))} · ${s.catches || 0} capturas</span></span>${ic('next')}</button>`).join('')}</div>${S.sessions.length >= 2 ? C.sessionCompare() : ''}` : `<div class="empty">${ic('calendar')}<b>Nenhuma pescaria registrada</b>Use “Iniciar pescaria” em um ponto: ao encerrar, geramos o relatório da sessão.</div>`}</section>
  <section class="sec"><div class="list">
    <button data-act="settings">${ic('gear')}<span class="grow">Ajustes<br><span class="xs muted">Tema, unidades, região, notificações e privacidade</span></span>${ic('next')}</button>
    ${S.isOwner ? `<button data-act="moderation">${ic('flag')}<span class="grow">Moderação<br><span class="xs muted num">${S.reports.length} denúncia(s)</span></span>${ic('next')}</button>` : ''}</div></section>
  <p class="pad xs dim" style="margin-top:14px">Conta: ${S.uid ? 'conectada via Claude' : 'não conectada'} · Banco: ${{ ok: 'online', carregando: 'conectando', lento: 'lento', erro: 'erro', off: 'indisponível' }[S.dbState]}</p>
  <div class="spacer"></div>`;
};
C.sessionCompare = () => {
  const g = new Map();
  for (const s of S.sessions) { const k = (s.cond && s.cond.phase) || '—'; const o = g.get(k) || { n: 0, c: 0, h: 0 }; o.n++; o.c += s.catches || 0; o.h += (s.end - s.start) / H; g.set(k, o); }
  const rows = [...g].map(([k, o]) => ({ k, rate: o.h ? o.c / o.h : 0, ...o })).sort((a, b) => b.rate - a.rate);
  return `<div class="card" style="margin-top:10px"><b class="sm">Seus resultados por fase da lua</b><table class="tbl" style="margin-top:6px"><thead><tr><th>Fase</th><th class="r">Sessões</th><th class="r">Capturas/h</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.k)}</td><td class="r num">${r.n}</td><td class="r num">${fmt.n(r.rate, 2)}</td></tr>`).join('')}</tbody></table><div class="xs muted" style="margin-top:6px">Comparação pessoal; com poucas sessões, trate como indício.</div></div>`;
};

/* ---------------- ações ---------------- */
C.actions = async (t) => {
  const a = t.dataset.act;
  if (t.dataset.like) return toggleLike(t.dataset.like, t);
  if (t.dataset.cmt) return openComments(t.dataset.cmt);
  if (t.dataset.follow) return toggleFollow(t.dataset.follow);
  if (t.dataset.user) return openUser(t.dataset.user);
  if (t.dataset.save) { const id = t.dataset.save, s = new Set(S.mine.saved); s.has(id) ? s.delete(id) : s.add(id); await C.saveMine({ saved: [...s] }); C.toast(s.has(id) ? 'Salvo' : 'Removido dos salvos', 'bookmark'); C.render(); return; }
  if (t.dataset.share) { const p = S.posts.find((x) => x.id === t.dataset.share); if (!p) return; const sp = C.spot(p.spotId); const txt = `${p.species || 'Relato'}${p.weightKg ? ' · ' + fmt.n(p.weightKg, 1) + ' kg' : ''}${sp && p.privacy !== 'sem' ? ' · ' + (p.privacy === 'aproximada' ? sp.region : sp.name) : ''} — via Cardume`; navigator.clipboard?.writeText(txt).then(() => C.toast('Texto copiado para compartilhar', 'share'), () => C.toast('Não foi possível copiar', 'share')); return; }
  if (t.dataset.report) return reportPost(t.dataset.report);
  if (t.dataset.del) return deletePost(t.dataset.del);
  if (!a) return;
  if (C.mapAct && C.mapAct(t)) return;
  switch (a) {
    case 'pickspot': return C.pickSpot();
    case 'setcur': await C.saveMine({ current: t.dataset.id }); C.closeSheet(); C.render(); return;
    case 'closepage': return C.closePage();
    case 'species': return speciesPicker();
    case 'method': return methodology();
    case 'sources': return sources();
    case 'ai': return C.assistant();
    case 'comm': S.commTab = t.dataset.t; C.render(); return;
    case 'hist': S.histRange = +t.dataset.d; C.refreshSpot(); return;
    case 'fav': { const id = t.dataset.id, f = new Set(S.mine.favorites); f.has(id) ? f.delete(id) : f.add(id); await C.saveMine({ favorites: [...f] }); C.toast(f.has(id) ? 'Adicionado aos favoritos' : 'Removido dos favoritos', 'star'); C.refreshSpot(); return; }
    case 'session': return S.mine.session ? endSession() : startSessionPick();
    case 'startsession': return startSession(t.dataset.id);
    case 'endsession': return endSession();
    case 'capture': return C.captureForm(t.dataset.id);
    case 'report': return reportForm(t.dataset.id);
    case 'editprofile': return C.onboarding(true);
    case 'settings': return C.openSettings();
    case 'signout': return C.cap.user && C.cap.user.signOut && C.cap.user.signOut();
    case 'privacy': return privacyPicker();
    case 'moderation': return moderation();
    case 'wipe': return wipeData();
    case 'sessionview': return sessionReport(S.sessions.find((s) => s.id === t.dataset.id));
    case 'qm': C.closeSheet(); setTimeout(() => ({ capture: () => C.captureForm(), session: () => (S.mine.session ? endSession() : startSessionPick()), report: () => reportForm(), ai: () => C.assistant(), id: () => C.captureForm(null, true) })[t.dataset.k](), 250); return;
  }
};

async function toggleLike(pid, btn) {
  if (!C.needDb()) return;
  const id = likeId(pid), ref = C.cap.db.doc('likes/' + id);
  btn.classList.add('pop'); setTimeout(() => btn.classList.remove('pop'), 400);
  try { if (S.likes.has(id)) await ref.delete(); else await ref.set({ postId: pid, uid: S.uid, ts: Date.now() }); } catch (e) { C.dbError(e); }
}
async function toggleFollow(uid) {
  if (!C.needDb()) return;
  const id = C.safeId(S.uid + '__' + uid), ref = C.cap.db.doc('follows/' + id);
  try { if (following(uid)) await ref.delete(); else { await ref.set({ from: S.uid, to: uid, ts: Date.now() }); C.toast('Agora você segue ' + C.name(uid), 'users'); } } catch (e) { C.dbError(e); }
}
function openComments(pid) {
  const draw = () => {
    const b = $('#cmtList'); if (!b) return;
    const list = S.comments.filter((c) => c.postId === pid);
    b.innerHTML = list.length ? list.map((c) => `<div style="display:flex;gap:10px;padding:10px 18px">${C.avatar(c.uid, 'sm')}<div style="flex:1"><b class="sm">${esc(C.name(c.uid))}</b> <span class="xs muted">${esc(fmt.ago(c.ts))}</span><div class="sm" style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(c.text)}</div></div>${c.uid === S.uid || S.isOwner ? `<button class="iconbtn" style="width:36px;height:36px;border:0;background:none" data-delc="${esc(c.id)}" aria-label="Excluir comentário">${ic('trash')}</button>` : ''}</div>`).join('') : `<div class="empty" style="margin-top:6px">${ic('chat')}<b>Sem comentários</b>Comece a conversa.</div>`;
  };
  C.sheet('Comentários', `<div id="cmtList"></div><form id="cmtForm" class="chatin" style="position:sticky;bottom:0"><input class="input" name="t" maxlength="500" placeholder="Escreva um comentário" autocomplete="off" aria-label="Comentário"><button class="btn" type="submit" aria-label="Enviar">${ic('send')}</button></form>`, (b) => {
    draw(); C.onComments = draw;
    b.addEventListener('click', async (e) => { const d = e.target.closest('[data-delc]'); if (!d) return; try { await C.cap.db.doc('comments/' + d.dataset.delc).delete(); } catch (er) { C.dbError(er); } });
    $('#cmtForm', b).onsubmit = async (e) => { e.preventDefault(); if (!C.needDb()) return; const v = e.target.t.value.trim(); if (!v) return; e.target.t.value = '';
      try { await C.cap.db.collection('comments').add({ postId: pid, uid: S.uid, text: v.slice(0, 500), ts: Date.now() }); } catch (er) { C.dbError(er); } };
  });
  C.onSheetClose = () => { C.onComments = null; };
}
function openUser(uid) {
  const p = S.profiles.get(uid) || {}, st = C.statsFor(uid);
  C.sheet(C.name(uid), `<div class="phead" style="padding-top:0">${C.avatar(uid, 'lg')}<div class="grow"><div class="sm muted">${esc([p.city, p.level].filter(Boolean).join(' · '))}</div>${p.bio ? `<p class="sm" style="margin:6px 0 0">${esc(p.bio)}</p>` : ''}</div></div>
  <div class="statgrid"><div><b class="num">${st.mine.length}</b><span>capturas</span></div><div><b class="num">${st.sp.length}</b><span>espécies</span></div><div><b class="num">${st.released}</b><span>solturas</span></div></div>
  ${uid !== S.uid && S.uid ? `<div class="pad" style="margin-top:14px"><button class="btn block ${following(uid) ? 'ghost' : ''}" data-follow="${esc(uid)}">${following(uid) ? 'Deixar de seguir' : 'Seguir'}</button></div>` : ''}
  <section class="sec"><header><h2>Publicações</h2></header>${S.posts.filter((x) => x.uid === uid).slice(0, 10).map(C.postHtml).join('') || '<div class="empty">Sem publicações.</div>'}</section>`);
}
async function reportPost(pid) {
  if (!C.needDb()) return;
  C.sheet('Denunciar publicação', `<div class="form"><div class="chips" id="rr">${['Spam', 'Conteúdo ofensivo', 'Pesca ilegal ou espécie protegida', 'Informação falsa', 'Expõe a localização de alguém'].map((r) => `<button type="button" data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div><button class="btn block" id="rgo" disabled>Enviar denúncia</button><p class="xs muted">A moderação revisa cada denúncia. Quem publicou não é notificado de quem denunciou.</p></div>`, (b) => {
    let r = null; $$('#rr button', b).forEach((x) => x.onclick = () => { r = x.dataset.r; $$('#rr button', b).forEach((y) => y.classList.toggle('on', y === x)); $('#rgo', b).disabled = false; });
    $('#rgo', b).onclick = async () => { try { await C.cap.db.collection('reports').add({ postId: pid, reason: r, by: S.uid, ts: Date.now() }); C.closeSheet(); C.toast('Denúncia enviada. Obrigado.', 'flag'); } catch (e) { C.dbError(e); } };
  });
}
async function deletePost(pid) {
  C.sheet('Excluir publicação?', `<div class="pad"><p class="muted" style="margin-top:0">Esta ação não pode ser desfeita.</p><div class="row2"><button class="btn ghost" type="button">Cancelar</button><button class="btn danger" id="delgo">${ic('trash')}Excluir</button></div></div>`, (b) => {
    b.querySelector('.btn.ghost').onclick = C.closeSheet;
    $('#delgo', b).onclick = async () => { try { await C.cap.db.doc('posts/' + pid).delete(); C.closeSheet(); C.toast('Publicação excluída', 'trash'); } catch (e) { C.dbError(e); } };
  });
}

/* ---------------- registro de captura ---------------- */
const MODES = ['Praia', 'Costão', 'Píer/mureta', 'Embarcada', 'Rio', 'Lago/represa', 'Esportiva'];
C.captureForm = (spotId, aiFirst) => {
  if (!C.needDb()) return;
  const list = C.allSpots();
  if (!list.length) { C.toast('Cadastre um ponto no mapa antes de registrar.', 'pin'); C.go('mapa'); return; }
  const sel = spotId || (S.mine.session && S.mine.session.spotId) || C.cur().id || list[0].id;
  const sp0 = C.spot(sel);
  const spList = Object.keys(Env.SPECIES);
  C.sheet('Registrar captura', `<form class="form" id="capForm">
   <label class="field"><span>Ponto</span><select class="input" name="spot">${list.map((s) => `<option value="${esc(s.id)}" ${s.id === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
   <div class="field"><span>Fotos (até 3) ou vídeo curto</span><label class="photoPick"><img id="capPrev" alt="" hidden><span style="flex:1" class="sm muted" id="capPh">${ic('camera')} Toque para escolher. A 1ª foto vai na publicação; as outras ajudam a IA (cabeça, cauda).</span><input type="file" name="photo" accept="image/*,video/mp4" multiple hidden></label>
     <button type="button" class="btn ghost" id="aiId" hidden>${ic('spark')}Identificar espécie com IA</button><div class="xs muted" id="aiTip">${esc(ID_TIPS)}</div><div id="aiOut"></div></div>
   <input type="hidden" name="sci"><label class="field"><span>Espécie</span><input class="input" name="species" list="spl" required maxlength="60" placeholder="Ex.: Robalo-flecha"><datalist id="spl">${spList.map((s) => `<option value="${esc(s)}">`).join('')}</datalist></label>
   <div class="row2"><label class="field"><span>Peso (${C.cfg.weight === 'lb' ? 'lb' : 'kg'})</span><input class="input" name="w" inputmode="decimal" placeholder="0,0"></label><label class="field"><span>Comprimento (${C.cfg.length === 'in' ? 'pol' : 'cm'})</span><input class="input" name="l" inputmode="decimal" placeholder="0"></label></div>
   <div class="row2"><label class="field"><span>Isca</span><input class="input" name="bait" maxlength="40" placeholder="Camarão vivo"></label><label class="field"><span>Equipamento</span><input class="input" name="gear" maxlength="60" placeholder="Molinete 3000, linha 0,30"></label></div>
   <div class="field"><span>Modalidade</span><div class="chips" id="modes">${MODES.map((m, i) => `<button type="button" class="${(sp0 && sp0.kind === 'praia' && i === 0) || (sp0 && sp0.kind === 'costao' && i === 1) || (sp0 && ['mureta', 'pier', 'molhe'].includes(sp0.kind) && i === 2) ? 'on' : ''}" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div></div>
   <label class="field"><span>Observações sobre a água e o local</span><textarea class="input" name="text" maxlength="600" placeholder="Água clara, cardume de sardinha na superfície…"></textarea></label>
   <div class="toggle"><span><b>Solto com vida</b><br><span class="xs muted">Conta para medalhas de pesca consciente</span></span><button type="button" class="sw" id="rel" aria-pressed="false" aria-label="Solto com vida"></button></div>
   <div class="field"><span>Localização na publicação</span><div class="seg" id="priv">${[['exata', 'Ponto exato'], ['aproximada', 'Só a região'], ['sem', 'Sem local']].map(([k, l]) => `<button type="button" class="${(S.mine.privacy || 'aproximada') === k ? 'on' : ''}" data-p="${k}">${l}</button>`).join('')}</div></div>
   <div class="note" style="margin:0">As condições do momento (lua ${C.src('a', 'real')}, maré ${C.src('b', 'modelo')}, horário) são anexadas automaticamente. Respeite tamanhos mínimos e períodos de defeso (IBAMA/MPA).</div>
   <button class="btn block" type="submit" id="capGo">${ic('fish')}Publicar captura</button></form>`, async (b) => {
    let mode = ($('#modes .on', b) || {}).dataset?.m || '', priv = S.mine.privacy || 'aproximada', released = false, file = null;
    $$('#modes button', b).forEach((x) => x.onclick = () => { mode = x.dataset.m; $$('#modes button', b).forEach((y) => y.classList.toggle('on', y === x)); });
    $$('#priv button', b).forEach((x) => x.onclick = () => { priv = x.dataset.p; $$('#priv button', b).forEach((y) => y.classList.toggle('on', y === x)); });
    $('#rel', b).onclick = (e) => { released = !released; e.currentTarget.classList.toggle('on', released); e.currentTarget.setAttribute('aria-pressed', released); };
    const lim = C.cap.sample ? await C.cap.sample.limits().catch(() => null) : null;
    let allFiles = [];
    $('[name=photo]', b).onchange = (e) => { allFiles = [...e.target.files].slice(0, 3); file = allFiles[0] || null; if (!file) return; const u = URL.createObjectURL(file); const im = $('#capPrev', b); if (file.type.startsWith('image/')) { im.src = u; im.hidden = false; } $('#capPh', b).textContent = allFiles.length > 1 ? `${allFiles.length} fotos escolhidas` : file.name; $('#aiId', b).hidden = !(lim && lim.images && file.type.startsWith('image/')); if (aiFirst && !$('#aiId', b).hidden) $('#aiId', b).click(); };
    $('#aiId', b).onclick = () => C.identify(allFiles, $('#aiOut', b), (name, sci) => { $('[name=species]', b).value = name; $('[name=sci]', b).value = sci || ''; }, C.spot($('[name=spot]', b).value));
    if (aiFirst) setTimeout(() => $('[name=photo]', b).click(), 300);
    $('#capForm', b).onsubmit = async (e) => {
      e.preventDefault(); const f = new FormData(e.target), go = $('#capGo', b); go.disabled = true; go.textContent = 'Publicando…';
      const spotId2 = f.get('spot'), sp = C.spot(spotId2), now = new Date();
      let photoId = null;
      try {
        if (file) { if (!C.cap.assets) throw { code: 'noassets' }; if (file.size > 20 * 1024 * 1024) throw { code: 'big' }; const r = await C.cap.assets.upload(file); photoId = r.id; }
        const num = (v) => { const n = parseFloat(String(v || '').replace(',', '.')); return isFinite(n) && n > 0 ? +n.toFixed(2) : null; };
        await C.cap.db.collection('posts').add({ kind: 'captura', uid: S.uid, spotId: spotId2, species: String(f.get('species')).trim().slice(0, 60), sci: String(f.get('sci') || '').trim().slice(0, 80) || null, weightKg: num(f.get('w')) && +(num(f.get('w')) / (C.cfg.weight === 'lb' ? 2.20462 : 1)).toFixed(3), lengthCm: num(f.get('l')) && +(num(f.get('l')) * (C.cfg.length === 'in' ? 2.54 : 1)).toFixed(1), bait: String(f.get('bait') || '').trim(), gear: String(f.get('gear') || '').trim(), mode, text: String(f.get('text') || '').trim(), released, privacy: priv, photoId, water: sp ? sp.water : null, cond: C.condSnap(sp || C.cur(), now), sessionId: S.mine.session ? S.mine.session.id : null, ts: Date.now() });
        C.closeSheet(); C.toast('Captura publicada no ponto e na comunidade', 'fish');
      } catch (err) {
        go.disabled = false; go.innerHTML = ic('fish') + 'Publicar captura';
        if (err && err.code === 'only_images') C.toast('No app hospedado, envie só fotos (vídeo ainda não).', 'camera');
        else if (err && err.code === 'noassets') C.toast('Envio de fotos não está liberado para sua conta. Publique sem foto.', 'camera');
        else if (err && err.code === 'big') C.toast('Arquivo acima de 20 MB.', 'camera');
        else C.dbError(err);
      }
    };
  });
};
function reportForm(spotId) {
  if (!C.needDb()) return;
  const list = C.allSpots(); if (!list.length) { C.toast('Cadastre um ponto no mapa primeiro.', 'pin'); return; }
  const sel = spotId || C.cur().id || list[0].id;
  C.sheet('Relato do local', `<form class="form" id="repForm"><label class="field"><span>Ponto</span><select class="input" name="spot">${list.map((s) => `<option value="${esc(s.id)}" ${s.id === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
   <label class="field"><span>O que você está vendo?</span><textarea class="input" name="text" required maxlength="800" placeholder="Água turva, muita alga, ventou nordeste forte desde as 15h…"></textarea></label>
   <div class="chips" id="qt">${['Água clara', 'Água turva', 'Mar mexido', 'Mar calmo', 'Isca na superfície', 'Lotado', 'Vazio'].map((q) => `<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
   <button class="btn block" type="submit">Publicar relato</button></form>`, (b) => {
    $$('#qt button', b).forEach((x) => x.onclick = () => { const ta = $('[name=text]', b); ta.value = (ta.value ? ta.value.trim() + ' · ' : '') + x.dataset.q; });
    $('#repForm', b).onsubmit = async (e) => { e.preventDefault(); const f = new FormData(e.target), sp = C.spot(f.get('spot'));
      try { await C.cap.db.collection('posts').add({ kind: 'relato', uid: S.uid, spotId: f.get('spot'), text: String(f.get('text')).trim().slice(0, 800), privacy: 'exata', water: sp ? sp.water : null, cond: C.condSnap(sp || C.cur(), new Date()), ts: Date.now() }); C.closeSheet(); C.toast('Relato publicado', 'chat'); } catch (er) { C.dbError(er); } };
  });
}

/* ---------------- sessões de pesca (diário + presença) ---------------- */
function startSessionPick() {
  const list = C.allSpots(); if (!list.length) { C.toast('Cadastre um ponto no mapa primeiro.', 'pin'); C.go('mapa'); return; }
  C.sheet('Onde você vai pescar?', `<div class="list">${list.map((s) => `<button data-act="startsession" data-id="${esc(s.id)}">${ic('pin')}<span class="grow"><b>${esc(s.name)}</b><br><span class="xs muted">${C.activeAt(s.id).length} ativos agora</span></span>${ic('play')}</button>`).join('')}</div>`);
}
async function startSession(spotId) {
  if (!C.needDb()) return;
  const sp = C.spot(spotId);
  const sess = { id: 'session-' + Date.now().toString(36), spotId, spotName: sp ? sp.name : '', start: Date.now(), share: C.cfg.sharePresence !== false, cond: C.condSnap(sp || C.cur(), new Date()) };
  await C.saveMine({ session: sess, current: spotId });
  C.pushPresence(); C.closeSheet();
  C.toast(`Pescaria iniciada em ${sp ? sp.name : 'ponto'}${sess.share ? ' · presença compartilhada' : ''}`, 'play');
  C.render();
}
async function endSession() {
  const s = S.mine.session; if (!s) return;
  const end = Date.now(), catches = S.posts.filter((p) => p.uid === S.uid && p.ts >= s.start && p.ts <= end && p.kind !== 'relato');
  const doc = { type: 'session', spotId: s.spotId, spotName: s.spotName, start: s.start, end, cond: s.cond, catches: catches.length, species: [...new Set(catches.map((p) => p.species))], best: catches.filter((p) => p.weightKg).sort((a, b) => b.weightKg - a.weightKg)[0]?.species || null };
  try { await C.cap.db.doc(`data/users/${S.uid}/${s.id}`).set(doc); } catch (e) { C.dbError(e); }
  await C.saveMine({ session: null }); C.pushPresence(); C.render();
  sessionReport({ id: s.id, ...doc });
}
function sessionReport(s) {
  if (!s) return;
  const dur = (s.end - s.start) / H, sp = C.spot(s.spotId), list = S.posts.filter((p) => p.uid === S.uid && p.ts >= s.start && p.ts <= s.end);
  const da = sp ? Env.dayActivity(sp, new Date(s.start)) : null;
  C.sheet('Relatório da pescaria', `<div class="pad"><div class="xs muted">${esc(fmt.dayLong(new Date(s.start)))}</div><h2 style="margin:2px 0 12px">${esc(s.spotName || 'Pescaria')}</h2></div>
   <div class="statgrid"><div><b class="num">${fmt.n(dur, 1)} h</b><span>duração</span></div><div><b class="num">${s.catches || 0}</b><span>capturas</span></div><div><b class="num">${(s.species || []).length}</b><span>espécies</span></div></div>
   <section class="sec"><header><h2>Condições no início</h2></header><div class="cond">
    <div><span>Lua</span><b>${esc(s.cond?.phase || '—')}</b><em>${C.src('a', 'Astronômico')}</em></div><div><span>Maré</span><b>${esc(s.cond?.tide || 'n/a')}</b><em>${C.src('b', 'Modelo')}</em></div>
    <div><span>Horário</span><b class="num">${fmt.time(new Date(s.start))}–${fmt.time(new Date(s.end))}</b><em>&nbsp;</em></div><div><span>Vento</span><b class="num">${s.cond?.wind ?? '—'} km/h</b><em>${C.src('s')}</em></div></div></section>
   ${da ? `<section class="sec"><header><h2>Atividade estimada naquele dia</h2></header>${C.actBars(da.hours, -1, da.best)}</section>` : ''}
   <section class="sec"><header><h2>Registros da sessão</h2></header>${list.length ? list.map(C.postHtml).join('') : '<div class="empty">Nenhuma captura registrada durante a sessão.</div>'}</section>`);
}

/* ---------------- IA: assistente e identificação ---------------- */
C.aiContext = () => {
  const sp = S.openSpot === '__virtual' ? S.virtualSpot : (S.openSpot ? C.spot(S.openSpot) : C.cur());
  const now = new Date(), fi = Env.fishingIndex(sp, now, S.species), mi = Astro.moonInfo(now), ctx = fi.da.ctx, t = sp.water !== 'doce' ? Env.tideState(sp, now) : null;
  const ser = t ? Env.tideSeries(sp, now.getTime(), 30).ext.slice(0, 4).map((e) => `${e.type} ${fmt.time(new Date(e.t))} ${e.v.toFixed(2)} m`) : [];
  const tom = Env.dayActivity(sp, new Date(now.getTime() + D), S.species);
  const reg = S.posts.filter((p) => p.spotId === sp.id && p.kind !== 'relato');
  const sp7 = [...reg.filter((p) => p.ts > Date.now() - 30 * D).reduce((m, p) => m.set(p.species, (m.get(p.species) || 0) + 1), new Map())];
  const rel = S.posts.filter((p) => p.spotId === sp.id && p.kind === 'relato').slice(0, 3).map((p) => `${fmt.ago(p.ts)}: ${p.text.slice(0, 160)}`);
  return `CONTEXTO DO APP CARDUME (gerado agora, ${fmt.dayLong(now)} ${fmt.time(now)}, horário de Brasília)
Ponto: ${sp.name} (${sp.lat.toFixed(5)}, ${sp.lon.toFixed(5)}), ${C.kindLabel(sp.kind)}, água ${sp.water || 'salgada'}, região ${sp.region || 'n/d'}.
[ASTRONÔMICO — calculado, confiável] Lua: ${mi.name}, ${Math.round(mi.fraction * 100)}% iluminada, idade ${mi.age.toFixed(1)} dias. Nascer da lua ${fmt.time(ctx.moon.rise)}, pôr ${fmt.time(ctx.moon.set)}, passagem ${fmt.time(ctx.moon.transit)}. Sol ${fmt.time(ctx.sun.rise)}–${fmt.time(ctx.sun.set)}. Próximas fases: ${Astro.nextPhases(now, 4).map((p) => p.name + ' ' + fmt.dm(p.date)).join(', ')}.
[MARÉ — modelo harmônico simplificado, estimativa, não oficial] ${t ? `${t.state}, ${t.h.toFixed(2)} m; próximas: ${ser.join('; ')}` : 'não se aplica (água doce)'}.
${C.wxReal(fi.now.w) ? '[CLIMA E MAR — previsão de modelo Open-Meteo, real]' : '[CLIMA E MAR — SIMULADOS, integração com API meteorológica não disponível nesta visualização; não trate como reais]'} vento ${fi.now.w.wind} km/h ${fmt.dir(fi.now.w.windDir)}, pressão ${fi.now.w.pressure} hPa, chuva ${fi.now.w.rainProb}%, ondas ${fi.now.w.waveH} m.
[ESTIMATIVA DO MODELO] Índice de pesca ${fi.idx}/100 (${Env.verdict(fi.idx)}). Melhor janela hoje ${C.hh(fi.da.best.from)}–${C.hh(fi.da.best.to)}; amanhã ${C.hh(tom.best.from)}–${C.hh(tom.best.to)}. ${S.species ? 'Espécie selecionada: ' + S.species : ''}
[COMUNIDADE — relatos de usuários, não oficiais] ${reg.length} capturas registradas neste ponto no total; últimos 30 dias por espécie: ${sp7.map(([k, n]) => k + ' ' + n).join(', ') || 'nenhuma'}. Relatos recentes: ${rel.join(' | ') || 'nenhum'}.
Pescadores ativos agora no ponto: ${sp.id ? C.activeAt(sp.id).length : 0}.`;
};
const RULES = `Você é o Assistente de Pesca do app Cardume. Responda em português do Brasil, de forma prática e curta (até ~150 palavras, use listas curtas quando ajudar).
Regras: baseie-se SOMENTE no contexto abaixo e em conhecimento geral consolidado de pesca. Diga de onde vem cada dado importante (astronômico, modelo, simulado, comunidade). Os dados de clima/mar estão SIMULADOS: avise se a resposta depender deles. Nunca invente capturas, números ou regras. Estimativas não são garantia de captura. Para tamanhos mínimos e defeso, oriente a conferir as normas vigentes do IBAMA/MPA e órgãos estaduais. Não incentive pesca predatória ou ilegal. Se faltar dado, diga que falta.`;
C.assistant = () => {
  const turns = S.aiTurns || (S.aiTurns = []);
  const sugg = ['Qual o melhor horário para pescar hoje?', 'Vale a pena pescar amanhã?', 'Quais espécies posso encontrar aqui?', 'Qual isca devo usar?', 'Como está a maré?', 'Quais condições são melhores para robalo?'];
  const draw = () => { const box = $('#chatBox'); if (!box) return; box.innerHTML = (turns.length ? '' : `<div class="msg a">Olá! Sei a lua e o sol exatos, a maré estimada e o que a comunidade registrou em <b>${esc((S.openSpot ? (C.spot(S.openSpot) || S.virtualSpot || C.cur()) : C.cur()).name)}</b>. O clima ainda está simulado — eu aviso quando isso pesar. Pergunte!</div>`) + turns.map((t) => `<div class="msg ${t.role === 'user' ? 'u' : 'a'}">${esc(t.content)}</div>`).join(''); box.parentElement.scrollTop = 1e9; };
  C.sheet('Assistente de pesca', `<div class="chat" id="chatBox"></div><div class="sugg" id="sugg">${sugg.map((s) => `<button>${esc(s)}</button>`).join('')}</div>
   <form class="chatin" id="aiForm" style="position:sticky;bottom:0"><input class="input" name="q" placeholder="Pergunte sobre o ponto, maré, isca…" autocomplete="off" aria-label="Pergunta"><button class="btn" type="submit" aria-label="Enviar">${ic('send')}</button></form>`, (b) => {
    draw();
    if (!C.cap.sample) { $('#chatBox', b).insertAdjacentHTML('beforeend', `<div class="msg a">O assistente precisa da permissão de IA do Claude nesta visualização, que não está disponível agora.</div>`); }
    const ask = async (q) => {
      if (!C.cap.sample || !q) return;
      turns.push({ role: 'user', content: q }); draw();
      const box = $('#chatBox', b); const bubble = document.createElement('div'); bubble.className = 'msg a'; bubble.textContent = 'Pensando…'; box.appendChild(bubble); box.parentElement.scrollTop = 1e9;
      const ctl = new AbortController(); C.onSheetClose = () => ctl.abort();
      try {
        const { text } = await C.cap.sample([{ role: 'user', content: RULES + '\n\n' + C.aiContext() }, ...turns.slice(-8)], { cache: false, modelTier: 'default', signal: ctl.signal, onText: ({ text }) => { bubble.textContent = text; box.parentElement.scrollTop = 1e9; } });
        turns.push({ role: 'assistant', content: text });
      } catch (e) {
        turns.pop();
        bubble.textContent = e.text || ({ not_granted: window.CARDUME_HOSTED ? 'Para usar a IA, coloque sua chave em Ajustes › Inteligência artificial.' : 'Você não autorizou o uso da IA nesta página.', rate_limited: 'Muitas perguntas seguidas. Tente em instantes.', cancelled: '' }[e.code] ?? 'Não consegui responder agora. Tente de novo.');
      }
    };
    $$('#sugg button', b).forEach((x) => x.onclick = () => ask(x.textContent));
    $('#aiForm', b).onsubmit = (e) => { e.preventDefault(); const q = e.target.q.value.trim(); e.target.q.value = ''; ask(q); };
  });
};
// região usada para escolher o nome popular
C.nameRegion = (spot) => {
  const c = C.cfg;
  if (c.region === 'intl') return { country: c.country || 'outro país', uf: null, label: c.country || 'outro país' };
  if (c.region && c.region !== 'auto') { const u = FishNames.UF.find((x) => x[0] === c.region); if (u) return { country: 'Brasil', uf: u[0], state: u[1], label: `${u[1]}, Brasil` }; }
  const sp = spot || C.cur(); return FishNames.regionFor(sp.lat, sp.lon);
};
const ID_TIPS = 'Para acertar mais: peixe inteiro e de lado, nadadeiras abertas, boa luz, sem flash. Uma 2ª foto da cabeça (olho e boca) e uma da cauda ajudam muito.';
// correções feitas pela comunidade (aprendizado): "a IA disse X, era Y"
C.correctionsHint = (cands, reg) => {
  const rows = (S.idfb || []).filter((f) => !reg.uf || f.uf === reg.uf);
  const m = new Map();
  for (const f of rows) { if (!f.aiSci || !f.userSci || f.aiSci === f.userSci) continue; if (cands && !cands.includes(f.aiSci) && !cands.includes(f.userSci)) continue; const k = f.aiSci + '→' + f.userSci; m.set(k, (m.get(k) || 0) + 1); }
  return [...m].sort((x, y) => y[1] - x[1]).slice(0, 8).map(([k, n]) => `${k.replace('→', ' foi corrigido para ')} (${n}x)`).join('; ');
};
C.identify = async (files, out, apply, spot) => {
  if (!C.cap.sample) return;
  const lim = await C.cap.sample.limits().catch(() => null);
  const imgs = (files instanceof Blob ? [files] : [...(files || [])]).filter((f) => f && /^image\/(jpeg|png|webp|gif)$/.test(f.type)).slice(0, Math.min(3, lim?.images?.maxCount || 1));
  if (!imgs.length) return;
  const reg = C.nameRegion(spot), inBR = reg.country === 'Brasil', water = spot && spot.water === 'doce' ? 'água doce' : 'água salgada ou salobra (litoral)';
  const step = (n, t) => { out.innerHTML = `<div class="idcard"><b>${ic('spark')} Etapa ${n} de 2</b><div class="sm muted" style="margin-top:4px">${esc(t)}</div><div class="conf"><i style="width:${n * 45}%;background:var(--sea)"></i></div></div>`; };
  step(1, `Observando as características em ${imgs.length} foto${imgs.length > 1 ? 's' : ''}…`);
  const ctl = new AbortController();
  try {
    // ETAPA 1: observar, sem dar nome popular
    const o = await C.cap.sample.json(`Você é um ictiólogo de campo. Observe com atenção ${imgs.length > 1 ? 'as fotos (são do MESMO peixe)' : 'a foto'} e descreva SOMENTE o que é visível, sem pressa.
Local: ${reg.label}. Ambiente: ${water}.
Responda apenas JSON: {"tem_peixe": boolean, "familia": "nome científico da família", "confianca_familia": 0-1,
"caracteristicas": {"corpo": "formato e altura do corpo", "cabeca_boca": "perfil da cabeça, boca, dentes, barbilhões", "olho": "tamanho do olho em relação ao focinho", "nadadeiras": "dorsais, peitoral, anal, caudal, filamentos, espinhos separados", "linha_lateral": "curva, escudos, cor", "cor_marcas": "cores, faixas, listras, manchas e onde ficam (opérculo, base da peitoral, pedúnculo etc.)"},
"tamanho_estimado_cm": número ou null, "candidatos": ["até 5 nomes científicos possíveis, do mais provável ao menos"], "qualidade_foto": "boa"|"media"|"ruim", "o_que_falta_ver": "que parte do peixe não aparece e ajudaria"}`, { images: imgs, modelTier: 'complex', signal: ctl.signal });
    if (o.tem_peixe === false) { out.innerHTML = `<div class="idcard">Não encontramos um peixe nesta foto.<div class="xs muted" style="margin-top:6px">${esc(ID_TIPS)}</div></div>`; return; }
    // candidatos da base de conhecimento: a família inteira + os citados
    const set = new Map();
    for (const e of FishNames.family(o.familia)) set.set(e.sci, e);
    for (const c of (Array.isArray(o.candidatos) ? o.candidatos : [])) { const e = FishNames.lookup(c); if (e) { set.set(e.sci, e); for (const x of FishNames.family(e.fam)) set.set(x.sci, x); } }
    const cands = [...set.values()].filter((e) => !spot || !spot.water || e.water === spot.water || set.size < 4);
    const fb = C.correctionsHint(cands.map((c) => c.sci), reg);
    step(2, cands.length ? `Comparando com ${cands.length} espécies parecidas da nossa base (${FishNames.F[o.familia] || o.familia || 'família'})…` : 'Comparando com as espécies que ocorrem na sua região…');
    const obs = JSON.stringify(o.caracteristicas || {});
    const table = cands.map((e) => `- ${e.sci} | nome no RJ: ${e.rj} | outros nomes: ${e.br.join(', ') || '—'} | CHAVES: ${e.keys}`).join('\n');
    // ETAPA 2: decidir comparando as chaves diagnósticas
    const r = await C.cap.sample.json(`Você é um ictiólogo especialista em peixes ${inBR ? 'do Brasil' : 'do mundo'}. Identifique a espécie do peixe ${imgs.length > 1 ? 'nas fotos (mesmo peixe)' : 'na foto'}.
Local do pescador: ${reg.label}${reg.lat != null ? ` (lat ${reg.lat.toFixed(3)}, lon ${reg.lon.toFixed(3)})` : ''}. Ambiente: ${water}.
Observações já feitas: ${obs}. Tamanho estimado: ${o.tamanho_estimado_cm || 'desconhecido'} cm.
${cands.length ? `ESPÉCIES CANDIDATAS (base de conhecimento do app, com os traços que separam cada uma):\n${table}\n\nCompare a foto com as CHAVES de cada candidata, uma por uma. Descarte cada candidata citando o traço que não bate. Escolha a que tem todos os traços compatíveis. Se nenhuma servir, você pode indicar outra espécie que ocorra nesse local (marque "fora_da_lista": true).` : 'Considere apenas espécies que ocorrem nesse local e nesse ambiente.'}
${fb ? `Correções feitas por pescadores desta região em identificações anteriores (leve em conta): ${fb}.` : ''}
Nome popular: use o nome usado pelos pescadores EXATAMENTE em ${reg.label}${inBR ? '' : ' (no idioma local, com o nome em português entre parênteses)'}. Não confunda nomes de regiões diferentes.
Seja honesto: se a foto não mostra um traço decisivo, baixe a confiança e diga qual foto falta.
Responda apenas JSON: {"cientifico": string, "nome_local": string, "outros_nomes": [string], "confianca": 0-1, "justificativa": "1-2 frases citando os traços decisivos", "descartados": [{"cientifico": string, "motivo": string}], "alternativas": [{"cientifico": string, "nome_local": string, "confianca": 0-1}], "fora_da_lista": boolean, "foto_que_falta": string ou ""}`, { images: imgs, modelTier: 'complex', signal: ctl.signal });
    renderId(out, r, reg, apply, o);
  } catch (e) { out.innerHTML = `<div class="idcard">${esc({ not_granted: window.CARDUME_HOSTED ? 'Para identificar peixes, coloque sua chave da IA em Ajustes › Inteligência artificial.' : 'Uso da IA não autorizado.', images_unavailable: 'Envio de imagens para a IA não disponível aqui.', image_rejected: 'Imagem não aceita. Tente outra foto.', rate_limited: 'Muitas tentativas. Aguarde um pouco.', invalid_json: 'A resposta veio incompleta. Toque em identificar de novo.' }[e.code] || 'Não foi possível identificar agora.')}</div>`; }
};
function renderId(out, r, reg, apply, o) {
  const conf = Math.max(0, Math.min(1, +r.confianca || 0));
  const tab = FishNames.lookup(r.cientifico);
  const tabName = FishNames.localName(tab, reg);
  const name = tabName || String(r.nome_local || 'Não identificado');
  const others = [...new Set([...(tab ? [tab.rj, ...tab.br] : []), ...(Array.isArray(r.outros_nomes) ? r.outros_nomes : []), r.nome_local].map((x) => String(x || '').trim()).filter((x) => x && FishNames.norm(x) !== FishNames.norm(name)))].slice(0, 5);
  const alts = (Array.isArray(r.alternativas) ? r.alternativas : []).slice(0, 3).map((a) => { const t = FishNames.lookup(a.cientifico); return { sci: String(a.cientifico || ''), name: FishNames.localName(t, reg) || String(a.nome_local || a.cientifico || ''), c: Math.max(0, Math.min(1, +a.confianca || 0)) }; }).filter((a) => a.name && FishNames.norm(a.sci) !== FishNames.norm(r.cientifico));
  const col = conf >= .75 ? 'var(--good)' : conf >= .5 ? 'var(--sun)' : 'var(--coral)';
  const short = (sci) => String(sci).split(' ').map((w, i) => i ? w : w[0] + '.').join(' ');
  const missing = r.foto_que_falta || (o && o.qualidade_foto !== 'boa' ? o.o_que_falta_ver : '');
  out.innerHTML = `<div class="idcard"><div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><b style="font-size:19px">${esc(name)}</b><span class="xs muted num">${Math.round(conf * 100)}% de confiança</span></div>
    <div class="sm muted"><i>${esc(r.cientifico || '')}</i>${tab ? ` · ${esc(FishNames.F[tab.fam] || tab.fam)}` : ''}</div><div class="conf"><i style="width:${conf * 100}%;background:${col}"></i></div>
    ${r.justificativa ? `<p class="sm" style="margin:10px 0 0"><b>Por quê:</b> ${esc(r.justificativa)}</p>` : ''}
    <div class="xs muted" style="margin-top:8px">Nome popular em <b style="color:var(--ink)">${esc(reg.label)}</b> · ${tabName ? 'conferido na base regional do Cardume' : r.fora_da_lista ? 'espécie fora da nossa base: nome informado pela IA' : 'informado pela IA para a sua região'}</div>
    ${others.length ? `<div class="xs muted" style="margin-top:4px">Também chamado de: ${others.map(esc).join(', ')}</div>` : ''}
    ${Array.isArray(r.descartados) && r.descartados.length ? `<details style="margin-top:8px"><summary class="xs" style="cursor:pointer;color:var(--acc)">Ver espécies parecidas descartadas (${r.descartados.length})</summary><ul class="xs muted" style="margin:6px 0 0;padding-left:18px">${r.descartados.slice(0, 8).map((d) => `<li><i>${esc(d.cientifico)}</i>${FishNames.lookup(d.cientifico) ? ' (' + esc(FishNames.lookup(d.cientifico).rj) + ')' : ''}: ${esc(d.motivo)}</li>`).join('')}</ul></details>` : ''}
    ${tab && tab.protected ? `<div class="banner" style="margin:10px 0 0">${ic('shield')}<span>Espécie com restrição de captura no Brasil. Confira a legislação vigente antes de manter o peixe.</span></div>` : ''}
    ${conf < .75 ? `<div class="xs" style="margin-top:8px;color:var(--warn)">Identificação incerta: confirme antes de publicar.${missing ? ' Ajudaria uma foto: ' + esc(missing) + '.' : ''}</div>` : ''}
    <button type="button" class="btn ${conf >= .75 ? '' : 'ghost'} block" style="margin-top:10px;height:44px" data-use="${esc(name)}" data-sci="${esc(r.cientifico || '')}">${conf >= .75 ? 'Usar esta espécie' : 'Confirmar mesmo assim'}</button>
    ${alts.length ? `<div class="xs muted" style="margin-top:10px">Pode ser também:</div><div class="alt">${alts.map((a) => `<button type="button" data-use="${esc(a.name)}" data-sci="${esc(a.sci)}">${esc(a.name)} <i class="muted">${esc(short(a.sci))}</i> <span class="muted">· ${Math.round(a.c * 100)}%</span></button>`).join('')}</div>` : ''}
    <div style="margin-top:12px;border-top:1px solid var(--line);padding-top:10px"><button type="button" class="link" data-fix="1">Não é esse peixe? Corrigir</button>
      <div data-fixbox hidden style="margin-top:8px"><input class="input" data-fixq placeholder="Nome popular ou científico (ex.: xaréu-olhudo)" autocomplete="off"><div class="alt" data-fixres></div><div class="xs muted" style="margin-top:6px">Sua correção ensina o app: as próximas identificações na sua região levam isso em conta.</div></div></div>
    <div class="xs muted" style="margin-top:8px">Confira tamanho mínimo e defeso nas normas vigentes (IBAMA/MPA e órgão estadual).</div></div>`;
  const aiSci = String(r.cientifico || ''), aiName = name;
  const learn = (userName, userSci) => {
    if (!C.cap.db || !S.uid) return;
    C.cap.db.collection('idfb').add({ aiSci, aiName, userSci: userSci || null, userName, uf: reg.uf || null, country: reg.country || reg.label, conf, ts: Date.now(), uid: S.uid }).catch(() => { });
  };
  out.querySelectorAll('[data-use]').forEach((bt) => bt.onclick = () => { apply(bt.dataset.use, bt.dataset.sci); if (FishNames.norm(bt.dataset.sci) !== FishNames.norm(aiSci)) learn(bt.dataset.use, bt.dataset.sci); C.toast('Espécie preenchida: ' + bt.dataset.use, 'fish'); });
  const box = out.querySelector('[data-fixbox]'), q = out.querySelector('[data-fixq]'), res = out.querySelector('[data-fixres]');
  out.querySelector('[data-fix]').onclick = () => { box.hidden = !box.hidden; if (!box.hidden) q.focus(); };
  q.oninput = () => {
    const v = q.value.trim(), hits = FishNames.search(v).slice(0, 6);
    res.innerHTML = hits.map((h) => `<button type="button" data-fx="${esc(h.sci)}">${esc(FishNames.localName(h, reg) || h.rj)} <i class="muted">${esc(short(h.sci))}</i></button>`).join('') + (v ? `<button type="button" data-fxfree="1">Usar “${esc(v)}”</button>` : '');
  };
  res.onclick = (e) => {
    const b = e.target.closest('[data-fx],[data-fxfree]'); if (!b) return;
    if (b.dataset.fx) { const h = FishNames.lookup(b.dataset.fx); const nm = FishNames.localName(h, reg) || h.rj; apply(nm, h.sci); learn(nm, h.sci); C.toast('Corrigido para ' + nm + '. Obrigado!', 'fish'); }
    else { const v = q.value.trim().slice(0, 60); apply(v, ''); learn(v, null); C.toast('Corrigido. Obrigado!', 'fish'); }
    box.hidden = true;
  };
}

/* ---------------- AJUSTES ---------------- */
C.openSettings = () => { C.page('<div id="setPage"></div>', () => drawSettings()); };
$('#pageBody').addEventListener('click', (e) => { if ($('#setPage')) onSetClick(e); });
$('#pageBody').addEventListener('change', (e) => { if ($('#setPage')) onSetChange(e); });
const seg = (key, opts) => `<div class="seg" role="radiogroup">${opts.map(([v, l]) => `<button role="radio" aria-checked="${C.cfg[key] === v}" class="${C.cfg[key] === v ? 'on' : ''}" data-cfg="${key}" data-v="${v}">${l}</button>`).join('')}</div>`;
const sw = (key, label, sub) => `<div class="setrow"><div class="lbl" style="justify-content:space-between"><span><b style="font-weight:500">${label}</b>${sub ? `<br><span class="xs muted">${sub}</span>` : ''}</span><button class="sw ${C.cfg[key] ? 'on' : ''}" role="switch" aria-checked="${!!C.cfg[key]}" aria-label="${esc(label)}" data-tog="${key}"></button></div></div>`;
function drawSettings() {
  const host = $('#setPage'); if (!host) return;
  const y = $('#pageBody').scrollTop, reg = C.nameRegion(C.cur());
  host.innerHTML = `<div class="top" style="padding-top:16px"><button class="iconbtn" data-act="closepage" aria-label="Voltar">${ic('back')}</button><div class="who"><h1>Ajustes</h1></div></div>
  <div class="setsec">Aparência</div><div class="list" style="display:block">
    <div class="setrow"><div class="lbl"><span class="tile t-moon">${ic('moon')}</span><b style="font-weight:500">Tema</b></div>${seg('theme', [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']])}<span class="xs muted">${C.cfg.theme === 'auto' ? `Seguindo o celular: agora ${C.scheme() === 'dark' ? 'escuro' : 'claro'}.` : 'Fixo, independente do celular.'}</span></div>
    <div class="setrow"><div class="lbl"><span class="tile t-sky">${ic('edit')}</span><b style="font-weight:500">Tamanho do texto</b></div>${seg('text', [['md', 'Padrão'], ['lg', 'Grande']])}</div>
    <div class="setrow"><div class="lbl" style="justify-content:space-between"><span><b style="font-weight:500">Animações</b><br><span class="xs muted">Ondas, transições e efeitos</span></span><button class="sw ${C.cfg.motion === 'on' ? 'on' : ''}" role="switch" aria-checked="${C.cfg.motion === 'on'}" aria-label="Animações" data-motion="1"></button></div></div></div>
  <div class="setsec">Unidades</div><div class="list" style="display:block">
    <div class="setrow"><b style="font-weight:500">Temperatura</b>${seg('temp', [['c', '°C'], ['f', '°F']])}</div>
    <div class="setrow"><b style="font-weight:500">Vento</b>${seg('wind', [['kmh', 'km/h'], ['kn', 'nós'], ['ms', 'm/s']])}</div>
    <div class="setrow"><b style="font-weight:500">Peso</b>${seg('weight', [['kg', 'kg'], ['lb', 'lb']])}</div>
    <div class="setrow"><b style="font-weight:500">Comprimento</b>${seg('length', [['cm', 'cm'], ['in', 'polegadas']])}</div></div>
  <div class="setsec">Região</div><div class="list" style="display:block">
    <div class="setrow"><div class="lbl"><span class="tile t-sea">${ic('fish')}</span><span><b style="font-weight:500">Nomes populares dos peixes</b><br><span class="xs muted">Usado na identificação por foto e nas sugestões</span></span></div>
      <select class="input" data-sel="region"><option value="auto" ${C.cfg.region === 'auto' ? 'selected' : ''}>Automático (pelo ponto selecionado)</option>${FishNames.UF.map((u) => `<option value="${u[0]}" ${C.cfg.region === u[0] ? 'selected' : ''}>${esc(u[1])}</option>`).join('')}<option value="intl" ${C.cfg.region === 'intl' ? 'selected' : ''}>Fora do Brasil…</option></select>
      ${C.cfg.region === 'intl' ? `<input class="input" data-txt="country" placeholder="País (ex.: Portugal, Argentina, EUA)" value="${esc(C.cfg.country || '')}" maxlength="40">` : ''}
      <span class="xs muted">Agora: ${esc(reg.label)}</span></div></div>
  <div class="setsec">Notificações no app</div><div class="list" style="display:block">
    ${sw('notifFav', 'Capturas nos meus pontos favoritos', 'Aviso na hora em que alguém registra')}
    ${sw('notifComm', 'Atividade da comunidade', 'Novas capturas e relatos enquanto o app está aberto')}</div>
  <div class="setsec">Privacidade</div><div class="list">
    <button data-act="privacy">${ic('lock')}<span class="grow">Localização padrão das capturas</span><span class="val">${{ exata: 'Ponto exato', aproximada: 'Só a região', sem: 'Sem local' }[S.mine.privacy || 'aproximada']}</span>${ic('next')}</button>
    <div style="display:block;padding:0">${sw('sharePresence', 'Compartilhar presença ao pescar', 'Outros veem que há alguém no ponto, nunca sua posição exata')}</div></div>
  ${window.CARDUME_HOSTED ? `<div class="setsec">Inteligência artificial</div><div class="list" style="display:block">
    <div class="setrow"><div class="lbl"><span class="tile t-coral">${ic('spark')}</span><span><b style="font-weight:500">Chave da Anthropic</b><br><span class="xs muted">Usada no assistente e na identificação de peixes. Fica guardada só neste aparelho e é enviada direto para a Anthropic. O uso é cobrado na sua conta da Anthropic.</span></span></div>
      <input class="input" type="password" data-txt="aiKey" placeholder="sk-ant-..." value="${esc(C.cfg.aiKey || '')}" autocomplete="off">
      <span class="xs muted">${C.cfg.aiKey ? 'Chave salva neste aparelho.' : 'Sem chave: as funções de IA ficam desligadas.'} Crie em console.anthropic.com › API Keys.</span></div></div>` : ''}
  <div class="setsec">Conta</div><div class="list">
    <button data-act="editprofile">${ic('edit')}<span class="grow">Editar perfil</span>${ic('next')}</button>
    <button data-act="wipe" style="color:var(--bad)">${ic('trash')}<span class="grow">Excluir meus dados (LGPD)</span></button>
    ${window.CARDUME_HOSTED && C.cap.user && C.cap.user.signOut ? `<button data-act="signout">${ic('back')}<span class="grow">Sair da conta</span></button>` : ''}</div>
  <div class="setsec">Sobre</div><div class="list">
    <button data-act="method">${ic('info')}<span class="grow">Como calculamos o índice</span>${ic('next')}</button>
    <button data-act="sources">${ic('shield')}<span class="grow">Fontes e confiabilidade dos dados</span>${ic('next')}</button>
    <div><img src="icons/icon.svg" width="36" height="36" alt="" style="border-radius:9px;flex:none"><span class="grow"><b style="font-weight:600">Cardume</b><br><span class="xs muted">Pesca, mar e comunidade</span></span><span class="val">versão 1.2 · protótipo</span></div></div>
  <div style="height:40px"></div>`;
  $('#pageBody').scrollTop = y;
}
function onSetClick(e) {
  const c = e.target.closest('[data-cfg]'), t = e.target.closest('[data-tog]'), m = e.target.closest('[data-motion]');
  if (c) { C.setCfg({ [c.dataset.cfg]: c.dataset.v }); drawSettings(); }
  if (t) { C.setCfg({ [t.dataset.tog]: !C.cfg[t.dataset.tog] }); drawSettings(); }
  if (m) { C.setCfg({ motion: C.cfg.motion === 'on' ? 'off' : 'on' }); drawSettings(); }
}
function onSetChange(e) {
  const sel = e.target.closest('[data-sel]'), tx = e.target.closest('[data-txt]');
  if (sel) { C.setCfg({ [sel.dataset.sel]: sel.value }); drawSettings(); }
  if (tx) { const k = tx.dataset.txt; C.setCfg({ [k]: k === 'aiKey' ? tx.value.trim().slice(0, 300) : tx.value.trim().slice(0, 40) }); drawSettings(); }
}

/* ---------------- folhas informativas ---------------- */
function speciesPicker() {
  const sp = C.cur(), list = Object.keys(Env.SPECIES).filter((k) => Env.SPECIES[k].water === (sp.water || 'salgada'));
  C.sheet('Espécie-alvo', `<div class="pad chips"><button class="${!S.species ? 'on' : ''}" data-setsp="${esc(S.species || '')}">Todas</button>${list.map((k) => `<button class="${S.species === k ? 'on' : ''}" data-setsp="${esc(k)}">${esc(k)}</button>`).join('')}</div><p class="pad xs muted" style="margin-top:12px">A espécie muda o peso de cada fator do modelo (ex.: robalo valoriza alvorada, crepúsculo e maré em movimento; corvina, a noite).</p>`);
  C.$('#sheetBody').addEventListener('click', (e) => { if (e.target.closest('[data-setsp]')) setTimeout(C.closeSheet, 50); }, { once: true });
}
function methodology() {
  C.sheet('Como calculamos', `<div class="pad sm" style="line-height:1.6">
   <h3>Atividade estimada por hora (0–100) ${C.src('b')}</h3>
   <p>Base de 8 pontos + soma ponderada de fatores (cada fator vai de 0 a 1; a coluna mostra o máximo em pontos):</p>
   <table class="tbl"><tbody>
    <tr><td><b>Solunar</b></td><td>Períodos maiores (±1 h da passagem superior e inferior da Lua) e menores (±45 min do nascer/pôr da Lua)</td><td class="r num">26</td></tr>
    <tr><td><b>Luz</b></td><td>Alvorada e crepúsculo (nascer e pôr do Sol calculados para a coordenada)</td><td class="r num">24</td></tr>
    <tr><td><b>Maré</b></td><td>Velocidade de subida/descida da água (água parada pontua pouco)</td><td class="r num">30·</td></tr>
    <tr><td><b>Fase</b></td><td>Proximidade de lua nova/cheia (sizígia)</td><td class="r num">13</td></tr>
    <tr><td><b>Tempo</b></td><td>Pressão em queda leve (+), vento acima de 22 km/h (−)</td><td class="r num">±15</td></tr></tbody></table>
   <p class="xs muted">· a maré só entra em água salgada. A espécie selecionada multiplica cada fator pelo seu perfil (ex.: robalo ×1,4 na maré).</p>
   <h3 style="margin-top:14px">Índice de pesca do dia ${C.src('b')}</h3>
   <p>75% da atividade média da melhor janela de 3 horas + 25% de conforto e segurança (vento, chuva, ondas).</p>
   <h3 style="margin-top:14px">Limites honestos</h3>
   <p>É um modelo heurístico baseado em práticas tradicionais de pesca (teoria solunar, marés). Ele não prevê capturas. Quando a comunidade acumular registros suficientes num ponto, a “inteligência do ponto” mostra o que de fato aconteceu lá em condições parecidas.</p></div>`);
}
function sources() {
  C.sheet('Fontes e confiabilidade', `<div class="pad sm" style="line-height:1.6">
   <p>${C.src('a', 'Astronômico')} <b>Lua e Sol</b>: calculados no aparelho com as séries de Jean Meeus (Astronomical Algorithms). Validado contra efemérides de referência: fases ±2 min, nascer/pôr ±1 min.</p>
   <p>${C.src('b', 'Modelo')} <b>Maré</b>: modelo harmônico simplificado com referência na Ilha Fiscal; sizígia/quadratura corretas, horários estimados. <b>Não use para navegação</b>; a fonte oficial é a Marinha do Brasil (DHN/CHM).</p>
   <p>${C.src('a', 'Open-Meteo')} <b>Clima, ondas, água e correntes</b>: no app hospedado, previsão real da Open-Meteo (Forecast e Marine), com a distância da célula do modelo. Dentro do Claude, onde a internet externa é bloqueada, aparecem valores simulados marcados como ${C.src('s', 'Simulado')}.</p>
   <p>${C.src('c', 'Comunidade')} <b>Capturas, relatos e presença</b>: dados reais enviados pelos pescadores, em tempo real. Não são informação oficial.</p>
   <p>${C.src('b', 'Estimativa')} <b>Atividade e índice</b>: modelo documentado em “Como calculamos”.</p>
   <p><b>Mapa</b>: contorno costeiro a partir de limites municipais do IBGE (alta resolução). A versão nativa usa Mapbox com satélite.</p></div>`);
}
function privacyPicker() {
  C.sheet('Localização padrão', `<div class="list">${[['exata', 'Ponto exato', 'Mostra o nome do ponto'], ['aproximada', 'Só a região', 'Mostra apenas o bairro/região'], ['sem', 'Sem localização', 'A publicação não indica onde foi']].map(([k, l, d]) => `<button data-pv="${k}">${ic(k === 'sem' ? 'lock' : 'pin')}<span class="grow"><b>${l}</b><br><span class="xs muted">${d}</span></span>${(S.mine.privacy || 'aproximada') === k ? ic('next') : ''}</button>`).join('')}</div><p class="pad xs muted" style="margin-top:12px">Sua localização GPS exata nunca é publicada. A presença em um ponto some quando você encerra a pescaria ou fecha o app.</p>`,
    (b) => b.addEventListener('click', async (e) => { const x = e.target.closest('[data-pv]'); if (!x) return; await C.saveMine({ privacy: x.dataset.pv }); C.closeSheet(); C.render(); }));
}
function moderation() {
  const rs = S.reports.slice().sort((a, b) => b.ts - a.ts);
  C.sheet('Moderação', rs.length ? `<div class="list">${rs.map((r) => { const p = S.posts.find((x) => x.id === r.postId); return `<div style="flex-wrap:wrap">${ic('flag')}<span class="grow"><b>${esc(r.reason)}</b><br><span class="xs muted">${esc(fmt.ago(r.ts))} · ${p ? esc((p.species || p.text || '').slice(0, 60)) : 'publicação já removida'}</span></span>
    ${p ? `<button class="chipbtn" data-modrm="${esc(p.id)}" data-r="${esc(r.id)}">Remover post</button>` : ''}<button class="chipbtn" data-modok="${esc(r.id)}">Arquivar</button></div>`; }).join('')}</div>` : `<div class="empty">${ic('shield')}<b>Nenhuma denúncia</b></div>`, (b) => b.addEventListener('click', async (e) => {
    const rm = e.target.closest('[data-modrm]'), ok = e.target.closest('[data-modok]');
    try { if (rm) { await C.cap.db.doc('posts/' + rm.dataset.modrm).delete(); await C.cap.db.doc('reports/' + rm.dataset.r).delete(); C.toast('Publicação removida', 'trash'); }
      if (ok) { await C.cap.db.doc('reports/' + ok.dataset.modok).delete(); C.toast('Denúncia arquivada', 'shield'); } C.closeSheet(); } catch (er) { C.dbError(er); } }));
}
function wipeData() {
  if (!C.needDb()) return;
  C.sheet('Excluir meus dados', `<div class="pad"><p class="muted" style="margin-top:0">Vamos apagar suas publicações, comentários, curtidas, seguidores, perfil, sessões e pontos privados. Não pode ser desfeito.</p><button class="btn danger block" id="wipeGo">${ic('trash')}Excluir tudo</button></div>`, (b) => {
    $('#wipeGo', b).onclick = async () => {
      const db = C.cap.db, del = [];
      S.posts.filter((p) => p.uid === S.uid).forEach((p) => del.push('posts/' + p.id));
      S.comments.filter((c) => c.uid === S.uid).forEach((c) => del.push('comments/' + c.id));
      for (const [k, v] of S.likes) if (v.uid === S.uid) del.push('likes/' + k);
      S.follows.filter((f) => f.from === S.uid || f.to === S.uid).forEach((f) => del.push('follows/' + C.safeId(f.from + '__' + f.to)));
      S.sessions.forEach((s) => del.push(`data/users/${S.uid}/${s.id}`)); for (const id of S.privSpots.keys()) del.push(`data/users/${S.uid}/${id}`);
      del.push('profiles/' + S.uid, `data/users/${S.uid}/state`);
      let n = 0; for (const p of del) { try { await db.doc(p).delete(); n++; } catch { } }
      C.closeSheet(); C.toast(`${n} itens excluídos`, 'trash');
    };
  });
}

/* ---------------- onboarding / perfil ---------------- */
C.onboarding = (edit) => {
  if (!C.cap.db || !S.uid) { if (edit) C.needDb(); return; }
  const p = S.profiles.get(S.uid) || {};
  const modes = ['Praia', 'Costão', 'Embarcada', 'Píer/mureta', 'Rio', 'Lago/represa', 'Esportiva'];
  const sps = Object.keys(Env.SPECIES);
  C.sheet(edit ? 'Editar perfil' : 'Bem-vindo ao Cardume', `<form class="form" id="obForm">
   ${edit ? '' : `<div style="display:flex;align-items:center;gap:12px"><img src="icons/icon.svg" width="56" height="56" alt="" style="border-radius:14px"><b style="font-size:17px">Cardume</b></div><p class="muted sm" style="margin:0">Leva 30 segundos. Usamos isso para personalizar previsões e espécies. ${window.CARDUME_HOSTED ? 'Sua conta já está conectada.' : 'Você entra com sua conta Claude — sem senha extra.'}</p>`}
   <label class="field"><span>Como quer ser chamado</span><input class="input" name="nick" required maxlength="40" value="${esc(p.nick || (S.me && S.me.name) || '')}"></label>
   <label class="field"><span>Cidade</span><input class="input" name="city" maxlength="50" value="${esc(p.city || '')}" placeholder="Rio de Janeiro, RJ"></label>
   <div class="field"><span>Modalidades</span><div class="chips" data-multi="modes">${modes.map((m) => `<button type="button" class="${(p.modes || []).includes(m) ? 'on' : ''}" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div></div>
   <div class="field"><span>Espécies favoritas</span><div class="chips" data-multi="species">${sps.map((m) => `<button type="button" class="${(p.species || []).includes(m) ? 'on' : ''}" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div></div>
   <div class="field"><span>Experiência</span><div class="seg" data-one="level">${['Iniciante', 'Intermediário', 'Experiente'].map((m) => `<button type="button" class="${(p.level || 'Iniciante') === m ? 'on' : ''}" data-v="${m}">${m}</button>`).join('')}</div></div>
   <label class="field"><span>Bio</span><textarea class="input" name="bio" maxlength="240">${esc(p.bio || '')}</textarea></label>
   <button class="btn block" type="submit">${edit ? 'Salvar' : 'Começar a pescar'}</button>${edit ? '' : '<button type="button" class="btn ghost block" id="obSkip">Agora não</button>'}</form>`, (b) => {
    $$('[data-multi] button', b).forEach((x) => x.onclick = () => x.classList.toggle('on'));
    $$('[data-one] button', b).forEach((x) => x.onclick = () => $$('button', x.parentElement).forEach((y) => y.classList.toggle('on', y === x)));
    const skip = $('#obSkip', b); if (skip) skip.onclick = C.closeSheet;
    $('#obForm', b).onsubmit = async (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      const pick = (k) => $$(`[data-multi=${k}] .on`, b).map((x) => x.dataset.v);
      const doc = { nick: String(f.get('nick')).trim().slice(0, 40), city: String(f.get('city') || '').trim(), modes: pick('modes'), species: pick('species'), level: ($('[data-one=level] .on', b) || {}).dataset?.v || 'Iniciante', bio: String(f.get('bio') || '').trim(), updatedAt: Date.now() };
      try { await C.cap.db.doc('profiles/' + S.uid).set(doc); if (doc.species[0] && !S.species) S.species = null; C.closeSheet(); C.toast(edit ? 'Perfil atualizado' : 'Tudo pronto. Boa pescaria!', 'fish'); } catch (er) { C.dbError(er); }
    };
  });
};

C.quickMenu = () => {
  C.sheet('O que você quer fazer?', `<div class="list">
   <button data-act="qm" data-k="capture">${ic('fish')}<span class="grow"><b>Registrar captura</b><br><span class="xs muted">Foto, espécie, peso, isca — vai para o ponto e a comunidade</span></span></button>
   <button data-act="qm" data-k="session">${ic(S.mine.session ? 'stop' : 'play')}<span class="grow"><b>${S.mine.session ? 'Encerrar pescaria' : 'Iniciar pescaria'}</b><br><span class="xs muted">${S.mine.session ? 'Gera o relatório da sessão' : 'Compartilha presença e abre o diário'}</span></span></button>
   <button data-act="qm" data-k="report">${ic('chat')}<span class="grow"><b>Relato do local</b><br><span class="xs muted">Como está a água, o mar, o movimento</span></span></button>
   <button data-act="qm" data-k="id">${ic('camera')}<span class="grow"><b>Identificar peixe por foto</b><br><span class="xs muted">IA com nível de confiança</span></span></button>
   <button data-act="qm" data-k="ai">${ic('spark')}<span class="grow"><b>Assistente de pesca</b><br><span class="xs muted">Pergunte sobre horário, maré, isca</span></span></button></div>`);
};

/* ---------------- fotos no app hospedado (carregadas sob demanda) ---------------- */
const photoCache = new Map();
new MutationObserver(() => {
  if (!window.CARDUME_PHOTO) return;
  for (const im of document.querySelectorAll('img[data-photo]:not([src])')) {
    const id = im.dataset.photo; im.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    const p = photoCache.get(id) || window.CARDUME_PHOTO(id).catch(() => null); photoCache.set(id, p);
    p.then((u) => { if (u && /^data:image\//.test(u)) im.src = u; });
  }
}).observe(document.body, { childList: true, subtree: true });

/* ---------------- inicialização ---------------- */
C.route();
MoonRender.warm && setTimeout(() => MoonRender.warm(), 30);
C.boot();
setInterval(() => { if (!document.hidden) C.render(); }, 5 * 60e3); // atualiza leituras a cada 5 min
}
