// ══════════════════════════════════════════════════════════════
// js/pages.js — All page renderers
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// HOME (dispatches by role)
// ══════════════════════════════════════════════════════════════
async function renderHome() {
  const role = window.CU.ruolo;
  if (role === 'admin') return renderAdminHome();
  if (role === 'gym')   return renderGymHome();
  if (role === 'pt')    return renderPTHome();
  return renderUserHome();
}

async function renderAdminHome() {
  const users = await DB.getUsers();
  const pts   = users.filter(u => u.ruolo === 'pt');
  const usrs  = users.filter(u => u.ruolo === 'user');
  const tpls  = await DB.getTemplates();
  set(`<div class="page-title">Dashboard <span class="page-sub">Amministratore</span></div>
  <div class="grid-4">
    <div class="stat-box"><div class="stat-label">Utenti Totali</div><div class="stat-val">${users.length}</div></div>
    <div class="stat-box"><div class="stat-label">Personal Trainer</div><div class="stat-val">${pts.length}</div></div>
    <div class="stat-box"><div class="stat-label">Clienti</div><div class="stat-val">${usrs.length}</div></div>
    <div class="stat-box"><div class="stat-label">Schede</div><div class="stat-val">${tpls.length}</div></div>
  </div>
  <div class="flex-between"><div class="page-title" style="font-size:1.2rem">Utenti Recenti</div>
    <button class="btn-secondary btn-sm" onclick="router('users')">Vedi tutti</button></div>
  ${renderUserTable(users.slice(-6).reverse())}`);
}

async function renderGymHome() {
  const gym   = await DB.getGym();
  const rooms = await DB.getRooms();
  const pts   = (await DB.getUsers()).filter(u => u.ruolo === 'pt');
  const users = (await DB.getUsers()).filter(u => u.ruolo === 'user');
  set(`<div class="page-title">${esc(gym.name||'Palestra')} <span class="page-sub">Gestione</span></div>
  <div class="grid-4">
    <div class="stat-box"><div class="stat-label">Sale</div><div class="stat-val">${rooms.length}</div></div>
    <div class="stat-box"><div class="stat-label">Personal Trainer</div><div class="stat-val">${pts.length}</div></div>
    <div class="stat-box"><div class="stat-label">Clienti</div><div class="stat-val">${users.length}</div></div>
    <div class="stat-box"><div class="stat-label">Corsi Totali</div><div class="stat-val">—</div></div>
  </div>
  <div class="flex-between"><div class="page-title" style="font-size:1.2rem">Le Sale</div>
    <button class="btn-secondary btn-sm" onclick="router('rooms')">Gestisci Sale</button></div>
  <div class="grid-3">${rooms.slice(0,3).map(r => roomMiniCard(r)).join('') || '<div class="empty">Nessuna sala</div>'}</div>`);
}

