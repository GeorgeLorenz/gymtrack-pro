// ══════════════════════════════════════════════════════════════
// js/workout.js — Allenamento Libero + Scheda Assegnata
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// ALLENAMENTO LIBERO
// ══════════════════════════════════════════════════════════════
let freeWorkout = { sessionId: null, exercises: [], startTime: null };

async function renderFreeWorkout() {
  const exercises = await DB.getExercises();

  // Raggruppa per gruppo muscolare
  const byMuscle = {};
  exercises.forEach(e => {
    if (!byMuscle[e.muscle_group]) byMuscle[e.muscle_group] = [];
    byMuscle[e.muscle_group].push(e);
  });

  set(`
  <div class="flex-between">
    <div class="page-title">Allenamento Libero <span class="page-sub">Senza scheda assegnata</span></div>
    <div id="fw_timer" style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--accent);display:none">00:00</div>
  </div>

  <!-- SESSION NOTE + START -->
  <div class="card" id="fw_setup">
    <div class="card-title">Imposta la sessione</div>
    <div class="fg"><label>Note di sessione</label>
      <textarea class="inp" id="fw_note" rows="2" placeholder="Obiettivo di oggi, come ti senti..."></textarea>
    </div>
    <div style="display:flex;gap:1rem;flex-wrap:wrap">
      <button class="btn-primary" onclick="startFreeWorkout()">▶ Inizia Allenamento</button>
    </div>
  </div>

  <!-- EXERCISE SEARCH -->
  <div class="card" id="fw_search" style="display:none">
    <div class="card-title">Aggiungi Esercizi</div>
    <div style="display:flex;gap:0.8rem;flex-wrap:wrap;margin-bottom:1rem">
      <input class="inp" id="fw_searchInput" placeholder="Cerca esercizio..." style="flex:1;min-width:160px"
        oninput="filterFWExercises()">
      <select class="dd" id="fw_muscleFilter" onchange="filterFWExercises()">
        <option value="">Tutti i gruppi</option>
        ${window.MUSCLES.map(m => `<option>${m}</option>`).join('')}
      </select>
    </div>
    <div id="fw_exGrid" class="ex-lib-grid" style="max-height:320px;overflow-y:auto">
      ${exercises.map(e => `
      <div class="ex-lib-card fw-ex-item" data-name="${e.name.toLowerCase()}" data-muscle="${e.muscle_group}"
        onclick="addToFreeWorkout('${e.id}','${esc(e.name)}','${e.muscle_group}','${e.emoji||'🏋️'}')">
        <div class="ex-lib-img">${e.image_url ? `<img src="${e.image_url}" onerror="this.parentElement.innerHTML='${e.emoji||'🏋️'}'">` : e.emoji || '🏋️'}</div>
        <div class="ex-lib-body">
          <div class="ex-lib-name">${e.name}</div>
          <div class="ex-lib-muscle">${e.muscle_group}</div>
        </div>
      </div>`).join('')}
    </div>
  </div>

  <!-- ACTIVE EXERCISES -->
  <div id="fw_exercises"></div>

  <!-- SAVE SESSION -->
  <div id="fw_saveBar" style="display:none">
    <button class="btn-primary btn-full" onclick="saveFreeWorkout()">💾 Salva Sessione</button>
  </div>`);
}

function startFreeWorkout() {
  if (freeWorkout.sessionId) return; // Already started
  freeWorkout = { sessionId: 'pending', exercises: [], startTime: Date.now() };
  document.getElementById('fw_setup').style.display = 'none';
  document.getElementById('fw_search').style.display = 'block';
  document.getElementById('fw_saveBar').style.display = 'block';
  document.getElementById('fw_timer').style.display = 'block';
  startTimer();
}

