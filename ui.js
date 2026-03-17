// ══════════════════════════════════════════════════════════════
// js/ui.js — Router, Nav, Modal, Toast, Shared UI helpers
// ══════════════════════════════════════════════════════════════

// ── UTILS ─────────────────────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0]; }
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('it-IT', { weekday:'short', day:'numeric', month:'short' });
}
function v(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function set(html) { const c = document.getElementById('appContent'); if (c) c.innerHTML = html; }

function userAvatar(u, size = 32) {
  const s = `width:${size}px;height:${size}px;border-radius:50%;border:1px solid var(--border);background:var(--bg3);display:inline-flex;align-items:center;justify-content:center;font-size:${size*.35}px;overflow:hidden;flex-shrink:0`;
  if (u.photo_url) return `<div style="${s}"><img src="${u.photo_url}" style="width:100%;height:100%;object-fit:cover"></div>`;
  return `<div style="${s}">${(u.nome[0] || '?').toUpperCase()}</div>`;
}

// ── ROUTER ────────────────────────────────────────────────────
const PAGE_MAP = {
  home:           () => window.renderHome(),
  users:          () => window.renderUsers(),
  pts:            () => window.renderPTs(),
  exercises:      () => window.renderExercises(),
  gym:            () => window.renderGym(),
  rooms:          () => window.renderRooms(),
  room_cal:       () => window.renderRoomCal(),
  clients:        () => window.renderClients(),
  templates:      () => window.renderTemplates(),
  assign:         () => window.renderAssign(),
  feedback:       () => window.renderFeedback(),
  free_workout:   () => window.renderFreeWorkout(),
  today:          () => window.renderToday(),
  calendar:       () => window.renderCalendar(),
  stats:          () => window.renderStats(),
  history:        () => window.renderHistory(),
  session_detail: () => window.renderSessionDetail(),
  profile:        () => window.renderProfile(),
};

function router(p) {
  setNav(p);
  const c = document.getElementById('appContent');
  c.innerHTML = '<div class="loading">⏳ Caricamento...</div>';
  c.className = 'section-anim';
  const fn = PAGE_MAP[p] || PAGE_MAP['home'];
  Promise.resolve(fn()).catch(err => {
    console.error(err);
    c.innerHTML = `<div class="warn-box">Errore nel caricamento della pagina.</div>`;
  });
}

// ── NAV ───────────────────────────────────────────────────────
function buildNav() {
  const navs = window.NAVS[window.CU.ruolo] || [];
  document.getElementById('appNav').innerHTML = navs.map(n =>
    `<button class="nav-btn" data-page="${n.id}" onclick="router('${n.id}')">${n.l}</button>`
  ).join('');
}

function setNav(p) {
  document.querySelectorAll('#appNav .nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.page === p)
  );
}

// ── MODAL ─────────────────────────────────────────────────────
function openModal(title, content, mw = '700px') {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = content;
  document.getElementById('modalBox').style.maxWidth = mw;
  document.getElementById('modalBg').style.display = 'block';
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('modalBg').style.display = 'none';
  document.body.style.overflow = '';
}

// ── TOAST ─────────────────────────────────────────────────────
let _toastTimer;
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── QR SHARE ─────────────────────────────────────────────────
async function shareQR(type, id) {
  let obj, name;
  if (type === 'template') {
    const tpls = await DB.getTemplates(window.CU.id);
    const t = tpls.find(x => x.id === id); if (!t) return;
    obj = { type: 'gymtrack_template', v: 1, data: { nome: t.nome, desc: t.description, schedule: t.schedule } };
    name = t.nome;
  } else {
    const asgns = await DB.getAssignments({ ptId: window.CU.id });
    const a = asgns.find(x => x.id === id); if (!a) return;
    obj = { type: 'gymtrack_assignment', v: 1, data: { tplName: a.template_name, schedule: a.schedule } };
    name = a.template_name;
  }
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  const url = location.href.split('?')[0] + '?import=' + b64;
  openModal('📱 Condividi via QR', `<div class="qr-wrap">
    <div id="qrCanvas"></div>
    <div style="font-size:.7rem;color:var(--muted);text-align:center">Scannerizza per importare<br><strong style="color:var(--text)">${esc(name)}</strong></div>
    <button class="btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${esc(url)}').then(()=>toast('Link copiato!','success'))">📋 Copia Link</button>
  </div>`);
  setTimeout(() => {
    const el = document.getElementById('qrCanvas');
    if (!el || !window.QRCode) return;
    try { new QRCode(el, { text: url, width: 220, height: 220, colorDark:'#000', colorLight:'#fff' }); }
    catch(e) { el.innerHTML = '<div class="warn-box">QR non disponibile. Usa il link.</div>'; }
  }, 100);
}

function checkImport() {
  const imp = new URLSearchParams(location.search).get('import');
  if (!imp) return;
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(imp))));
    const obj = data.data; const name = obj.nome || obj.tplName || 'Scheda';
    openModal('Importa Scheda', `
    <div class="success-box">📥 Scheda trovata: <strong>${esc(name)}</strong></div>
    <div class="fg"><label>Nome scheda</label><input class="inp" id="imp_n" value="${esc(name)}"></div>
    <button class="btn-primary btn-full" onclick="doImport('${imp}')">Importa</button>`);
  } catch(e) {}
  history.replaceState({}, '', location.pathname);
}

