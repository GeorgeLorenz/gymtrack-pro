// ══════════════════════════════════════════════════════════════
// workout.js — Modulo Allenamento Libero (self-contained)
// ══════════════════════════════════════════════════════════════

let FW = { active: false, exercises: [], startTime: null, date: null };
let _exDB = [];
let _fwMuscle = '';
let _timerIV = null;
let _fwTab = 'library'; // 'library' | 'session' — solo mobile

// ══════════════════════════════════════════════════════════════
// ENTRY POINT
// ══════════════════════════════════════════════════════════════
async function renderFreeWorkout() {
  set('<div class="loading">Caricamento esercizi...</div>');

  // Carica esercizi con timeout di sicurezza (3s)
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 3000));
    _exDB = await Promise.race([DB.getExercises(), timeout]);
    if (!_exDB) _exDB = [];
  } catch(e) {
    console.warn('getExercises lento/fallito, uso localStorage:', e.message);
    // Fallback diretto su localStorage
    _exDB = window.lsGet ? lsGet('exercises') : [];
    if (!_exDB || !_exDB.length) {
      // Seed locale di emergenza
      _exDB = window.DEFAULT_EXERCISES.map(e => ({
        ...e, id: (Math.random()).toString(36).slice(2),
        created_at: new Date().toISOString()
      }));
      if (window.lsSet) lsSet('exercises', _exDB);
    }
  }

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const dateLabel = today.toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  set(`
  <!-- HEADER -->
  <div style="display:flex;align-items:center;justify-content:space-between;
    flex-wrap:wrap;gap:0.8rem;margin-bottom:1rem">
    <div class="page-title" style="margin-bottom:0">Allenamento Libero</div>
    ${FW.active ? `<div id="fw_timer" style="font-family:'Bebas Neue',sans-serif;
      font-size:2rem;color:var(--accent)">00:00</div>` : ''}
  </div>

  <!-- DATA -->
  <div style="background:var(--bg2);border:1px solid var(--border);
    border-left:3px solid var(--accent);padding:1rem 1.2rem;margin-bottom:1rem;
    display:flex;align-items:center;gap:1rem">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:3.5rem;
      color:var(--accent);line-height:1;flex-shrink:0">${today.getDate()}</div>
    <div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:1rem;
        font-weight:700;letter-spacing:2px;text-transform:uppercase">${dateLabel}</div>
      <div style="font-size:0.65rem;color:var(--muted);margin-top:0.2rem">
        <span id="fw_excount">${_exDB.length} esercizi disponibili</span>
      </div>
    </div>
  </div>

  ${!FW.active ? `
  <button class="btn-primary btn-full" style="font-size:1rem;padding:1rem"
    onclick="fwStart()">▶ Inizia Allenamento</button>
  ` : `
  <!-- ACTIVE SESSION -->
  <div style="background:var(--bg2);border:1px solid var(--border);
    border-left:3px solid var(--accent);padding:0.8rem 1.2rem;
    margin-bottom:1rem;display:flex;align-items:center;
    justify-content:space-between;flex-wrap:wrap;gap:0.6rem">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;
      font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent)">
      ● Sessione attiva — ${FW.exercises.length} esercizi
    </div>
    <button class="btn-primary btn-sm" onclick="fwSave()">💾 Salva Sessione</button>
  </div>

  <!-- MOBILE TABS -->
  <div id="fw_tabs" style="display:none;margin-bottom:0.8rem">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;
      background:var(--border);border:1px solid var(--border)">
      <button onclick="fwSetTab('library')" id="fw_tab_lib"
        style="background:${_fwTab==='library'?'var(--accent)':'var(--bg3)'};
        color:${_fwTab==='library'?'#000':'var(--muted)'};
        border:none;padding:0.7rem;font-family:'Barlow Condensed',sans-serif;
        font-size:0.8rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;
        cursor:pointer">
        📚 Esercizi
      </button>
      <button onclick="fwSetTab('session')" id="fw_tab_sess"
        style="background:${_fwTab==='session'?'var(--accent)':'var(--bg3)'};
        color:${_fwTab==='session'?'#000':'var(--muted)'};
        border:none;padding:0.7rem;font-family:'Barlow Condensed',sans-serif;
        font-size:0.8rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;
        cursor:pointer">
        🏋️ Sessione (${FW.exercises.length})
      </button>
    </div>
  </div>

  <!-- DESKTOP: 2 colonne | MOBILE: tab -->
  <div id="fw_body" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">

    <!-- COLONNA LIBRERIA -->
    <div id="fw_col_library">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;
        font-weight:700;letter-spacing:3px;text-transform:uppercase;
        color:var(--muted);margin-bottom:0.7rem">📚 Libreria Esercizi</div>

      <!-- Cerca -->
      <input class="inp" id="fw_search" placeholder="🔍 Cerca esercizio..."
        oninput="fwFilter()" style="margin-bottom:0.6rem">

      <!-- Filtri -->
      <div style="display:flex;gap:0.3rem;flex-wrap:wrap;margin-bottom:0.7rem"
        id="fw_chips">${renderFWChips()}</div>

      <!-- Lista -->
      <div id="fw_exlist"
        style="max-height:55vh;overflow-y:auto;-webkit-overflow-scrolling:touch;
        border:1px solid var(--border)">
        ${renderFWExList()}
      </div>

      <!-- Crea nuovo -->
      <button class="btn-secondary btn-full" style="margin-top:0.6rem"
        onclick="fwToggleNewForm()">➕ Crea nuovo esercizio</button>
      <div id="fw_newform"></div>
    </div>

    <!-- COLONNA SESSIONE -->
    <div id="fw_col_session">
      <div style="display:flex;align-items:center;justify-content:space-between;
        margin-bottom:0.7rem">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;
          font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">
          🏋️ Sessione (<span id="fw_count">${FW.exercises.length}</span>)
        </div>
        <button class="btn-primary btn-sm" onclick="fwSave()">💾 Salva</button>
      </div>
      <div id="fw_session">${renderFWSession()}</div>
      ${FW.exercises.length ? `<button class="btn-primary btn-full"
        style="margin-top:0.5rem" onclick="fwSave()">💾 Salva Sessione</button>` : ''}
    </div>

  </div><!-- /fw_body -->
  `}
  `);

  // Inizializza layout DOPO che il DOM è stato scritto (no script inline)
  setTimeout(() => {
    const isMobile = window.innerWidth <= 700;
    const tabs = document.getElementById('fw_tabs');
    const body = document.getElementById('fw_body');
    if (tabs && body && isMobile) {
      tabs.style.display = 'block';
      body.style.gridTemplateColumns = '1fr';
      fwApplyTab();
    }
  }, 0);

  if (FW.active) startFWTimer();
}

// ══════════════════════════════════════════════════════════════
// RENDER HELPERS
// ══════════════════════════════════════════════════════════════
function renderFWChips() {
  const all = [{ l:'Tutti', v:'' }, ...window.MUSCLES.map(m=>({ l:m, v:m }))];
  return all.map(c => `<span onclick="fwSetMuscle('${c.v}')" style="
    display:inline-flex;align-items:center;
    font-family:'Barlow Condensed',sans-serif;font-size:0.62rem;
    font-weight:700;letter-spacing:1px;text-transform:uppercase;
    padding:0.3rem 0.65rem;cursor:pointer;margin-bottom:0.2rem;
    border:1px solid ${_fwMuscle===c.v?'var(--accent)':'var(--border)'};
    color:${_fwMuscle===c.v?'var(--accent)':'var(--muted)'};
    background:${_fwMuscle===c.v?'rgba(200,241,53,0.08)':'transparent'};
    transition:all 0.15s">${c.l}</span>`).join('');
}