async function renderPTHome() {
  const allUsers = await DB.getUsers();
  const clients  = allUsers.filter(u => u.pt_id === window.CU.id);
  const tpls     = await DB.getTemplates(window.CU.id);
  const asgns    = await DB.getAssignments({ ptId: window.CU.id });
  // Count unread comments
  const sessions = [];
  for (const c of clients) {
    const s = await DB.getSessions(c.id, 30);
    sessions.push(...s);
  }
  const comments = sessions.reduce((sum, s) =>
    sum + (s.session_exercises||[]).filter(e => e.comment && !e.pt_reply).length, 0);

  set(`<div class="page-title">Ciao ${esc(window.CU.nome)}! <span class="page-sub">PT Dashboard</span></div>
  <div class="grid-4">
    <div class="stat-box"><div class="stat-label">Clienti</div><div class="stat-val">${clients.length}</div></div>
    <div class="stat-box"><div class="stat-label">Schede</div><div class="stat-val">${tpls.length}</div></div>
    <div class="stat-box"><div class="stat-label">Assegnazioni</div><div class="stat-val">${asgns.length}</div></div>
    <div class="stat-box"><div class="stat-label">Nuovi Commenti</div><div class="stat-val" style="color:${comments?'var(--blue)':'inherit'}">${comments}</div></div>
  </div>
  <div class="flex-between"><div class="page-title" style="font-size:1.2rem">Clienti</div></div>
  ${clients.length ? clients.map(u => {
    const a = asgns.find(x => x.user_id === u.id);
    return `<div class="card" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem">
      <div style="display:flex;align-items:center;gap:1rem">${userAvatar(u, 40)}
        <div><div style="font-family:'Barlow Condensed',sans-serif;font-size:1rem;font-weight:700;letter-spacing:2px">${esc(u.nome)} ${esc(u.cognome)}</div>
          <div style="font-size:.7rem;color:var(--muted)">${a ? esc(a.template_name) : 'Nessuna scheda'}</div>
        </div>
      </div>
      <div class="flex-gap">
        <button class="btn-secondary btn-sm" onclick="renderClientStats('${u.id}')">📊 Stats</button>
        <button class="btn-secondary btn-sm" onclick="router('feedback')">💬 Feedback</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty">Nessun cliente assegnato</div>'}`);
}

async function renderUserHome() {
  const asgns = await DB.getAssignments({ userId: window.CU.id });
  const asgn  = asgns[0];
  const dk    = window.DKEYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const exs   = asgn ? (asgn.schedule[dk] || []) : [];
  const log   = await DB.getSessionByDate(window.CU.id, today());
  const done  = log ? log.session_exercises.filter(e => e.done).length : 0;
  const stats = await DB.getStats(window.CU.id);
  const pt    = window.CU.pt_id ? (await DB.getUsers()).find(u => u.id === window.CU.pt_id) : null;
  set(`<div class="page-title">Ciao ${esc(window.CU.nome)}! <span class="page-sub">${new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})}</span></div>
  <div class="grid-4">
    <div class="stat-box"><div class="stat-label">Oggi</div><div class="stat-val">${exs.length}</div><div class="stat-unit">esercizi</div></div>
    <div class="stat-box"><div class="stat-label">Completati</div><div class="stat-val">${done}</div><div class="stat-unit">su ${exs.length}</div></div>
    <div class="stat-box"><div class="stat-label">Sessioni Totali</div><div class="stat-val">${stats.totalSessions}</div></div>
    <div class="stat-box"><div class="stat-label">Personal Trainer</div><div class="stat-val" style="font-size:.9rem;padding-top:1rem">${pt ? esc(pt.nome+' '+pt.cognome) : '—'}</div></div>
  </div>
  <div class="grid-2" style="margin-bottom:1.5rem">
    <div class="card" style="cursor:pointer;border-left:3px solid var(--accent)" onclick="router('free_workout')">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:3px;color:var(--accent)">🆓 ALLENAMENTO LIBERO</div>
      <div style="font-size:.72rem;color:var(--muted);margin-top:.3rem">Allena senza scheda assegnata</div>
    </div>
    <div class="card" style="cursor:pointer;border-left:3px solid var(--blue)" onclick="router('today')">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:3px;color:var(--blue)">📋 SCHEDA DI OGGI</div>
      <div style="font-size:.72rem;color:var(--muted);margin-top:.3rem">${asgn ? esc(asgn.template_name) : 'Nessuna scheda assegnata'}</div>
    </div>
  </div>
  ${exs.length ? `<div class="page-title" style="font-size:1.2rem">Anteprima Oggi — ${window.DAYS[window.DKEYS.indexOf(dk)]}</div>
  ${exs.slice(0,3).map(e => `<div class="ex-log-card ${log?.session_exercises?.find(x=>x.exercise_name===e.name)?.done?'done':''}">
    <div class="ex-log-info">
      <div class="ex-mini-thumb">${e.emoji||'🏋️'}</div>
      <div><div class="ex-log-name">${esc(e.name)}</div>
        <div class="ex-log-meta"><span>${e.muscleGroup}</span><span>${e.serie}×${e.reps}</span><span>${e.weight}kg</span></div>
      </div>
    </div></div>`).join('')}` : ''}`);
}

// ══════════════════════════════════════════════════════════════
// ADMIN — USERS
// ══════════════════════════════════════════════════════════════
function renderUserTable(users) {
  if (!users.length) return '<div class="empty">Nessun utente</div>';
  const roleIcon = { admin:'🛡', gym:'🏢', pt:'🏋️', user:'👤' };
  return `<div class="card" style="padding:0;overflow:hidden"><table class="tbl">
  <thead><tr><th>Utente</th><th>Email</th><th>Ruolo</th><th>Azioni</th></tr></thead>
  <tbody>${users.map(u => `<tr>
    <td style="display:flex;align-items:center;gap:.7rem">${userAvatar(u,28)}<strong>${esc(u.nome)} ${esc(u.cognome)}</strong></td>
    <td style="color:var(--muted);font-size:.75rem">${esc(u.email)}</td>
    <td><span class="tag ${u.ruolo==='admin'?'gold':u.ruolo==='pt'?'blue':u.ruolo==='gym'?'orange':''}">${roleIcon[u.ruolo]||''} ${u.ruolo}</span></td>
    <td><div class="flex-gap">
      <button class="btn-secondary btn-sm" onclick="editUserModal('${u.id}')">Modifica</button>
      <button class="btn-danger btn-sm" onclick="delUser('${u.id}')">✕</button>
    </div></td>
  </tr>`).join('')}</tbody></table></div>`;
}

async function renderUsers() {
  const users = await DB.getUsers();
  set(`<div class="flex-between"><div class="page-title">Utenti</div>
    <button class="btn-secondary btn-sm" onclick="addUserModal()">+ Nuovo</button></div>
  ${renderUserTable(users)}`);
}

async function editUserModal(id) {
  const u    = await DB.getUserById(id); if (!u) return;
  const pts  = (await DB.getUsers()).filter(x => x.ruolo === 'pt');
  openModal('Modifica Utente', `
  <div class="fr2">
    <div class="fg"><label>Nome</label><input class="inp" id="eu_n" value="${esc(u.nome)}"></div>
    <div class="fg"><label>Cognome</label><input class="inp" id="eu_c" value="${esc(u.cognome)}"></div>
  </div>
  <div class="fg"><label>Email</label><input class="inp" id="eu_e" value="${esc(u.email)}"></div>
  <div class="fg"><label>Telefono</label><input class="inp" id="eu_t" value="${esc(u.telefono||'')}"></div>
  <div class="fr3">
    <div class="fg"><label>Altezza cm</label><input class="inp" type="number" id="eu_a" value="${u.altezza||''}"></div>
    <div class="fg"><label>Peso kg</label><input class="inp" type="number" step=".5" id="eu_p" value="${u.peso||''}"></div>
    <div class="fg"><label>Grasso %</label><input class="inp" type="number" step=".1" id="eu_g" value="${u.grasso||''}"></div>
  </div>
  <div class="fr2">
    <div class="fg"><label>Ruolo</label><select class="inp" id="eu_r">
      ${['admin','gym','pt','user'].map(r => `<option ${u.ruolo===r?'selected':''}>${r}</option>`).join('')}
    </select></div>
    <div class="fg"><label>Personal Trainer</label><select class="inp" id="eu_pt">
      <option value="">— Nessuno —</option>
      ${pts.map(p => `<option value="${p.id}" ${u.pt_id===p.id?'selected':''}>${esc(p.nome)} ${esc(p.cognome)}</option>`).join('')}
    </select></div>
  </div>
  <button class="btn-primary btn-full" onclick="saveUserEdit('${id}')">Salva</button>`);
}

async function saveUserEdit(id) {
  await DB.updateUser(id, {
    nome: v('eu_n'), cognome: v('eu_c'), email: v('eu_e').toLowerCase(),
    telefono: v('eu_t'), altezza: parseFloat(v('eu_a'))||0,
    peso: parseFloat(v('eu_p'))||0, grasso: parseFloat(v('eu_g'))||0,
    ruolo: v('eu_r'), pt_id: v('eu_pt') || null
  });
  closeModal(); renderUsers(); toast('Aggiornato', 'success');
}

async function delUser(id) {
  if (!confirm('Eliminare utente?')) return;
  await DB.deleteUser(id); renderUsers(); toast('Eliminato', 'success');
}

function addUserModal() {
  openModal('Nuovo Utente', `
  <div class="fr2">
    <div class="fg"><label>Nome *</label><input class="inp" id="nu_n" placeholder="Mario"></div>
    <div class="fg"><label>Cognome *</label><input class="inp" id="nu_c" placeholder="Rossi"></div>
  </div>
  <div class="fg"><label>Email *</label><input class="inp" type="email" id="nu_e"></div>
  <div class="fg"><label>Password *</label><input class="inp" type="password" id="nu_p"></div>
  <div class="fg"><label>Ruolo</label><select class="inp" id="nu_r">
    ${['user','pt','gym','admin'].map(r => `<option>${r}</option>`).join('')}
  </select></div>
  <button class="btn-primary btn-full" onclick="createUser()">Crea</button>`);
}

async function createUser() {
  const nome = v('nu_n').trim(), cognome = v('nu_c').trim();
  const email = v('nu_e').trim().toLowerCase(), pwd = v('nu_p');
  if (!nome || !cognome || !email || pwd.length < 6) { toast('Compila tutti i campi (pwd min 6)', 'error'); return; }
  const ex = await DB.getUserByEmail(email);
  if (ex) { toast('Email già usata', 'error'); return; }
  await DB.createUser({ nome, cognome, email, pwd_hash: hashPwd(pwd), ruolo: v('nu_r'), telefono:'', altezza:0, peso:0, grasso:0, photo_url:'', pt_id:null });
  closeModal(); renderUsers(); toast('Utente creato', 'success');
}

// ══════════════════════════════════════════════════════════════
// PT LIST
// ══════════════════════════════════════════════════════════════
async function renderPTs() {
  const pts  = (await DB.getUsers()).filter(u => u.ruolo === 'pt');
  const all  = await DB.getUsers();
  const tpls = await DB.getTemplates();
  set(`<div class="page-title">Personal Trainer</div>
  ${pts.length ? `<div class="grid-3">${pts.map(pt => {
    const clients = all.filter(u => u.pt_id === pt.id);
    const myTpls  = tpls.filter(t => t.pt_id === pt.id);
    return `<div class="card">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:.8rem">
        ${userAvatar(pt, 48)}
        <div><div style="font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:2px">${esc(pt.nome)} ${esc(pt.cognome)}</div>
          <div style="font-size:.7rem;color:var(--muted)">${esc(pt.email)}</div>
        </div>
      </div>
      <div class="flex-gap"><span class="tag blue">👥 ${clients.length} clienti</span><span class="tag accent">📋 ${myTpls.length} schede</span></div>
    </div>`;
  }).join('')}</div>` : '<div class="empty">Nessun PT</div>'}`);
}

// ══════════════════════════════════════════════════════════════
// EXERCISES
// ══════════════════════════════════════════════════════════════
async function renderExercises() {
  const exs  = await DB.getExercises();
  const isPT = window.CU.ruolo === 'pt' || window.CU.ruolo === 'admin';
  set(`<div class="flex-between"><div class="page-title">Libreria Esercizi</div>
    <div class="flex-gap">
      ${isPT ? '<button class="btn-secondary btn-sm" onclick="addExerciseModal()">+ Nuovo Esercizio</button>' : ''}
      <select class="dd" id="exFilter" onchange="filterExercises()" style="font-size:.75rem;padding:.45rem .8rem">
        <option value="">Tutti i gruppi</option>
        ${window.MUSCLES.map(m => `<option>${m}</option>`).join('')}
      </select>
    </div>
  </div>
  <div id="exLibBody"></div>`);
  filterExercises(exs);
}

async function filterExercises(exs) {
  if (!exs) exs = await DB.getExercises();
  const f = document.getElementById('exFilter')?.value || '';
  const filtered = f ? exs.filter(e => e.muscle_group === f) : exs;
  const el = document.getElementById('exLibBody');
  if (!el) return;
  const isPT = window.CU.ruolo === 'pt' || window.CU.ruolo === 'admin';
  el.innerHTML = filtered.length
    ? `<div class="ex-lib-grid">${filtered.map(e => `
    <div class="ex-lib-card">
      <div class="ex-lib-img">${e.image_url
        ? `<img src="${e.image_url}" onerror="this.parentElement.innerHTML='${e.emoji||'🏋️'}'">` : e.emoji||'🏋️'}</div>
      <div class="ex-lib-body">
        <div class="ex-lib-name">${esc(e.name)}</div>
        <div class="ex-lib-muscle">${e.muscle_group}</div>
        ${e.description ? `<div style="font-size:.62rem;color:var(--muted);margin-top:.2rem">${esc(e.description)}</div>` : ''}
        ${e.video_url ? `<a href="${esc(e.video_url)}" target="_blank" style="font-size:.62rem;color:var(--blue);display:block;margin-top:.3rem">▶ Guarda video</a>` : ''}
        <div class="flex-gap" style="margin-top:.5rem">
          ${e.is_default ? '<span class="tag" style="font-size:.5rem">DEFAULT</span>' : '<span class="tag accent" style="font-size:.5rem">CUSTOM</span>'}
          ${isPT ? `<button class="btn-secondary btn-sm" onclick="editExerciseModal('${e.id}')">✏️</button>` : ''}
          ${!e.is_default && isPT ? `<button class="btn-danger btn-sm" onclick="delExercise('${e.id}')">✕</button>` : ''}
        </div>
      </div>
    </div>`).join('')}</div>`
    : '<div class="empty">Nessun esercizio</div>';
}

function addExerciseModal() {
  openModal('Nuovo Esercizio', `
  <div class="fg"><label>Nome *</label><input class="inp" id="ne_name" placeholder="Es: Cable Fly"></div>
  <div class="fr2">
    <div class="fg"><label>Gruppo Muscolare *</label><select class="inp" id="ne_muscle">
      ${window.MUSCLES.map(m => `<option>${m}</option>`).join('')}
    </select></div>
    <div class="fg"><label>Emoji</label><input class="inp" id="ne_emoji" value="🏋️" maxlength="4"></div>
  </div>
  <div class="fg"><label>Descrizione</label><textarea class="inp" id="ne_desc" rows="2" placeholder="Breve descrizione dell'esercizio"></textarea></div>
  <div class="fg"><label>Foto (URL o upload)</label>
    <div style="display:flex;gap:.5rem">
      <input class="inp" id="ne_img" placeholder="https://..." style="flex:1" oninput="previewImg('ne_img','ne_prev')">
      <label class="btn-secondary btn-sm" style="cursor:pointer">📷<input type="file" accept="image/*" style="display:none" onchange="uploadImg(this,'ne_img','ne_prev')"></label>
    </div>
    <div id="ne_prev" style="margin-top:.5rem"></div>
  </div>
  <div class="fg"><label>Video YouTube (URL)</label>
    <input class="inp" id="ne_video" placeholder="https://youtube.com/watch?v=...">
  </div>
  <button class="btn-primary btn-full" style="margin-top:.5rem" onclick="saveNewExercise()">Salva Esercizio</button>`);
}

function previewImg(inputId, prevId) {
  const url = v(inputId); const prev = document.getElementById(prevId);
  if (prev) prev.innerHTML = url ? `<img src="${url}" style="width:100%;max-height:120px;object-fit:cover;border:1px solid var(--border)">` : '';
}

function uploadImg(input, inputId, prevId) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const el = document.getElementById(inputId); if (el) el.value = e.target.result;
    previewImg(inputId, prevId);
  };
  reader.readAsDataURL(file);
}