let _timerInterval = null;
function startTimer() {
  clearInterval(_timerInterval);
  _timerInterval = setInterval(() => {
    const el = document.getElementById('fw_timer');
    if (!el || !freeWorkout.startTime) return;
    const sec = Math.floor((Date.now() - freeWorkout.startTime) / 1000);
    el.textContent = `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
  }, 1000);
}

function filterFWExercises() {
  const q      = (document.getElementById('fw_searchInput')?.value || '').toLowerCase();
  const muscle = document.getElementById('fw_muscleFilter')?.value || '';
  document.querySelectorAll('.fw-ex-item').forEach(el => {
    const matchName   = !q || el.dataset.name.includes(q);
    const matchMuscle = !muscle || el.dataset.muscle === muscle;
    el.style.display = matchName && matchMuscle ? 'block' : 'none';
  });
}

function addToFreeWorkout(exId, name, muscleGroup, emoji) {
  const id = uid();
  const ex = { id, exId, name, muscleGroup, emoji, serie: 3, reps: 10, weight: 0, done: false, comment: '' };
  freeWorkout.exercises.push(ex);
  renderFWExercises();
  toast(`${name} aggiunto`, 'success');
}

function renderFWExercises() {
  const container = document.getElementById('fw_exercises');
  if (!container) return;
  if (!freeWorkout.exercises.length) {
    container.innerHTML = '<div class="empty" style="margin-bottom:1rem">Nessun esercizio aggiunto</div>';
    return;
  }
  container.innerHTML = freeWorkout.exercises.map((e, idx) => `
  <div class="ex-log-card ${e.done ? 'done' : ''}" id="fwex_${e.id}">
    <div class="ex-log-header">
      <div class="ex-log-info">
        <div class="ex-mini-thumb" style="width:44px;height:44px;font-size:1.5rem">${e.emoji}</div>
        <div style="flex:1">
          <div class="ex-log-name">${e.name}</div>
          <div class="ex-log-meta"><span>🔵 ${e.muscleGroup}</span></div>
          <!-- SET EDITOR -->
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.7rem;align-items:center">
            <div style="display:flex;flex-direction:column;align-items:center;gap:0.2rem">
              <span style="font-size:0.55rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Serie</span>
              <select class="dd" style="padding:0.3rem 0.5rem;width:60px" onchange="updateFWEx('${e.id}','serie',this.value)">
                ${window.SERIE_OPTS.map(s => `<option ${e.serie==s?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:0.2rem">
              <span style="font-size:0.55rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Reps</span>
              <select class="dd" style="padding:0.3rem 0.5rem;width:65px" onchange="updateFWEx('${e.id}','reps',this.value)">
                ${window.REPS_OPTS.map(r => `<option ${e.reps==r?'selected':''}>${r}</option>`).join('')}
              </select>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:0.2rem">
              <span style="font-size:0.55rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Peso (kg)</span>
              <select class="dd" style="padding:0.3rem 0.5rem;width:80px" onchange="updateFWEx('${e.id}','weight',this.value)">
                ${window.WEIGHT_OPTS.map(w => `<option value="${w}" ${e.weight==w?'selected':''}>${w}</option>`).join('')}
              </select>
            </div>
          </div>
          <!-- COMMENT -->
          <div class="fg" style="margin-top:0.6rem">
            <label>Note</label>
            <input class="inp" value="${esc(e.comment)}" placeholder="Note esercizio..."
              onchange="updateFWEx('${e.id}','comment',this.value)" style="font-size:0.78rem">
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.4rem;align-items:flex-end">
        <div class="check-wrap" onclick="toggleFWDone('${e.id}')">
          <div class="check-box ${e.done ? 'checked' : ''}" id="fwcb_${e.id}"></div>
        </div>
        <button class="btn-danger btn-sm" onclick="removeFWEx('${e.id}')">✕</button>
        ${idx > 0 ? `<button class="btn-secondary btn-sm" onclick="moveFWEx('${e.id}',-1)" style="font-size:0.7rem;padding:0.2rem 0.5rem">↑</button>` : ''}
        ${idx < freeWorkout.exercises.length-1 ? `<button class="btn-secondary btn-sm" onclick="moveFWEx('${e.id}',1)" style="font-size:0.7rem;padding:0.2rem 0.5rem">↓</button>` : ''}
      </div>
    </div>
  </div>`).join('');
}

function updateFWEx(id, field, value) {
  const ex = freeWorkout.exercises.find(e => e.id === id);
  if (!ex) return;
  if (field === 'serie' || field === 'reps') ex[field] = parseInt(value);
  else if (field === 'weight') ex[field] = parseFloat(value);
  else ex[field] = value;
}

function toggleFWDone(id) {
  const ex = freeWorkout.exercises.find(e => e.id === id);
  if (!ex) return;
  ex.done = !ex.done;
  const card = document.getElementById('fwex_' + id);
  const cb   = document.getElementById('fwcb_' + id);
  if (card) card.classList.toggle('done', ex.done);
  if (cb)   cb.classList.toggle('checked', ex.done);
}

function removeFWEx(id) {
  freeWorkout.exercises = freeWorkout.exercises.filter(e => e.id !== id);
  renderFWExercises();
}

function moveFWEx(id, dir) {
  const exs = freeWorkout.exercises;
  const i = exs.findIndex(e => e.id === id);
  if (i < 0) return;
  const newI = i + dir;
  if (newI < 0 || newI >= exs.length) return;
  [exs[i], exs[newI]] = [exs[newI], exs[i]];
  renderFWExercises();
}

async function saveFreeWorkout() {
  if (!freeWorkout.exercises.length) { toast('Aggiungi almeno un esercizio', 'error'); return; }
  const note = document.getElementById('fw_note')?.value?.trim() || '';
  const dur  = freeWorkout.startTime ? Math.round((Date.now() - freeWorkout.startTime) / 60000) : 0;
  const dateStr = new Date().toISOString().split('T')[0];

  try {
    const session = await DB.createSession({
      user_id: window.CU.id, pt_id: null,
      session_date: dateStr, session_note: note,
      is_free: true, template_name: 'Allenamento Libero',
      duration_min: dur,
      total_volume: freeWorkout.exercises.reduce((s,e) => s + (e.done ? e.serie*e.reps*e.weight : 0), 0)
    });

    for (let i = 0; i < freeWorkout.exercises.length; i++) {
      const e = freeWorkout.exercises[i];
      await DB.upsertSessionExercise({
        session_id: session.id, exercise_id: e.exId, exercise_name: e.name,
        muscle_group: e.muscleGroup, serie: e.serie, reps: e.reps, weight: e.weight,
        done: e.done, comment: e.comment, sort_order: i
      });
    }

    clearInterval(_timerInterval);
    freeWorkout = { sessionId: null, exercises: [], startTime: null };
    toast('Sessione salvata!', 'success');
    router('history');
  } catch(e) { toast('Errore nel salvataggio', 'error'); console.error(e); }
}

// ══════════════════════════════════════════════════════════════
// SCHEDA ASSEGNATA — TODAY
// ══════════════════════════════════════════════════════════════
async function renderToday() {
  const asgns = await DB.getAssignments({ userId: window.CU.id });
  const asgn  = asgns[0];
  const dk    = window.DKEYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const exs   = asgn ? (asgn.schedule[dk] || []) : [];
  const dateStr = new Date().toISOString().split('T')[0];
  const log   = await DB.getSessionByDate(window.CU.id, dateStr);
  const done  = log ? log.session_exercises.filter(e => e.done).length : 0;

  set(`<div class="flex-between">
    <div class="page-title">Oggi — ${window.DAYS[window.DKEYS.indexOf(dk)]} <span class="page-sub">${fmtDate(dateStr)}</span></div>
    ${exs.length ? `<span class="tag ${done===exs.length&&done?'accent':''}">${done}/${exs.length}</span>` : ''}
  </div>
  ${!asgn
    ? `<div class="info-box">Nessuna scheda assegnata.<br>Puoi comunque <a href="#" onclick="router('free_workout')" style="color:var(--accent)">fare un allenamento libero</a>!</div>`
    : !exs.length
    ? `<div class="empty" style="padding:4rem">🌟 Oggi è giorno di riposo!</div>`
    : await buildAssignedDayContent(dateStr, dk, exs, log, asgn)}`);
}

async function buildAssignedDayContent(dateStr, dk, exs, log, asgn) {
  const logExMap = {};
  if (log) log.session_exercises.forEach(e => { logExMap[e.exercise_id || e.exercise_name] = e; });

  let html = `<div class="fg" style="margin-bottom:1rem">
    <label>Note Sessione</label>
    <textarea class="inp" id="sessNote_${dateStr}" rows="2" placeholder="Come ti sei sentito oggi?">${esc(log?.session_note || '')}</textarea>
  </div>`;

  const exercises = await DB.getExercises();

  html += exs.map(e => {
    const key = e.exId || e.id;
    const le  = logExMap[key] || logExMap[e.name] || { done: false, comment: '', pt_reply: '' };
    const exDef = exercises.find(x => x.id === e.exId);
    const imgHtml = exDef?.image_url
      ? `<img src="${exDef.image_url}" style="width:100%;height:100%;object-fit:cover">`
      : (e.emoji || window.MUSCLES_EMOJI[e.muscleGroup] || '🏋️');
    return `<div class="ex-log-card ${le.done?'done':''} ${le.comment?'commented':''}" id="elc_${e.id}">
      <div class="ex-log-header">
        <div class="ex-log-info">
          <div class="ex-mini-thumb" style="width:44px;height:44px">${imgHtml}</div>
          <div>
            <div class="ex-log-name">${esc(e.name)}</div>
            <div class="ex-log-meta">
              <span>🔵 ${e.muscleGroup}</span><span>📋 ${e.serie}×${e.reps}</span><span>⚖️ ${e.weight}kg</span>
            </div>
            ${e.note ? `<div class="pt-note-box"><span style="font-size:0.58rem;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:0.2rem">Nota PT</span>${esc(e.note)}</div>` : ''}
          </div>
        </div>
        <div class="check-wrap" onclick="toggleAssignedDone('${e.id}','${e.exId||e.id}','${dateStr}','${dk}','${asgn.id}')">
          <div class="check-box ${le.done?'checked':''}" id="cb_${e.id}"></div>
        </div>
      </div>
      ${le.pt_reply ? `<div class="pt-note-box"><div style="font-size:0.58rem;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:0.2rem">Risposta PT</div>${esc(le.pt_reply)}</div>` : ''}
      <div class="fg" style="margin-top:0.6rem">
        <label>Commento al PT</label>
        <div style="display:flex;gap:0.5rem">
          <textarea class="inp" id="cmt_${e.id}" rows="1" placeholder="Scrivi un commento...">${esc(le.comment||'')}</textarea>
          <button class="btn-secondary btn-sm" style="align-self:flex-end"
            onclick="saveExComment('${e.id}','${e.exId||e.id}','${e.name}','${dateStr}','${dk}','${asgn.id}')">Invia</button>
        </div>
      </div>
    </div>`;
  }).join('');

  html += `<button class="btn-primary" style="margin-top:0.5rem"
    onclick="saveAssignedSessionNote('${dateStr}','${dk}','${asgn.id}')">💾 Salva Note Sessione</button>`;
  return html;
}

// ── TOGGLE DONE (SCHEDA ASSEGNATA) ────────────────────────────
async function toggleAssignedDone(rowId, exKey, dateStr, dk, asgnId) {
  const asgns = lsGet('assignments');
  const asgn  = await DB.getAssignments({ userId: window.CU.id }).then(a => a.find(x => x.id === asgnId));
  if (!asgn) return;
  const exs = asgn.schedule[dk] || [];
  let session = await DB.getSessionByDate(window.CU.id, dateStr);
  if (!session) {
    session = await DB.createSession({
      user_id: window.CU.id, pt_id: asgn.pt_id,
      session_date: dateStr, session_note: '',
      is_free: false, template_name: asgn.template_name, duration_min: 0, total_volume: 0
    });
    // Create exercise rows
    for (let i = 0; i < exs.length; i++) {
      const e = exs[i];
      await DB.upsertSessionExercise({
        session_id: session.id, exercise_id: e.exId || null, exercise_name: e.name,
        muscle_group: e.muscleGroup, serie: e.serie, reps: e.reps, weight: e.weight,
        done: false, comment: '', pt_reply: '', sort_order: i
      });
    }
    session = await DB.getSessionByDate(window.CU.id, dateStr);
  }
  const le = session.session_exercises.find(e => (e.exercise_id === exKey) || (e.exercise_name === exKey));
  if (!le) return;
  await DB.upsertSessionExercise({ ...le, done: !le.done });
  const card = document.getElementById('elc_' + rowId);
  const cb   = document.getElementById('cb_'  + rowId);
  if (card) card.classList.toggle('done', !le.done);
  if (cb)   cb.classList.toggle('checked', !le.done);
}

async function saveExComment(rowId, exKey, exName, dateStr, dk, asgnId) {
  const comment = document.getElementById('cmt_' + rowId)?.value?.trim() || '';
  const asgn = await DB.getAssignments({ userId: window.CU.id }).then(a => a.find(x => x.id === asgnId));
  if (!asgn) return;
  let session = await DB.getSessionByDate(window.CU.id, dateStr);
  if (!session) {
    session = await DB.createSession({
      user_id: window.CU.id, pt_id: asgn.pt_id,
      session_date: dateStr, session_note: '', is_free: false,
      template_name: asgn.template_name, duration_min: 0, total_volume: 0
    });
  }
  const le = session.session_exercises?.find(e => e.exercise_id === exKey || e.exercise_name === exName);
  if (le) {
    await DB.upsertSessionExercise({ ...le, comment });
  } else {
    const exs = asgn.schedule[dk] || [];
    const exData = exs.find(e => (e.exId||e.id) === exKey);
    if (exData) await DB.upsertSessionExercise({
      session_id: session.id, exercise_id: exData.exId || null, exercise_name: exData.name,
      muscle_group: exData.muscleGroup, serie: exData.serie, reps: exData.reps, weight: exData.weight,
      done: false, comment, pt_reply: '', sort_order: 0
    });
  }
  const card = document.getElementById('elc_' + rowId);
  if (card) card.classList.toggle('commented', !!comment);
  toast('Commento salvato', 'success');
}

async function saveAssignedSessionNote(dateStr, dk, asgnId) {
  const note = document.getElementById(`sessNote_${dateStr}`)?.value?.trim() || '';
  const asgn = await DB.getAssignments({ userId: window.CU.id }).then(a => a.find(x => x.id === asgnId));
  if (!asgn) return;
  let session = await DB.getSessionByDate(window.CU.id, dateStr);
  if (!session) {
    await DB.createSession({
      user_id: window.CU.id, pt_id: asgn.pt_id,
      session_date: dateStr, session_note: note,
      is_free: false, template_name: asgn.template_name, duration_min: 0, total_volume: 0
    });
  } else {
    await DB.updateSession(session.id, { session_note: note });
  }
  toast('Note salvate', 'success');
}

window.renderFreeWorkout = renderFreeWorkout;
window.startFreeWorkout = startFreeWorkout;
window.filterFWExercises = filterFWExercises;
window.addToFreeWorkout = addToFreeWorkout;
window.updateFWEx = updateFWEx;
window.toggleFWDone = toggleFWDone;
window.removeFWEx = removeFWEx;
window.moveFWEx = moveFWEx;
window.saveFreeWorkout = saveFreeWorkout;
window.renderToday = renderToday;
window.toggleAssignedDone = toggleAssignedDone;
window.saveExComment = saveExComment;
window.saveAssignedSessionNote = saveAssignedSessionNote;
window.buildAssignedDayContent = buildAssignedDayContent;