function renderFWExList() {
  if (!_exDB || !_exDB.length) {
    return `<div style="padding:1.5rem;text-align:center">
      <div style="color:var(--muted);font-size:0.72rem;letter-spacing:2px;
        text-transform:uppercase;margin-bottom:1rem">
        Nessun esercizio caricato
      </div>
      <button class="btn-secondary btn-full" onclick="fwReloadExercises()">
        🔄 Carica Esercizi
      </button>
    </div>`;
  }

  const q = (document.getElementById('fw_search')?.value||'').toLowerCase().trim();
  const filtered = _exDB.filter(e =>
    (!q || (e.name||'').toLowerCase().includes(q) || (e.muscle_group||'').toLowerCase().includes(q)) &&
    (!_fwMuscle || e.muscle_group === _fwMuscle)
  );

  if (!filtered.length) {
    return `<div style="padding:2rem;text-align:center;color:var(--muted);
      font-size:0.72rem;letter-spacing:2px;text-transform:uppercase">
      Nessun esercizio trovato
    </div>`;
  }

  return filtered.map(e => {
    const added = FW.exercises.some(x => x.exId === e.id);
    // Sanitize for onclick attr
    const safeName = (e.name||'').replace(/'/g,'&apos;').replace(/"/g,'&quot;');
    const safeMuscle = (e.muscle_group||'').replace(/'/g,'&apos;');
    const safeEmoji = (e.emoji||'🏋️').replace(/'/g,'&apos;');
    return `<div onclick="fwAddEx('${e.id}','${safeName}','${safeMuscle}','${safeEmoji}')"
      style="display:flex;align-items:center;gap:0.7rem;padding:0.7rem 0.9rem;
      border-bottom:1px solid var(--border);cursor:pointer;min-height:54px;
      background:${added?'rgba(200,241,53,0.05)':'transparent'};
      transition:background 0.15s"
      onmouseover="this.style.background='var(--bg3)'"
      onmouseout="this.style.background='${added?'rgba(200,241,53,0.05)':'transparent'}'">
      <div style="width:36px;height:36px;flex-shrink:0;background:var(--bg3);
        border-radius:4px;display:flex;align-items:center;justify-content:center;
        font-size:1.2rem;overflow:hidden">
        ${e.image_url
          ? `<img src="${e.image_url}" style="width:100%;height:100%;object-fit:cover"
              onerror="this.outerHTML='${e.emoji||'🏋️'}'">` 
          : (e.emoji||'🏋️')}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.88rem;
          font-weight:700;letter-spacing:1px;text-transform:uppercase;
          color:${added?'var(--accent)':'var(--text)'};
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${added?'✓ ':''}${e.name||''}
        </div>
        <div style="font-size:0.58rem;letter-spacing:1.5px;text-transform:uppercase;
          color:var(--muted)">${e.muscle_group||''}${e.video_url?' · ▶':''}</div>
      </div>
      <div style="font-size:1.3rem;color:${added?'var(--accent)':'var(--muted)'}">
        ${added?'✓':'+'}
      </div>
    </div>`;
  }).join('');
}

function renderFWSession() {
  if (!FW.exercises.length) {
    return `<div style="padding:2rem 1rem;text-align:center;color:var(--muted);
      font-size:0.72rem;letter-spacing:2px;text-transform:uppercase;
      border:1px dashed var(--border)">
      ← Scegli dalla libreria
    </div>`;
  }

  return FW.exercises.map((e, idx) => `
  <div style="background:var(--bg2);border:1px solid var(--border);
    border-left:3px solid ${e.done?'var(--accent)':'var(--border2)'};
    padding:0.9rem;margin-bottom:0.6rem" id="fwcard_${e.id}">

    <!-- Nome + rimuovi -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;
      gap:0.5rem;margin-bottom:0.7rem">
      <div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.9rem;
          font-weight:700;letter-spacing:1.5px;text-transform:uppercase">${e.name}</div>
        <div style="font-size:0.6rem;color:var(--muted);letter-spacing:1px;
          text-transform:uppercase;margin-top:0.1rem">${e.muscleGroup}</div>
      </div>
      <div style="display:flex;gap:0.4rem;align-items:center;flex-shrink:0">
        <!-- Check done -->
        <div onclick="fwToggleDone('${e.id}')"
          style="width:30px;height:30px;border:2px solid var(--border2);
          display:flex;align-items:center;justify-content:center;cursor:pointer;
          background:${e.done?'var(--accent)':'transparent'};
          border-color:${e.done?'var(--accent)':'var(--border2)'};
          transition:all 0.2s;flex-shrink:0" id="fwcb_${e.id}">
          ${e.done?'<span style="color:#000;font-weight:bold;font-size:1rem">✓</span>':''}
        </div>
        <button onclick="fwRemove('${e.id}')"
          style="background:transparent;border:1px solid rgba(255,61,61,0.35);
          color:var(--red);padding:0.3rem 0.6rem;cursor:pointer;font-size:0.85rem;
          min-width:32px;min-height:32px">✕</button>
      </div>
    </div>

    <!-- Selettori Serie / Reps / Peso -->
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:flex-end">
      <div style="display:flex;flex-direction:column;gap:0.2rem">
        <span style="font-size:0.5rem;letter-spacing:2px;text-transform:uppercase;
          color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-weight:700">Serie</span>
        <select class="dd" style="width:58px;padding:0.45rem 0.35rem"
          onchange="fwUpdate('${e.id}','serie',this.value)">
          ${window.SERIE_OPTS.map(s=>`<option ${e.serie==s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.2rem">
        <span style="font-size:0.5rem;letter-spacing:2px;text-transform:uppercase;
          color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-weight:700">Reps</span>
        <select class="dd" style="width:62px;padding:0.45rem 0.35rem"
          onchange="fwUpdate('${e.id}','reps',this.value)">
          ${window.REPS_OPTS.map(r=>`<option ${e.reps==r?'selected':''}>${r}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.2rem">
        <span style="font-size:0.5rem;letter-spacing:2px;text-transform:uppercase;
          color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-weight:700">Peso kg</span>
        <select class="dd" style="width:72px;padding:0.45rem 0.35rem"
          onchange="fwUpdate('${e.id}','weight',this.value)">
          ${window.WEIGHT_OPTS.map(w=>`<option value="${w}" ${e.weight==w?'selected':''}>${w}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- Note -->
    <input class="inp" placeholder="Note..." value="${esc(e.comment)}"
      onchange="fwUpdate('${e.id}','comment',this.value)"
      style="font-size:0.78rem;margin-top:0.6rem">
  </div>`).join('');
}

// ══════════════════════════════════════════════════════════════
// AZIONI
// ══════════════════════════════════════════════════════════════
function fwStart() {
  FW = { active: true, exercises: [], startTime: Date.now(),
    date: new Date().toISOString().split('T')[0] };
  _fwTab = 'library';
  renderFreeWorkout();
}

async function fwReloadExercises() {
  const list = document.getElementById('fw_exlist');
  if (list) list.innerHTML = `<div style="padding:1.5rem;text-align:center;
    color:var(--muted);font-size:0.72rem;letter-spacing:2px;text-transform:uppercase">
    Caricamento...</div>`;
  try {
    await seedDefaultData();
    _exDB = await DB.getExercises();
    if (list) list.innerHTML = renderFWExList();
    // Aggiorna counter
    const counter = document.getElementById('fw_excount');
    if (counter) counter.textContent = `${_exDB.length} esercizi disponibili`;
    toast(`${_exDB.length} esercizi caricati!`, 'success');
  } catch(e) {
    toast('Errore nel caricamento', 'error');
    console.error(e);
  }
}

function fwSetMuscle(m) {
  _fwMuscle = m;
  const chips = document.getElementById('fw_chips');
  if (chips) chips.innerHTML = renderFWChips();
  const list = document.getElementById('fw_exlist');
  if (list) list.innerHTML = renderFWExList();
}

function fwFilter() {
  const list = document.getElementById('fw_exlist');
  if (list) list.innerHTML = renderFWExList();
}

function fwAddEx(exId, name, muscleGroup, emoji) {
  const idx = FW.exercises.findIndex(e => e.exId === exId);
  if (idx >= 0) {
    FW.exercises.splice(idx, 1);
    toast(`${name} rimosso`, 'info');
  } else {
    FW.exercises.push({
      id: uid(), exId, name, muscleGroup, emoji,
      serie: 3, reps: 10, weight: 0, done: false, comment: ''
    });
    toast(`${name} aggiunto ✓`, 'success');
    // Su mobile passa automaticamente alla tab sessione
    if (window.innerWidth <= 700) fwSetTab('session');
  }
  _refreshFWSession();
  const list = document.getElementById('fw_exlist');
  if (list) list.innerHTML = renderFWExList();
}

function _refreshFWSession() {
  const sess = document.getElementById('fw_session');
  if (sess) sess.innerHTML = renderFWSession();
  const cnt = document.getElementById('fw_count');
  if (cnt) cnt.textContent = FW.exercises.length;
  // Aggiorna label tab mobile
  const tabSess = document.getElementById('fw_tab_sess');
  if (tabSess) tabSess.textContent = `🏋️ Sessione (${FW.exercises.length})`;
}

function fwUpdate(id, field, value) {
  const ex = FW.exercises.find(e => e.id === id);
  if (!ex) return;
  if (field==='serie'||field==='reps') ex[field] = parseInt(value);
  else if (field==='weight') ex[field] = parseFloat(value);
  else ex[field] = value;
}

function fwToggleDone(id) {
  const ex = FW.exercises.find(e => e.id === id);
  if (!ex) return;
  ex.done = !ex.done;
  const card = document.getElementById('fwcard_'+id);
  if (card) {
    card.style.borderLeftColor = ex.done ? 'var(--accent)' : 'var(--border2)';
    const cb = document.getElementById('fwcb_'+id);
    if (cb) {
      cb.style.background = ex.done ? 'var(--accent)' : 'transparent';
      cb.style.borderColor = ex.done ? 'var(--accent)' : 'var(--border2)';
      cb.innerHTML = ex.done ? '<span style="color:#000;font-weight:bold;font-size:1rem">✓</span>' : '';
    }
  }
}

function fwRemove(id) {
  FW.exercises = FW.exercises.filter(e => e.id !== id);
  _refreshFWSession();
  const list = document.getElementById('fw_exlist');
  if (list) list.innerHTML = renderFWExList();
}

// ══════════════════════════════════════════════════════════════
// MOBILE TABS
// ══════════════════════════════════════════════════════════════
function fwSetTab(tab) {
  _fwTab = tab;
  fwApplyTab();
  // Aggiorna stile bottoni
  const tl = document.getElementById('fw_tab_lib');
  const ts = document.getElementById('fw_tab_sess');
  if (tl) {
    tl.style.background = tab==='library' ? 'var(--accent)' : 'var(--bg3)';
    tl.style.color       = tab==='library' ? '#000' : 'var(--muted)';
  }
  if (ts) {
    ts.style.background = tab==='session' ? 'var(--accent)' : 'var(--bg3)';
    ts.style.color       = tab==='session' ? '#000' : 'var(--muted)';
  }
}

function fwApplyTab() {
  const lib  = document.getElementById('fw_col_library');
  const sess = document.getElementById('fw_col_session');
  if (!lib || !sess) return;
  if (window.innerWidth > 700) {
    lib.style.display = sess.style.display = 'block';
    return;
  }
  lib.style.display  = _fwTab === 'library' ? 'block' : 'none';
  sess.style.display = _fwTab === 'session' ? 'block' : 'none';
}

// Gestisci resize
window.addEventListener('resize', () => {
  const body = document.getElementById('fw_body');
  const tabs = document.getElementById('fw_tabs');
  if (!body) return;
  if (window.innerWidth > 700) {
    body.style.gridTemplateColumns = '1fr 1fr';
    if (tabs) tabs.style.display = 'none';
    fwApplyTab();
  } else {
    body.style.gridTemplateColumns = '1fr';
    if (tabs) tabs.style.display = 'block';
    fwApplyTab();
  }
});

// ══════════════════════════════════════════════════════════════
// TIMER
// ══════════════════════════════════════════════════════════════
function startFWTimer() {
  clearInterval(_timerIV);
  _timerIV = setInterval(() => {
    const el = document.getElementById('fw_timer');
    if (!el || !FW.startTime) return;
    const sec = Math.floor((Date.now() - FW.startTime) / 1000);
    el.textContent = `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
  }, 1000);
}

// ══════════════════════════════════════════════════════════════
// SALVA SESSIONE
// ══════════════════════════════════════════════════════════════
async function fwSave() {
  if (!FW.exercises.length) { toast('Aggiungi almeno un esercizio', 'error'); return; }
  const dur = FW.startTime ? Math.round((Date.now() - FW.startTime) / 60000) : 0;
  try {
    const session = await DB.createSession({
      user_id: window.CU.id, pt_id: null,
      session_date: FW.date, session_note: '',
      is_free: true, template_name: 'Allenamento Libero',
      duration_min: dur,
      total_volume: FW.exercises.reduce((s,e)=>s+(e.done?e.serie*e.reps*e.weight:0), 0)
    });
    for (let i = 0; i < FW.exercises.length; i++) {
      const e = FW.exercises[i];
      await DB.upsertSessionExercise({
        session_id: session.id, exercise_id: e.exId,
        exercise_name: e.name, muscle_group: e.muscleGroup,
        serie: e.serie, reps: e.reps, weight: e.weight,
        done: e.done, comment: e.comment, sort_order: i
      });
    }
    clearInterval(_timerIV);
    FW = { active: false, exercises: [], startTime: null, date: null };
    toast('Sessione salvata! 🎉', 'success');
    router('history');
  } catch(err) {
    toast('Errore nel salvataggio', 'error');
    console.error(err);
  }
}

// ══════════════════════════════════════════════════════════════
// CREA NUOVO ESERCIZIO
// ══════════════════════════════════════════════════════════════
function fwToggleNewForm() {
  const el = document.getElementById('fw_newform');
  if (!el) return;
  if (el.innerHTML.trim()) { el.innerHTML = ''; return; }
  el.innerHTML = `
  <div style="background:var(--bg3);border:1px solid var(--border);
    padding:1rem;margin-top:0.5rem">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;
      font-weight:700;letter-spacing:2px;text-transform:uppercase;
      color:var(--muted);margin-bottom:0.8rem">Nuovo Esercizio</div>
    <div class="fg"><label>Nome *</label>
      <input class="inp" id="fwne_name" placeholder="Es: Cable Fly"></div>
    <div class="fr2">
      <div class="fg"><label>Gruppo *</label>
        <select class="inp" id="fwne_muscle">
          ${window.MUSCLES.map(m=>`<option>${m}</option>`).join('')}
        </select>
      </div>
      <div class="fg"><label>Emoji</label>
        <input class="inp" id="fwne_emoji" value="🏋️" maxlength="4"></div>
    </div>
    <div class="fg"><label>Foto (URL o upload)</label>
      <div style="display:flex;gap:0.5rem">
        <input class="inp" id="fwne_img" placeholder="https://..." style="flex:1">
        <label class="btn-secondary btn-sm" style="cursor:pointer;
          display:inline-flex;align-items:center;padding:0.5rem 0.7rem">
          📷<input type="file" accept="image/*" style="display:none"
            onchange="fwUploadImg(this)">
        </label>
      </div>
    </div>
    <div class="fg"><label>Video YouTube</label>
      <input class="inp" id="fwne_video"
        placeholder="https://youtube.com/watch?v=..."></div>
    <div style="display:flex;gap:0.6rem;margin-top:0.3rem">
      <button class="btn-primary btn-sm" style="flex:1"
        onclick="fwSaveNewEx()">Salva e Aggiungi</button>
      <button class="btn-secondary btn-sm"
        onclick="document.getElementById('fw_newform').innerHTML=''">Annulla</button>
    </div>
  </div>`;
}

function fwUploadImg(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const el = document.getElementById('fwne_img');
    if (el) el.value = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function fwSaveNewEx() {
  const name = (document.getElementById('fwne_name')?.value||'').trim();
  if (!name) { toast('Inserisci un nome', 'error'); return; }
  const muscle  = document.getElementById('fwne_muscle')?.value || window.MUSCLES[0];
  const emoji   = document.getElementById('fwne_emoji')?.value  || '🏋️';
  const img     = document.getElementById('fwne_img')?.value    || '';
  const video   = document.getElementById('fwne_video')?.value  || '';
  try {
    const ex = await DB.createExercise({
      name, muscle_group: muscle, emoji,
      description: '', image_url: img, video_url: video,
      is_default: false, created_by: window.CU?.id || null
    });
    _exDB.push(ex);
    document.getElementById('fw_newform').innerHTML = '';
    fwAddEx(ex.id, ex.name, ex.muscle_group, ex.emoji);
    toast(`${name} creato e aggiunto! ✓`, 'success');
  } catch(err) {
    toast('Errore nella creazione', 'error');
    console.error(err);
  }
}

// ══════════════════════════════════════════════════════════════
// SCHEDA ASSEGNATA — TODAY
// ══════════════════════════════════════════════════════════════
async function renderToday() {
  const asgns = await DB.getAssignments({ userId: window.CU.id });
  const asgn  = asgns[0];
  const dk    = window.DKEYS[new Date().getDay()===0?6:new Date().getDay()-1];
  const exs   = asgn ? (asgn.schedule[dk]||[]) : [];
  const dateStr = new Date().toISOString().split('T')[0];
  const log   = await DB.getSessionByDate(window.CU.id, dateStr);
  const done  = log ? log.session_exercises.filter(e=>e.done).length : 0;
  const fmtToday = new Date().toLocaleDateString('it-IT',
    {weekday:'long',day:'numeric',month:'long'});

  set(`<div class="flex-between">
    <div class="page-title">Oggi <span class="page-sub">${fmtToday}</span></div>
    ${exs.length ? `<span class="tag ${done===exs.length&&done?'accent':''}">${done}/${exs.length}</span>` : ''}
  </div>
  ${!asgn
    ? `<div class="info-box">Nessuna scheda assegnata.<br>Prova l'<a href="#"
        onclick="router('free_workout')" style="color:var(--accent)">Allenamento Libero</a>!</div>`
    : !exs.length
    ? `<div class="empty" style="padding:4rem 1rem">🌟 Oggi è giorno di riposo!</div>`
    : await buildAssignedDayContent(dateStr, dk, exs, log, asgn)}`);
}

async function buildAssignedDayContent(dateStr, dk, exs, log, asgn) {
  const logExMap = {};
  if (log) log.session_exercises.forEach(e=>{ logExMap[e.exercise_id||e.exercise_name]=e; });
  const exercises = await DB.getExercises();
  let html = `<div class="fg" style="margin-bottom:1rem">
    <label>Note Sessione</label>
    <textarea class="inp" id="sessNote_${dateStr}" rows="2"
      placeholder="Come ti sei sentito oggi?">${esc(log?.session_note||'')}</textarea>
  </div>`;
  html += exs.map(e => {
    const key = e.exId||e.id;
    const le  = logExMap[key]||logExMap[e.name]||{done:false,comment:'',pt_reply:''};
    const exDef = exercises.find(x=>x.id===e.exId);
    const img = exDef?.image_url
      ? `<img src="${exDef.image_url}" style="width:100%;height:100%;object-fit:cover">`
      : (e.emoji||'🏋️');
    const videoBtn = exDef?.video_url
      ? `<a href="${exDef.video_url}" target="_blank"
          style="font-size:0.65rem;color:var(--blue);margin-left:0.5rem">▶ Video</a>` : '';
    return `<div class="ex-log-card ${le.done?'done':''} ${le.comment?'commented':''}"
      id="elc_${e.id}">
      <div class="ex-log-header">
        <div class="ex-log-info">
          <div class="ex-mini-thumb" style="width:44px;height:44px">${img}</div>
          <div style="flex:1;min-width:0">
            <div class="ex-log-name">${esc(e.name)}${videoBtn}</div>
            <div class="ex-log-meta">
              <span>${e.muscleGroup}</span>
              <span>${e.serie}×${e.reps}</span>
              <span>${e.weight}kg</span>
            </div>
            ${e.note?`<div class="pt-note-box">${esc(e.note)}</div>`:''}
          </div>
        </div>
        <div class="check-wrap"
          onclick="toggleAssignedDone('${e.id}','${e.exId||e.id}','${dateStr}','${dk}','${asgn.id}')">
          <div class="check-box ${le.done?'checked':''}" id="cb_${e.id}"></div>
        </div>
      </div>
      ${le.pt_reply?`<div class="pt-note-box">
        <div style="font-size:0.6rem;color:var(--accent);text-transform:uppercase;
          letter-spacing:2px;margin-bottom:0.2rem">PT</div>
        ${esc(le.pt_reply)}</div>`:''}
      <div class="fg" style="margin-top:0.6rem;margin-bottom:0">
        <label>Commento al PT</label>
        <div style="display:flex;gap:0.5rem">
          <textarea class="inp" id="cmt_${e.id}" rows="1"
            placeholder="Scrivi...">${esc(le.comment||'')}</textarea>
          <button class="btn-secondary btn-sm" style="align-self:flex-end;white-space:nowrap"
            onclick="saveExComment('${e.id}','${e.exId||e.id}','${e.name}','${dateStr}','${dk}','${asgn.id}')">
            Invia</button>
        </div>
      </div>
    </div>`;
  }).join('');
  html += `<button class="btn-primary btn-full" style="margin-top:0.5rem"
    onclick="saveAssignedSessionNote('${dateStr}','${dk}','${asgn.id}')">
    💾 Salva Note</button>`;
  return html;
}

async function toggleAssignedDone(rowId, exKey, dateStr, dk, asgnId) {
  const asgn = await DB.getAssignments({userId:window.CU.id}).then(a=>a.find(x=>x.id===asgnId));
  if (!asgn) return;
  const exs = asgn.schedule[dk]||[];
  let session = await DB.getSessionByDate(window.CU.id, dateStr);
  if (!session) {
    session = await DB.createSession({user_id:window.CU.id,pt_id:asgn.pt_id,
      session_date:dateStr,session_note:'',is_free:false,
      template_name:asgn.template_name,duration_min:0,total_volume:0});
    for (let i=0;i<exs.length;i++) {
      const e=exs[i];
      await DB.upsertSessionExercise({session_id:session.id,exercise_id:e.exId||null,
        exercise_name:e.name,muscle_group:e.muscleGroup,serie:e.serie,reps:e.reps,
        weight:e.weight,done:false,comment:'',pt_reply:'',sort_order:i});
    }
    session = await DB.getSessionByDate(window.CU.id, dateStr);
  }
  const le = session.session_exercises.find(e=>
    (e.exercise_id===exKey)||(e.exercise_name===exKey));
  if (!le) return;
  await DB.upsertSessionExercise({...le, done:!le.done});
  document.getElementById('elc_'+rowId)?.classList.toggle('done', !le.done);
  document.getElementById('cb_'+rowId)?.classList.toggle('checked', !le.done);
}

async function saveExComment(rowId, exKey, exName, dateStr, dk, asgnId) {
  const comment = document.getElementById('cmt_'+rowId)?.value?.trim()||'';
  const asgn = await DB.getAssignments({userId:window.CU.id}).then(a=>a.find(x=>x.id===asgnId));
  if (!asgn) return;
  let session = await DB.getSessionByDate(window.CU.id, dateStr);
  if (!session) session = await DB.createSession({user_id:window.CU.id,pt_id:asgn.pt_id,
    session_date:dateStr,session_note:'',is_free:false,
    template_name:asgn.template_name,duration_min:0,total_volume:0});
  const le = session.session_exercises?.find(e=>
    e.exercise_id===exKey||e.exercise_name===exName);
  if (le) await DB.upsertSessionExercise({...le,comment});
  else {
    const exData=(asgn.schedule[dk]||[]).find(e=>(e.exId||e.id)===exKey);
    if (exData) await DB.upsertSessionExercise({session_id:session.id,
      exercise_id:exData.exId||null,exercise_name:exData.name,
      muscle_group:exData.muscleGroup,serie:exData.serie,reps:exData.reps,
      weight:exData.weight,done:false,comment,pt_reply:'',sort_order:0});
  }
  document.getElementById('elc_'+rowId)?.classList.toggle('commented',!!comment);
  toast('Commento salvato','success');
}

async function saveAssignedSessionNote(dateStr, dk, asgnId) {
  const note = document.getElementById(`sessNote_${dateStr}`)?.value?.trim()||'';
  const asgn = await DB.getAssignments({userId:window.CU.id}).then(a=>a.find(x=>x.id===asgnId));
  if (!asgn) return;
  let session = await DB.getSessionByDate(window.CU.id, dateStr);
  if (!session) await DB.createSession({user_id:window.CU.id,pt_id:asgn.pt_id,
    session_date:dateStr,session_note:note,is_free:false,
    template_name:asgn.template_name,duration_min:0,total_volume:0});
  else await DB.updateSession(session.id,{session_note:note});
  toast('Note salvate','success');
}

// ── PICKER compatibilità (usato da altri moduli) ─────────────
function openExPicker(onSelect) { window._pickerOnSelect = onSelect; }
function closeExPicker() {}
function pickerSelect(exId,name,muscleGroup,emoji) {
  if(window._pickerOnSelect) window._pickerOnSelect(exId,name,muscleGroup,emoji);
}

// Exports
window.renderFreeWorkout=renderFreeWorkout;
window.fwStart=fwStart;window.fwReloadExercises=fwReloadExercises;
window.fwSetMuscle=fwSetMuscle;window.fwFilter=fwFilter;
window.fwAddEx=fwAddEx;window.fwUpdate=fwUpdate;window.fwToggleDone=fwToggleDone;
window.fwRemove=fwRemove;window.fwSave=fwSave;window.fwSetTab=fwSetTab;
window.fwApplyTab=fwApplyTab;window.fwToggleNewForm=fwToggleNewForm;
window.fwUploadImg=fwUploadImg;window.fwSaveNewEx=fwSaveNewEx;
window.renderToday=renderToday;window.buildAssignedDayContent=buildAssignedDayContent;
window.toggleAssignedDone=toggleAssignedDone;window.saveExComment=saveExComment;
window.saveAssignedSessionNote=saveAssignedSessionNote;
window.openExPicker=openExPicker;window.closeExPicker=closeExPicker;
window.pickerSelect=pickerSelect;