async function saveNewExercise() {
  const name = v('ne_name').trim();
  if (!name) { toast('Inserisci il nome', 'error'); return; }
  await DB.createExercise({ name, muscle_group: v('ne_muscle'), emoji: v('ne_emoji')||'🏋️', description: v('ne_desc'), image_url: v('ne_img'), video_url: v('ne_video'), is_default: false, created_by: window.CU.id });
  closeModal(); renderExercises(); toast('Esercizio aggiunto', 'success');
}

async function editExerciseModal(id) {
  const exs = await DB.getExercises(); const e = exs.find(x => x.id === id); if (!e) return;
  openModal('Modifica Esercizio', `
  <div class="fg"><label>Nome</label><input class="inp" id="ee_name" value="${esc(e.name)}"></div>
  <div class="fr2">
    <div class="fg"><label>Gruppo</label><select class="inp" id="ee_muscle">
      ${window.MUSCLES.map(m => `<option ${e.muscle_group===m?'selected':''}>${m}</option>`).join('')}
    </select></div>
    <div class="fg"><label>Emoji</label><input class="inp" id="ee_emoji" value="${e.emoji||'🏋️'}" maxlength="4"></div>
  </div>
  <div class="fg"><label>Descrizione</label><textarea class="inp" id="ee_desc" rows="2">${esc(e.description||'')}</textarea></div>
  <div class="fg"><label>Foto</label>
    ${e.image_url ? `<img src="${e.image_url}" style="width:100%;max-height:100px;object-fit:cover;margin-bottom:.5rem;border:1px solid var(--border)">` : ''}
    <div style="display:flex;gap:.5rem">
      <input class="inp" id="ee_img" value="${e.image_url||''}" style="flex:1" oninput="previewImg('ee_img','ee_prev')">
      <label class="btn-secondary btn-sm" style="cursor:pointer">📷<input type="file" accept="image/*" style="display:none" onchange="uploadImg(this,'ee_img','ee_prev')"></label>
    </div>
    <div id="ee_prev"></div>
  </div>
  <div class="fg"><label>Video YouTube (URL)</label>
    <input class="inp" id="ee_video" value="${esc(e.video_url||'')}" placeholder="https://youtube.com/watch?v=...">
    ${e.video_url ? `<a href="${esc(e.video_url)}" target="_blank" style="font-size:.65rem;color:var(--blue);margin-top:.3rem;display:inline-block">▶ Guarda video attuale</a>` : ''}
  </div>
  <button class="btn-primary btn-full" style="margin-top:.5rem" onclick="saveExEdit('${id}')">Salva</button>`);
}

async function saveExEdit(id) {
  await DB.updateExercise(id, { name: v('ee_name'), muscle_group: v('ee_muscle'), emoji: v('ee_emoji'), description: v('ee_desc'), image_url: v('ee_img'), video_url: v('ee_video') });
  closeModal(); renderExercises(); toast('Salvato', 'success');
}

async function delExercise(id) {
  if (!confirm('Eliminare?')) return;
  await DB.deleteExercise(id); renderExercises(); toast('Eliminato', 'success');
}

// ══════════════════════════════════════════════════════════════
// GYM PROFILE
// ══════════════════════════════════════════════════════════════
async function renderGym() {
  const g = await DB.getGym();
  set(`<div class="page-title">Profilo Palestra</div>
  <div class="gym-header">
    <div class="gym-banner">${g.logo_url ? `<img src="${g.logo_url}">` : ''}<span style="color:var(--muted);opacity:.3;font-size:5rem">🏋️</span></div>
    <div class="gym-overlay"><div class="gym-name-big">${esc(g.name||'Nome Palestra')}</div></div>
  </div>
  <div class="card"><div class="card-title">Informazioni</div>
    <div class="fg"><label>Nome Palestra *</label><input class="inp" id="g_name" value="${esc(g.name||'')}"></div>
    <div class="fg"><label>Logo / Banner</label>
      <div style="display:flex;gap:.5rem">
        <input class="inp" id="g_logo" value="${g.logo_url||''}" placeholder="URL logo" style="flex:1" oninput="previewImg('g_logo','g_prev')">
        <label class="btn-secondary btn-sm" style="cursor:pointer">📁<input type="file" accept="image/*" style="display:none" onchange="uploadImg(this,'g_logo','g_prev')"></label>
      </div>
      <div id="g_prev"></div>
    </div>
    <div class="fr2">
      <div class="fg"><label>Telefono</label><input class="inp" id="g_phone" value="${esc(g.phone||'')}"></div>
      <div class="fg"><label>Email</label><input class="inp" id="g_email" value="${esc(g.email||'')}"></div>
    </div>
    <div class="fg"><label>Indirizzo</label><input class="inp" id="g_addr" value="${esc(g.address||'')}"></div>
    <div class="fg"><label>Partita IVA</label><input class="inp" id="g_vat" value="${esc(g.vat_id||'')}"></div>
    <div class="fg"><label>Descrizione</label><textarea class="inp" id="g_desc" rows="3">${esc(g.description||'')}</textarea></div>
    <button class="btn-primary" style="margin-top:.5rem" onclick="saveGym()">Salva</button>
  </div>`);
}