async function doImport(b64) {
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(b64))));
    const obj = data.data;
    const nome = v('imp_n') || obj.nome || 'Importata';
    await DB.createTemplate({ pt_id: window.CU.id, nome, description: obj.desc || '', schedule: obj.schedule });
    closeModal(); toast('Scheda importata!', 'success');
    if (window.CU.ruolo === 'pt') renderTemplates();
  } catch(e) { toast('Errore importazione', 'error'); }
}

// ── HISTORY LOG VIEWER ────────────────────────────────────────
async function openHistLog(sessionId) {
  const sessions = await DB.getSessions(window.CU.id, 365);
  const s = sessions.find(x => x.id === sessionId);
  if (!s) return;
  const exs = s.session_exercises || [];
  const vol = exs.reduce((sum, e) => sum + (e.done ? (e.serie||0)*(e.reps||0)*(e.weight||0) : 0), 0);
  openModal(`Log — ${fmtDate(s.session_date)}`, `
  <div class="flex-gap" style="margin-bottom:1rem">
    <span class="tag ${s.is_free?'blue':'accent'}">${s.is_free?'🆓 Libero':'📋 Scheda'}</span>
    ${s.duration_min ? `<span class="tag">⏱ ${s.duration_min} min</span>` : ''}
    ${vol ? `<span class="tag">⚖️ ${vol.toLocaleString('it-IT')} kg totali</span>` : ''}
  </div>
  ${s.session_note ? `<div style="border-left:3px solid var(--accent);padding:.6rem 1rem;font-size:.78rem;color:var(--muted);font-style:italic;margin-bottom:1rem">📝 ${esc(s.session_note)}</div>` : ''}
  ${exs.map(e => `<div style="padding:.7rem 0;border-bottom:1px solid var(--border2)">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div><span style="color:${e.done?'var(--accent)':'var(--muted)'}">${e.done?'✓':'○'}</span>
        <strong style="font-size:.85rem;margin-left:.4rem">${esc(e.exercise_name)}</strong>
        <span style="font-size:.7rem;color:var(--muted);margin-left:.8rem">${e.serie}×${e.reps} @${e.weight}kg</span>
      </div>
      ${e.done ? `<span style="font-size:.68rem;color:var(--accent)">${((e.serie||0)*(e.reps||0)*(e.weight||0)).toLocaleString('it-IT')} kg</span>` : ''}
    </div>
    ${e.comment ? `<div style="margin-top:.3rem;font-size:.73rem;color:var(--blue)">💬 ${esc(e.comment)}</div>` : ''}
    ${e.pt_reply ? `<div style="font-size:.72rem;color:var(--accent)">↩ ${esc(e.pt_reply)}</div>` : ''}
  </div>`).join('')}
  <div style="margin-top:1.2rem">
    <button class="btn-danger btn-sm" onclick="deleteSession('${sessionId}')">🗑 Elimina Sessione</button>
  </div>`);
}

async function deleteSession(sessionId) {
  if (!confirm('Eliminare questa sessione?')) return;
  await DB.deleteSession(sessionId);
  closeModal(); toast('Sessione eliminata', 'success');
  router('history');
}

// ── EXPORT GLOBAL ─────────────────────────────────────────────
window.today       = today;
window.esc         = esc;
window.fmtDate     = fmtDate;
window.v           = v;
window.set         = set;
window.userAvatar  = userAvatar;
window.router      = router;
window.buildNav    = buildNav;
window.setNav      = setNav;
window.openModal   = openModal;
window.closeModal  = closeModal;
window.toast       = toast;
window.shareQR     = shareQR;
window.checkImport = checkImport;
window.doImport    = doImport;
window.openHistLog = openHistLog;
window.deleteSession = deleteSession;