async function saveGym() {
  const name = v('g_name').trim(); if (!name) { toast('Inserisci nome', 'error'); return; }
  await DB.saveGym({ name, logo_url: v('g_logo'), phone: v('g_phone'), email: v('g_email'), address: v('g_addr'), vat_id: v('g_vat'), description: v('g_desc') });
  toast('Palestra salvata', 'success'); renderGym();
}

// ══════════════════════════════════════════════════════════════
// ROOMS
// ══════════════════════════════════════════════════════════════
function roomMiniCard(r) {
  return `<div class="room-card">
    <div class="room-banner">${r.image_url?`<img src="${r.image_url}">`:''}
      <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.85),transparent);display:flex;align-items:flex-end;padding:.8rem">
        <div><div class="room-name" style="font-size:1rem">${esc(r.name)}</div>
          <div style="font-size:.6rem;color:var(--muted)">${esc(r.activity||'')}</div>
        </div>
      </div>
    </div>
  </div>`;
}

async function renderRooms() {
  const rooms = await DB.getRooms();
  set(`<div class="flex-between"><div class="page-title">Gestione Sale</div>
    <button class="btn-secondary btn-sm" onclick="addRoomModal()">+ Nuova Sala</button></div>
  ${rooms.length ? `<div class="grid-3">${rooms.map(r => `
  <div class="room-card">
    <div class="room-banner">${r.image_url?`<img src="${r.image_url}">`:''}
      <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.85),transparent);display:flex;align-items:flex-end;padding:.8rem">
        <div><div class="room-name">${esc(r.name)}</div>
          <div class="flex-gap" style="margin-top:.2rem"><span class="tag">${esc(r.activity||'')}</span><span class="tag">👥 ${r.capacity}</span></div>
        </div>
      </div>
    </div>
    <div class="room-body">
      <div style="font-size:.72rem;color:var(--muted);margin-bottom:.8rem">${esc(r.description||'')}</div>
      <div class="flex-gap">
        <button class="btn-secondary btn-sm" onclick="editRoomModal('${r.id}')">Modifica</button>
        <button class="btn-secondary btn-sm" onclick="goRoomCal('${r.id}')">Calendario</button>
        <button class="btn-danger btn-sm" onclick="delRoom('${r.id}')">✕</button>
      </div>
    </div>
  </div>`).join('')}</div>` : '<div class="empty">Nessuna sala</div>'}`);
}

function roomFormHtml(r) {
  return `
  <div class="fg"><label>Nome Sala *</label><input class="inp" id="rm_name" value="${r?esc(r.name):''}"></div>
  <div class="fr2">
    <div class="fg"><label>Attività</label><select class="inp" id="rm_act">
      ${window.ACTIVITIES.map(a => `<option ${r&&r.activity===a?'selected':''}>${a}</option>`).join('')}
    </select></div>
    <div class="fg"><label>Capienza</label><input class="inp" type="number" id="rm_cap" value="${r?r.capacity:10}" min="1"></div>
  </div>
  <div class="fg"><label>Descrizione</label><input class="inp" id="rm_desc" value="${r?esc(r.description||''):''}"></div>
  <div class="fg"><label>Immagine</label>
    ${r&&r.image_url?`<img src="${r.image_url}" style="width:100%;max-height:100px;object-fit:cover;margin-bottom:.5rem;border:1px solid var(--border)">`:''}
    <div style="display:flex;gap:.5rem">
      <input class="inp" id="rm_img" value="${r?r.image_url||'':''}" style="flex:1" oninput="previewImg('rm_img','rm_prev')">
      <label class="btn-secondary btn-sm" style="cursor:pointer">📁<input type="file" accept="image/*" style="display:none" onchange="uploadImg(this,'rm_img','rm_prev')"></label>
    </div>
    <div id="rm_prev"></div>
  </div>
  <button class="btn-primary btn-full" style="margin-top:.5rem" onclick="saveRoom('${r?r.id:''}')">Salva Sala</button>`;
}

function addRoomModal()     { openModal('Nuova Sala', roomFormHtml(null)); }
async function editRoomModal(id) { const rooms = await DB.getRooms(); const r = rooms.find(x => x.id === id); openModal('Modifica Sala', roomFormHtml(r)); }

async function saveRoom(id) {
  const name = v('rm_name').trim(); if (!name) { toast('Inserisci nome sala', 'error'); return; }
  const data = { name, activity: v('rm_act'), capacity: parseInt(v('rm_cap'))||10, description: v('rm_desc'), image_url: v('rm_img') };
  if (id) await DB.updateRoom(id, data); else await DB.createRoom(data);
  closeModal(); renderRooms(); toast('Sala salvata', 'success');
}

async function delRoom(id) {
  if (!confirm('Eliminare la sala?')) return;
  await DB.deleteRoom(id); renderRooms(); toast('Eliminata', 'success');
}

function goRoomCal(roomId) {
  sessionStorage.setItem('rcRoom', roomId); router('room_cal');
}

// ── ROOM CALENDAR ─────────────────────────────────────────────
const HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

async function renderRoomCal() {
  const rooms = await DB.getRooms();
  const saved = sessionStorage.getItem('rcRoom');
  const defId = rooms[0]?.id || '';
  set(`<div class="flex-between"><div class="page-title">Calendario Sale</div>
    <select class="dd" id="rcRoom" onchange="loadRoomCal()" style="font-size:.8rem">
      ${rooms.map(r => `<option value="${r.id}" ${r.id===(saved||defId)?'selected':''}>${esc(r.name)}</option>`).join('')}
    </select>
  </div><div id="rcBody"><div class="loading">Caricamento...</div></div>`);
  loadRoomCal();
}

async function loadRoomCal() {
  const roomId = document.getElementById('rcRoom')?.value; if (!roomId) return;
  sessionStorage.setItem('rcRoom', roomId);
  const sched = await DB.getRoomSched(roomId);
  const body  = document.getElementById('rcBody'); if (!body) return;
  const pts   = (await DB.getUsers()).filter(u => u.ruolo === 'pt');
  let html = `<div class="flex-gap" style="margin-bottom:1rem">
    <button class="btn-secondary btn-sm" onclick="addRoomEventModal('${roomId}')">+ Aggiungi Corso</button>
  </div><div style="overflow-x:auto"><div class="room-cal-grid" style="min-width:560px">
  <div class="rcal-header"></div>${window.DAYS.map(d => `<div class="rcal-header">${d.slice(0,3)}</div>`).join('')}`;
  HOURS.forEach(h => {
    html += `<div class="rcal-time">${h}</div>`;
    window.DKEYS.forEach(dk => {
      const evs = (sched[dk]||[]).filter(e => (e.event_time||e.time||'').slice(0,5) === h);
      html += `<div class="rcal-cell" onclick="addRoomEventModal('${roomId}','${dk}','${h}')">
        ${evs.map(ev => `<div class="rcal-event ${ev.activity==='Spinning'?'red-ev':['Yoga','Pilates'].includes(ev.activity)?'blue-ev':''}">
          <strong>${esc(ev.activity||'')}</strong> ${ev.duration_min||ev.dur||60}min
          <button onclick="event.stopPropagation();delRoomEvt('${roomId}','${ev.id}')"
            style="float:right;background:none;border:none;color:var(--muted);cursor:pointer">✕</button>
        </div>`).join('')}
      </div>`;
    });
  });
  html += `</div></div>`;
  body.innerHTML = html;
}

function addRoomEventModal(roomId, dk='lun', time='09:00') {
  openModal('Aggiungi Corso', `
  <div class="fr2">
    <div class="fg"><label>Attività</label><select class="inp" id="rev_act">${window.ACTIVITIES.map(a=>`<option>${a}</option>`).join('')}</select></div>
    <div class="fg"><label>Giorno</label><select class="inp" id="rev_day">${window.DKEYS.map((d,i)=>`<option value="${d}" ${d===dk?'selected':''}>${window.DAYS[i]}</option>`).join('')}</select></div>
  </div>
  <div class="fr2">
    <div class="fg"><label>Orario</label><input class="inp" type="time" id="rev_time" value="${time}"></div>
    <div class="fg"><label>Durata (min)</label><input class="inp" type="number" id="rev_dur" value="60" min="15" step="15"></div>
  </div>
  <div class="fg"><label>Max Partecipanti</label><input class="inp" type="number" id="rev_maxp" value="10" min="1"></div>
  <div class="fg"><label>Note</label><input class="inp" id="rev_notes" placeholder="Es: Livello base..."></div>
  <button class="btn-primary btn-full" style="margin-top:.5rem" onclick="saveRoomEvt('${roomId}')">Aggiungi</button>`);
}

async function saveRoomEvt(roomId) {
  await DB.addRoomEvent({ room_id: roomId, day_key: v('rev_day'), event_time: v('rev_time'), duration_min: parseInt(v('rev_dur'))||60, activity: v('rev_act'), max_participants: parseInt(v('rev_maxp'))||10, notes: v('rev_notes') });
  closeModal(); loadRoomCal(); toast('Corso aggiunto', 'success');
}

async function delRoomEvt(roomId, evId) {
  await DB.deleteRoomEvent(roomId, evId); loadRoomCal(); toast('Rimosso', 'success');
}

// ══════════════════════════════════════════════════════════════
// PT — CLIENTS
// ══════════════════════════════════════════════════════════════
async function renderClients() {
  const clients = (await DB.getUsers()).filter(u => u.pt_id === window.CU.id);
  const asgns   = await DB.getAssignments({ ptId: window.CU.id });
  set(`<div class="page-title">I Miei Clienti</div>
  ${clients.length ? clients.map(u => {
    const a   = asgns.find(x => x.user_id === u.id);
    const imc = u.altezza && u.peso ? (u.peso / ((u.altezza/100)**2)).toFixed(1) : '—';
    return `<div class="card"><div class="flex-between">
      <div style="display:flex;align-items:center;gap:1rem">
        ${userAvatar(u, 52)}
        <div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:2px">${esc(u.nome)} ${esc(u.cognome)}</div>
          <div style="font-size:.7rem;color:var(--muted)">${esc(u.email)}</div>
          <div class="flex-gap" style="margin-top:.4rem">
            ${u.altezza?`<span class="tag">↕ ${u.altezza}cm</span>`:''}
            ${u.peso?`<span class="tag">⚖️ ${u.peso}kg</span>`:''}
            ${u.altezza&&u.peso?`<span class="tag">IMC ${imc}</span>`:''}
          </div>
        </div>
      </div>
      <div class="flex-gap">
        ${a?`<span class="tag accent">📋 ${esc(a.template_name)}</span>`:'<span class="tag">No scheda</span>'}
        <button class="btn-secondary btn-sm" onclick="renderClientStats('${u.id}')">📊 Stats</button>
        <button class="btn-secondary btn-sm" onclick="router('assign')">Assegna</button>
      </div>
    </div></div>`;
  }).join('') : '<div class="empty">Nessun cliente assegnato</div>'}`);
}

// ══════════════════════════════════════════════════════════════
// PT — TEMPLATES
// ══════════════════════════════════════════════════════════════
async function renderTemplates() {
  const tpls = await DB.getTemplates(window.CU.id);
  set(`<div class="flex-between"><div class="page-title">Le Mie Schede</div>
    <button class="btn-secondary btn-sm" onclick="newTemplate()">+ Nuova Scheda</button></div>
  ${tpls.length ? tpls.map(t => {
    const cnt  = Object.values(t.schedule||{}).flat().length;
    const days = window.DKEYS.filter(d => t.schedule[d]?.length).map(d => window.DAYS[window.DKEYS.indexOf(d)]);
    return `<div class="card"><div class="flex-between">
      <div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:3px">${esc(t.nome)}</div>
        ${t.description?`<div style="font-size:.7rem;color:var(--muted)">${esc(t.description)}</div>`:''}
        <div class="flex-gap" style="margin-top:.5rem"><span class="tag accent">${cnt} esercizi</span>${days.map(d=>`<span class="tag">${d}</span>`).join('')}</div>
      </div>
      <div class="flex-gap">
        <button class="btn-secondary btn-sm" onclick="editTemplate('${t.id}')">✏️ Modifica</button>
        <button class="btn-secondary btn-sm" onclick="shareQR('template','${t.id}')">📱 QR</button>
        <button class="btn-danger btn-sm" onclick="delTemplate('${t.id}')">✕</button>
      </div>
    </div></div>`;
  }).join('') : '<div class="empty">Nessuna scheda. Crea la prima!</div>'}`);
}

async function newTemplate() {
  const t = await DB.createTemplate({ pt_id: window.CU.id, nome: 'Nuova Scheda', description: '', schedule: { lun:[], mar:[], mer:[], gio:[], ven:[], sab:[], dom:[] } });
  editTemplate(t.id);
}

async function editTemplate(id) {
  const tpls = await DB.getTemplates(window.CU.id);
  const t    = tpls.find(x => x.id === id); if (!t) return;
  const exs  = await DB.getExercises();
  openModal('Modifica Scheda', buildTplEditor(t, exs), '950px');
}

function buildTplEditor(t, exs) {
  const exSelect = exs.map(e => `<option value="${e.id}" data-muscle="${e.muscle_group}" data-emoji="${e.emoji||'🏋️'}">${esc(e.name)} (${e.muscle_group})</option>`).join('');
  let html = `
  <div class="fg"><label>Nome Scheda *</label><input class="inp" id="te_n" value="${esc(t.nome)}"></div>
  <div class="fg"><label>Descrizione</label><input class="inp" id="te_d" value="${esc(t.description||'')}"></div>
  <div class="divider"></div>`;
  window.DKEYS.forEach((dk, i) => {
    const dayExs = (t.schedule[dk] || []);
    html += `<div class="wb-day">
    <div class="wb-day-hdr" onclick="this.nextElementSibling.classList.toggle('open')">
      <span class="wb-day-title">${window.DAYS[i]}</span>
      <div class="flex-gap"><span class="tag">${dayExs.length} esercizi</span><span style="color:var(--muted)">▼</span></div>
    </div>
    <div class="wb-day-body ${dayExs.length?'open':''}">
      <div class="wb-ex-hdr">
        <div class="wb-col"></div><div class="wb-col">Esercizio</div><div class="wb-col">Gruppo</div>
        <div class="wb-col">Serie</div><div class="wb-col">Reps</div><div class="wb-col">Peso</div>
        <div class="wb-col">Nota PT</div><div></div>
      </div>
      <div id="exlist_${dk}">${dayExs.map(e => buildExRow(dk, e, exSelect)).join('')}</div>
      <button class="add-ex-btn" onclick="addExRow('${dk}')">+ Aggiungi Esercizio</button>
    </div></div>`;
  });
  html += `<div style="margin-top:1.5rem;display:flex;gap:1rem">
    <button class="btn-primary" onclick="saveTpl('${t.id}')">💾 Salva Scheda</button>
    <button class="btn-secondary" onclick="closeModal()">Annulla</button>
  </div>`;
  window._tplExSelect = exSelect;
  return html;
}

function buildExRow(dk, e, exSelect) {
  const wOpts = window.WEIGHT_OPTS.map(w => `<option value="${w}" ${e.weight==w?'selected':''}>${w}</option>`).join('');
  const sOpts = window.SERIE_OPTS.map(s  => `<option ${e.serie==s?'selected':''}>${s}</option>`).join('');
  const rOpts = window.REPS_OPTS.map(r   => `<option ${e.reps==r?'selected':''}>${r}</option>`).join('');
  return `<div class="wb-ex-row" id="exrow_${e.id}">
    <div class="ex-mini-thumb" id="exthumb_${e.id}">${e.emoji||'🏋️'}</div>
    <select class="dd" style="font-size:.73rem" data-f="exId" data-eid="${e.id}" data-dk="${dk}" onchange="onExSelect(this,'${e.id}')">
      ${exSelect.replace(`value="${e.exId}"`, `value="${e.exId}" selected`)}
    </select>
    <select class="dd" data-f="muscleGroup" data-eid="${e.id}" data-dk="${dk}">
      ${window.MUSCLES.map(m => `<option ${e.muscleGroup===m?'selected':''}>${m}</option>`).join('')}
    </select>
    <select class="dd" data-f="serie" data-eid="${e.id}" data-dk="${dk}">${sOpts}</select>
    <select class="dd" data-f="reps" data-eid="${e.id}" data-dk="${dk}">${rOpts}</select>
    <select class="dd" style="width:72px" data-f="weight" data-eid="${e.id}" data-dk="${dk}">${wOpts}</select>
    <input class="inp" style="font-size:.73rem" data-f="note" data-eid="${e.id}" data-dk="${dk}" value="${esc(e.note||'')}" placeholder="Nota PT">
    <button class="btn-danger btn-sm" onclick="document.getElementById('exrow_${e.id}').remove()">✕</button>
  </div>`;
}

function onExSelect(sel, rowId) {
  const opt = sel.options[sel.selectedIndex];
  const muscle = opt?.dataset?.muscle || '';
  const emoji  = opt?.dataset?.emoji  || '🏋️';
  const thumb  = document.getElementById('exthumb_' + rowId);
  if (thumb) thumb.textContent = emoji;
  const mSel = document.querySelector(`[data-eid="${rowId}"][data-f="muscleGroup"]`);
  if (mSel) mSel.value = muscle;
}

function addExRow(dk) {
  const exs = window._tplExSelect || '';
  const id  = 'new_' + Date.now();
  const e   = { id, exId: '', muscleGroup: 'Petto', emoji:'🏋️', serie:3, reps:10, weight:0, note:'' };
  const list = document.getElementById('exlist_' + dk);
  if (list) list.insertAdjacentHTML('beforeend', buildExRow(dk, e, exs));
}

async function saveTpl(id) {
  const nome = v('te_n').trim(); if (!nome) { toast('Inserisci nome', 'error'); return; }
  const schedule = {};
  window.DKEYS.forEach(dk => {
    const rows = document.querySelectorAll(`[data-dk="${dk}"]`);
    const exMap = {};
    rows.forEach(el => {
      const eid = el.dataset.eid; if (!eid) return;
      if (!exMap[eid]) exMap[eid] = { id: eid };
      const f = el.dataset.f;
      if (f === 'serie' || f === 'reps') exMap[eid][f] = parseInt(el.value);
      else if (f === 'weight') exMap[eid].weight = parseFloat(el.value);
      else if (f === 'exId') {
        const opt = el.options[el.selectedIndex];
        exMap[eid].exId = el.value;
        exMap[eid].name = opt?.text?.split(' (')[0] || '';
        exMap[eid].emoji = opt?.dataset?.emoji || '🏋️';
      } else exMap[eid][f] = el.value;
    });
    schedule[dk] = Object.values(exMap).filter(e => e.name);
  });
  await DB.updateTemplate(id, { nome, description: v('te_d'), schedule });
  closeModal(); renderTemplates(); toast('Scheda salvata', 'success');
}

async function delTemplate(id) {
  if (!confirm('Eliminare?')) return;
  await DB.deleteTemplate(id); renderTemplates(); toast('Eliminata', 'success');
}

// ══════════════════════════════════════════════════════════════
// PT — ASSIGN
// ══════════════════════════════════════════════════════════════
async function renderAssign() {
  const clients = (await DB.getUsers()).filter(u => u.pt_id === window.CU.id);
  const tpls    = await DB.getTemplates(window.CU.id);
  const asgns   = await DB.getAssignments({ ptId: window.CU.id });
  set(`<div class="page-title">Assegna Scheda</div>
  ${!clients.length ? '<div class="info-box">Nessun cliente assegnato.</div>' : !tpls.length ? '<div class="info-box">Crea prima una scheda.</div>' : `
  <div class="card"><div class="card-title">Nuova Assegnazione</div>
    <div class="fr2">
      <div class="fg"><label>Cliente</label><select class="inp" id="asgn_u">
        ${clients.map(u => `<option value="${u.id}">${esc(u.nome)} ${esc(u.cognome)}</option>`).join('')}
      </select></div>
      <div class="fg"><label>Scheda</label><select class="inp" id="asgn_t">
        ${tpls.map(t => `<option value="${t.id}">${esc(t.nome)}</option>`).join('')}
      </select></div>
    </div>
    <div class="fg"><label>Data Inizio</label><input class="inp" type="date" id="asgn_d" value="${today()}" style="max-width:200px"></div>
    <button class="btn-primary" onclick="doAssign()">Assegna ▶</button>
  </div>`}
  <div class="page-title" style="font-size:1.2rem">Assegnazioni Attive</div>
  ${asgns.length ? asgns.map(a => {
    const u = clients.find(x => x.id === a.user_id);
    return `<div class="card"><div class="flex-between">
      <div style="display:flex;align-items:center;gap:.8rem">${userAvatar(u||{nome:'?',photo_url:''}, 36)}
        <div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:1rem;font-weight:700;letter-spacing:2px">${u?esc(u.nome+' '+u.cognome):'—'}</div>
          <div style="font-size:.7rem;color:var(--muted)">${esc(a.template_name)} · Dal ${fmtDate(a.start_date)}</div>
        </div>
      </div>
      <div class="flex-gap">
        <button class="btn-secondary btn-sm" onclick="shareQR('assignment','${a.id}')">📱 QR</button>
        <button class="btn-danger btn-sm" onclick="delAsgn('${a.id}')">✕</button>
      </div>
    </div></div>`;
  }).join('') : '<div class="empty">Nessuna assegnazione</div>'}`);
}

async function doAssign() {
  const userId = v('asgn_u'), tplId = v('asgn_t'), date = v('asgn_d');
  const tpls = await DB.getTemplates(window.CU.id);
  const t = tpls.find(x => x.id === tplId); if (!t) return;
  await DB.upsertAssignment({ pt_id: window.CU.id, user_id: userId, template_id: tplId, template_name: t.nome, start_date: date || today(), schedule: t.schedule });
  toast('Scheda assegnata', 'success'); renderAssign();
}

async function delAsgn(id) {
  if (!confirm('Rimuovere?')) return;
  await DB.deleteAssignment(id); renderAssign(); toast('Rimossa', 'success');
}

// ══════════════════════════════════════════════════════════════
// PT — FEEDBACK
// ══════════════════════════════════════════════════════════════
async function renderFeedback() {
  const clients = (await DB.getUsers()).filter(u => u.pt_id === window.CU.id);
  set(`<div class="page-title">Feedback Clienti</div>
  <select class="dd" id="fbF" onchange="loadFeedback()" style="font-size:.8rem;margin-bottom:1.5rem">
    <option value="">Tutti i clienti</option>
    ${clients.map(u => `<option value="${u.id}">${esc(u.nome)} ${esc(u.cognome)}</option>`).join('')}
  </select>
  <div id="fbList"><div class="loading">Caricamento...</div></div>`);
  loadFeedback();
}

async function loadFeedback() {
  const clients = (await DB.getUsers()).filter(u => u.pt_id === window.CU.id);
  const filt    = document.getElementById('fbF')?.value || '';
  const toShow  = filt ? clients.filter(u => u.id === filt) : clients;
  const el      = document.getElementById('fbList'); if (!el) return;
  let html = '';
  for (const u of toShow) {
    const sessions = await DB.getSessions(u.id, 20);
    sessions.filter(s => s.session_exercises?.some(e => e.comment)).forEach(s => {
      html += `<div class="card"><div class="flex-between" style="margin-bottom:.8rem">
        <div style="display:flex;align-items:center;gap:.8rem">${userAvatar(u,34)}
          <div><strong style="font-size:.9rem">${esc(u.nome)} ${esc(u.cognome)}</strong>
            <div style="font-size:.7rem;color:var(--muted)">${fmtDate(s.session_date)} · ${s.is_free?'🆓 Libero':'📋 Scheda'}</div>
          </div>
        </div>
        <span class="tag ${s.session_exercises.filter(e=>e.done).length===s.session_exercises.length&&s.session_exercises.length?'accent':''}">${s.session_exercises.filter(e=>e.done).length}/${s.session_exercises.length}</span>
      </div>
      ${s.session_exercises.filter(e => e.comment).map(e => `
      <div style="padding:.6rem 0;border-bottom:1px solid var(--border2)">
        <div style="font-size:.82rem"><span style="color:${e.done?'var(--accent)':'var(--muted)'}">●</span> <strong>${esc(e.exercise_name)}</strong> ${e.serie}×${e.reps} @${e.weight}kg</div>
        <div style="margin-top:.4rem;padding:.5rem .8rem;background:rgba(61,158,255,.07);border-left:2px solid var(--blue)">
          <div style="font-size:.6rem;color:var(--blue);letter-spacing:2px;text-transform:uppercase;margin-bottom:.2rem">Commento</div>
          <div style="font-size:.78rem">${esc(e.comment)}</div>
          ${e.pt_reply
            ? `<div style="margin-top:.4rem;padding:.4rem .6rem;background:rgba(200,241,53,.06);border-left:2px solid var(--accent)">
                <div style="font-size:.55rem;color:var(--accent);text-transform:uppercase;letter-spacing:2px;margin-bottom:.2rem">Tua risposta</div>
                <div style="font-size:.78rem">${esc(e.pt_reply)}</div>
                <button class="btn-secondary btn-sm" style="margin-top:.3rem" onclick="replyModal('${s.id}','${e.id}')">Modifica</button>
              </div>`
            : `<button class="btn-secondary btn-sm" style="margin-top:.4rem" onclick="replyModal('${s.id}','${e.id}')">↩ Rispondi</button>`}
        </div>
      </div>`).join('')}
      </div>`;
    });
  }
  el.innerHTML = html || '<div class="empty">Nessun commento</div>';
}

function replyModal(sessionId, exId) {
  openModal('Rispondi', `
  <div class="fg"><label>La tua risposta</label>
    <textarea class="inp" id="ptRep" rows="3"></textarea>
  </div>
  <button class="btn-primary btn-full" onclick="saveReply('${sessionId}','${exId}')">Invia</button>`);
}

async function saveReply(sessionId, exId) {
  const rep = v('ptRep').trim(); if (!rep) { toast('Scrivi risposta', 'error'); return; }
  // Find exercise in session and update
  const sessions = await DB.getSessions(window.CU.id, 1);
  // We need to find it across clients
  const clients = (await DB.getUsers()).filter(u => u.pt_id === window.CU.id);
  for (const c of clients) {
    const ss = await DB.getSessions(c.id, 50);
    const s  = ss.find(x => x.id === sessionId); if (!s) continue;
    const e  = s.session_exercises?.find(x => x.id === exId); if (!e) continue;
    await DB.upsertSessionExercise({ ...e, pt_reply: rep });
    break;
  }
  closeModal(); loadFeedback(); toast('Risposta inviata', 'success');
}

// ══════════════════════════════════════════════════════════════
// USER — CALENDAR
// ══════════════════════════════════════════════════════════════
async function renderCalendar() {
  const asgns = await DB.getAssignments({ userId: window.CU.id });
  const asgn  = asgns[0];
  const wo    = parseInt(sessionStorage.getItem('calWO') || '0');
  const base  = new Date(); base.setDate(base.getDate() + wo * 7);
  const dow   = base.getDay(); const mon = new Date(base);
  mon.setDate(mon.getDate() - (dow === 0 ? 6 : dow - 1));
  const wDates  = Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(d.getDate() + i); return d; });
  const todayStr = today();

  set(`<div class="flex-between">
    <div class="page-title">Calendario</div>
    <div class="flex-gap">
      <button class="btn-secondary btn-sm" onclick="calNav(-1)">‹</button>
      <button class="btn-secondary btn-sm" onclick="calNav(0)">Oggi</button>
      <button class="btn-secondary btn-sm" onclick="calNav(1)">›</button>
    </div>
  </div>
  <div style="font-size:.7rem;color:var(--muted);margin-bottom:1rem">${mon.toLocaleDateString('it-IT',{day:'numeric',month:'long'})} — ${wDates[6].toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'})}</div>
  ${!asgn ? '<div class="info-box">Nessuna scheda assegnata — usa l\'Allenamento Libero per registrare le tue sessioni.</div>' : ''}
  <div class="week-cal" id="calGrid"><div class="loading" style="grid-column:span 7">Caricamento...</div></div>
  <div class="flex-gap"><span class="tag accent">▊ Completato</span><span class="tag blue">▊ Commentato</span><span class="tag">▊ Da fare</span></div>`);

  // Load sessions for the week
  const weekSessions = {};
  const allSessions  = asgn ? await DB.getSessions(window.CU.id, 60) : [];
  allSessions.forEach(s => { weekSessions[s.session_date] = s; });

  const grid = document.getElementById('calGrid'); if (!grid) return;
  grid.innerHTML = wDates.map((d, i) => {
    const dk  = window.DKEYS[i];
    const exs = asgn ? (asgn.schedule[dk] || []) : [];
    const dStr = d.toISOString().split('T')[0];
    const log  = weekSessions[dStr];
    const done = log ? log.session_exercises.filter(e => e.done).length : 0;
    return `<div class="cal-day ${dStr === todayStr ? 'today' : ''}" onclick="openDayModal('${dStr}','${dk}')">
      <div class="cal-dname">${window.DAYS[i].slice(0,3)}</div>
      <div class="cal-dnum">${d.getDate()}</div>
      ${exs.length ? `<div class="cal-count">${done}/${exs.length}</div>` : ''}
      ${exs.slice(0,3).map(e => {
        const le = log?.session_exercises?.find(x => x.exercise_name === e.name);
        return `<div class="cal-chip ${le?.done?'done':''} ${le?.comment?'commented':''}">${esc(e.name)}</div>`;
      }).join('')}
      ${log?.is_free ? `<div class="cal-chip" style="border-left-color:var(--gold);color:var(--gold)">🆓 Libero</div>` : ''}
      ${!exs.length && !log ? '<div style="font-size:.6rem;color:var(--muted2);margin-top:.3rem">Riposo</div>' : ''}
    </div>`;
  }).join('');
}

function calNav(d) {
  const cur = parseInt(sessionStorage.getItem('calWO') || '0');
  sessionStorage.setItem('calWO', d === 0 ? '0' : String(cur + d));
  renderCalendar();
}

async function openDayModal(dStr, dk) {
  const asgns = await DB.getAssignments({ userId: window.CU.id });
  const asgn  = asgns[0];
  const exs   = asgn ? (asgn.schedule[dk] || []) : [];
  if (!exs.length) {
    openModal(window.DAYS[window.DKEYS.indexOf(dk)] + ' — ' + fmtDate(dStr), '<div class="empty">Riposo 💤</div>');
    return;
  }
  const log = await DB.getSessionByDate(window.CU.id, dStr);
  openModal(`${window.DAYS[window.DKEYS.indexOf(dk)]} — ${fmtDate(dStr)}`,
    await buildAssignedDayContent(dStr, dk, exs, log, asgn), '750px');
}

// ══════════════════════════════════════════════════════════════
// USER — HISTORY
// ══════════════════════════════════════════════════════════════
async function renderHistory() {
  const sessions = await DB.getSessions(window.CU.id, 200);
  const done   = sessions.reduce((s, l) => s + (l.session_exercises||[]).filter(e => e.done).length, 0);
  const total  = sessions.reduce((s, l) => s + (l.session_exercises||[]).length, 0);
  set(`<div class="page-title">Storico Allenamenti</div>
  <div class="grid-4">
    <div class="stat-box"><div class="stat-label">Sessioni</div><div class="stat-val">${sessions.length}</div></div>
    <div class="stat-box"><div class="stat-label">Esercizi Fatti</div><div class="stat-val">${done}</div></div>
    <div class="stat-box"><div class="stat-label">Completamento</div><div class="stat-val" style="font-size:1.8rem">${total?Math.round(done/total*100):0}%</div></div>
    <div class="stat-box"><div class="stat-label">Ultima Sessione</div><div class="stat-val" style="font-size:.9rem;padding-top:.8rem">${sessions[0]?fmtDate(sessions[0].session_date):'—'}</div></div>
  </div>
  <div class="flex-gap" style="margin-bottom:1rem">
    <span class="tag">${sessions.filter(s=>!s.is_free).length} da scheda</span>
    <span class="tag blue">${sessions.filter(s=>s.is_free).length} libere</span>
  </div>
  ${sessions.length ? sessions.map(s => {
    const exs  = s.session_exercises || [];
    const d    = exs.filter(e => e.done).length;
    const vol  = exs.reduce((sum, e) => sum + (e.done?(e.serie||0)*(e.reps||0)*(e.weight||0):0), 0);
    return `<div class="card" style="cursor:pointer" onclick="openHistLog('${s.id}')">
      <div class="flex-between">
        <div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:2px">${fmtDate(s.session_date)}</div>
          <div style="font-size:.7rem;color:var(--muted)">${s.is_free?'🆓':'📋'} ${esc(s.template_name||'')} · ${exs.length} esercizi${s.duration_min?` · ${s.duration_min}min`:''}</div>
        </div>
        <div class="flex-gap">
          <div style="width:60px;height:4px;background:var(--border2)"><div style="height:100%;background:var(--accent);width:${exs.length?Math.round(d/exs.length*100):0}%"></div></div>
          <span class="tag ${d===exs.length&&d?'accent':''}">${d}/${exs.length}</span>
          ${vol?`<span class="tag blue" style="font-size:.55rem">⚖️ ${vol.toLocaleString('it-IT')}kg</span>`:''}
        </div>
      </div>
    </div>`;
  }).join('') : '<div class="empty">Nessun allenamento registrato</div>'}`);
}

// ══════════════════════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════════════════════
async function renderProfile() {
  const u   = window.CU;
  const imc = u.altezza && u.peso ? (u.peso / ((u.altezza / 100) ** 2)).toFixed(1) : '—';
  const imcLabel = imc === '—' ? '' : parseFloat(imc) < 18.5 ? 'Sottopeso' : parseFloat(imc) < 25 ? 'Normopeso' : parseFloat(imc) < 30 ? 'Sovrappeso' : 'Obesità';
  set(`<div class="page-title">Il Mio Profilo</div>
  <div class="card">
    <div class="card-title">Foto Profilo</div>
    <div style="display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap">
      <div class="photo-wrap">
        <div class="photo-avatar" id="photoAvatar">${u.photo_url?`<img src="${u.photo_url}" alt="">`:u.nome[0]+u.cognome[0]}</div>
        <div class="photo-edit-btn" onclick="document.getElementById('photoInput').click()">✏</div>
        <input type="file" id="photoInput" class="photo-input" accept="image/*" onchange="uploadProfilePhoto(this)">
      </div>
      <div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.6rem;letter-spacing:3px">${esc(u.nome)} ${esc(u.cognome)}</div>
        <div style="margin:.3rem 0">${document.getElementById('headerBadge').innerHTML}</div>
        <div style="font-size:.7rem;color:var(--muted)">${esc(u.email)}</div>
        ${u.photo_url ? `<button class="btn-danger btn-sm" style="margin-top:.5rem" onclick="removePhoto()">Rimuovi foto</button>` : ''}
      </div>
    </div>
  </div>
  ${u.ruolo !== 'gym' ? `<div class="grid-4" style="margin-bottom:1.5rem">
    <div class="stat-box"><div class="stat-label">Altezza</div><div class="stat-val">${u.altezza||'—'}</div><div class="stat-unit">cm</div></div>
    <div class="stat-box"><div class="stat-label">Peso</div><div class="stat-val">${u.peso||'—'}</div><div class="stat-unit">kg</div></div>
    <div class="stat-box"><div class="stat-label">Grasso</div><div class="stat-val">${u.grasso||'—'}</div><div class="stat-unit">%</div></div>
    <div class="stat-box"><div class="stat-label">IMC</div><div class="stat-val" style="font-size:1.6rem">${imc}</div><div class="stat-unit">${imcLabel}</div></div>
  </div>` : ''}
  <div class="card"><div class="card-title">Modifica Dati</div>
    <div class="fr2">
      <div class="fg"><label>Nome</label><input class="inp" id="p_n" value="${esc(u.nome)}"></div>
      <div class="fg"><label>Cognome</label><input class="inp" id="p_c" value="${esc(u.cognome)}"></div>
    </div>
    <div class="fg"><label>Telefono</label><input class="inp" type="tel" id="p_t" value="${esc(u.telefono||'')}"></div>
    ${u.ruolo !== 'gym' ? `<div class="fr3">
      <div class="fg"><label>Altezza (cm)</label><input class="inp" type="number" id="p_a" value="${u.altezza||''}"></div>
      <div class="fg"><label>Peso (kg)</label><input class="inp" type="number" step=".5" id="p_p" value="${u.peso||''}"></div>
      <div class="fg"><label>Grasso %</label><input class="inp" type="number" step=".1" id="p_g" value="${u.grasso||''}"></div>
    </div>` : ''}
    <button class="btn-primary" style="margin-top:.5rem;max-width:200px" onclick="saveProfile()">Salva Dati</button>
  </div>
  <div class="card"><div class="card-title">Cambia Password</div>
    <div class="fg"><label>Password Attuale</label><input class="inp" type="password" id="p_old"></div>
    <div class="fr2">
      <div class="fg"><label>Nuova Password</label><input class="inp" type="password" id="p_new1" placeholder="Min 6 caratteri"></div>
      <div class="fg"><label>Conferma</label><input class="inp" type="password" id="p_new2"></div>
    </div>
    <div style="display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap">
      <button class="btn-primary" style="max-width:200px" onclick="changeProfilePwd()">Cambia Password</button>
      <span style="font-size:.65rem;color:var(--muted);cursor:pointer" onclick="showForgotPassword()">🔑 Recupero via email</span>
    </div>
  </div>`);
}

async function saveProfile() {
  const upd = { nome: v('p_n').trim(), cognome: v('p_c').trim(), telefono: v('p_t').trim(), altezza: parseFloat(v('p_a'))||0, peso: parseFloat(v('p_p'))||0, grasso: parseFloat(v('p_g'))||0 };
  const updated = await DB.updateUser(window.CU.id, upd);
  window.CU = { ...window.CU, ...upd };
  document.getElementById('headerName').textContent = window.CU.nome + ' ' + window.CU.cognome;
  toast('Profilo aggiornato', 'success'); renderProfile();
}

async function changeProfilePwd() {
  const old = v('p_old'), p1 = v('p_new1'), p2 = v('p_new2');
  if (!old) { toast('Inserisci password attuale', 'error'); return; }
  if (window.CU.pwd_hash && hashPwd(old) !== window.CU.pwd_hash) { toast('Password attuale errata', 'error'); return; }
  if (!p1 || p1.length < 6) { toast('Nuova password min 6 caratteri', 'error'); return; }
  if (p1 !== p2) { toast('Le password non coincidono', 'error'); return; }
  await DB.updateUser(window.CU.id, { pwd_hash: hashPwd(p1) });
  window.CU.pwd_hash = hashPwd(p1);
  ['p_old','p_new1','p_new2'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  toast('Password cambiata', 'success');
}

// Export
window.renderHome = renderHome; window.renderAdminHome = renderAdminHome;
window.renderGymHome = renderGymHome; window.renderPTHome = renderPTHome; window.renderUserHome = renderUserHome;
window.renderUsers = renderUsers; window.renderUserTable = renderUserTable;
window.editUserModal = editUserModal; window.saveUserEdit = saveUserEdit; window.delUser = delUser;
window.addUserModal = addUserModal; window.createUser = createUser;
window.renderPTs = renderPTs;
window.renderExercises = renderExercises; window.filterExercises = filterExercises;
window.addExerciseModal = addExerciseModal; window.saveNewExercise = saveNewExercise;
window.editExerciseModal = editExerciseModal; window.saveExEdit = saveExEdit; window.delExercise = delExercise;
window.previewImg = previewImg; window.uploadImg = uploadImg;
window.renderGym = renderGym; window.saveGym = saveGym;
window.renderRooms = renderRooms; window.addRoomModal = addRoomModal; window.editRoomModal = editRoomModal;
window.saveRoom = saveRoom; window.delRoom = delRoom; window.goRoomCal = goRoomCal;
window.renderRoomCal = renderRoomCal; window.loadRoomCal = loadRoomCal;
window.addRoomEventModal = addRoomEventModal; window.saveRoomEvt = saveRoomEvt; window.delRoomEvt = delRoomEvt;
window.renderClients = renderClients;
window.renderTemplates = renderTemplates; window.newTemplate = newTemplate; window.editTemplate = editTemplate;
window.buildExRow = buildExRow; window.addExRow = addExRow; window.onExSelect = onExSelect;
window.saveTpl = saveTpl; window.delTemplate = delTemplate;
window.renderAssign = renderAssign; window.doAssign = doAssign; window.delAsgn = delAsgn;
window.renderFeedback = renderFeedback; window.loadFeedback = loadFeedback;
window.replyModal = replyModal; window.saveReply = saveReply;
window.renderCalendar = renderCalendar; window.calNav = calNav; window.openDayModal = openDayModal;
window.renderHistory = renderHistory;
window.renderProfile = renderProfile; window.saveProfile = saveProfile; window.changeProfilePwd = changeProfilePwd;
