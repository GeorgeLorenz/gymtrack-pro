// ══════════════════════════════════════════════════════════════
// workout.js — Allenamento Libero + Scheda Assegnata
// ══════════════════════════════════════════════════════════════

let freeWorkout = { sessionId: null, exercises: [], startTime: null, date: null };
let _allExercises = [];

// ══════════════════════════════════════════════════════════════
// EXERCISE PICKER — fullscreen modal
// ══════════════════════════════════════════════════════════════
async function openExPicker(onSelect) {
  _allExercises = await DB.getExercises();
  window._pickerOnSelect = onSelect;
  window._pickerMuscle = '';
  const modal = document.getElementById('exPickerModal');
  modal.classList.add('open');
  const si = document.getElementById('pickerSearch');
  if (si) { si.value = ''; si.focus(); }
  renderPickerChips();
  renderPickerList('', '');
}

function closeExPicker() {
  document.getElementById('exPickerModal').classList.remove('open');
}

function renderPickerChips() {
  const chips = document.getElementById('pickerChips');
  if (!chips) return;
  chips.innerHTML =
    `<div class="picker-chip ${!window._pickerMuscle?'active':''}" onclick="setPickerMuscle('')">Tutti</div>` +
    window.MUSCLES.map(m =>
      `<div class="picker-chip ${window._pickerMuscle===m?'active':''}" onclick="setPickerMuscle('${m}')">${m}</div>`
    ).join('');
}

function setPickerMuscle(m) {
  window._pickerMuscle = m;
  renderPickerChips();
  renderPickerList(document.getElementById('pickerSearch')?.value||'', m);
}

function renderPickerList(query, muscle) {
  const list = document.getElementById('pickerList');
  if (!list) return;
  const q = query.toLowerCase().trim();
  const filtered = _allExercises.filter(e =>
    (!q || e.name.toLowerCase().includes(q)) &&
    (!muscle || e.muscle_group === muscle)
  );

  let html = `
  <div class="picker-item" style="border-bottom:2px solid var(--border);background:var(--bg3)"
    onclick="openNewExerciseForm()">
    <div class="picker-item-emoji">➕</div>
    <div>
      <div class="picker-item-name" style="color:var(--accent)">Crea nuovo esercizio</div>
      <div class="picker-item-muscle">Aggiungi con foto e video</div>
    </div>
  </div>`;

  if (!filtered.length) {
    html += '<div class="empty" style="border:none;padding:2rem 1rem">Nessun esercizio trovato</div>';
  } else {
    html += filtered.map(e => `
    <div class="picker-item" onclick="pickerSelect('${e.id}','${esc(e.name)}','${e.muscle_group}','${e.emoji||'🏋️'}')">
      <div class="picker-item-emoji">
        ${e.image_url ? `<img src="${e.image_url}" style="width:40px;height:40px;object-fit:cover;border-radius:4px" onerror="this.outerHTML='${e.emoji||'🏋️'}'">` : e.emoji||'🏋️'}
      </div>
      <div style="flex:1;min-width:0">
        <div class="picker-item-name">${esc(e.name)}</div>
        <div class="picker-item-muscle">${e.muscle_group}${e.video_url?'  ▶ video':''}</div>
      </div>
    </div>`).join('');
  }
  list.innerHTML = html;
}

function pickerSearch() {
  renderPickerList(document.getElementById('pickerSearch')?.value||'', window._pickerMuscle||'');
}

function pickerSelect(exId, name, muscleGroup, emoji) {
  closeExPicker();
  if (window._pickerOnSelect) window._pickerOnSelect(exId, name, muscleGroup, emoji);
}

// ── NEW EXERCISE FORM inside picker ──────────────────────────
function openNewExerciseForm() {
  const list = document.getElementById('pickerList');
  if (!list) return;
  list.innerHTML = `
  <div style="padding:1rem">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:1rem">Nuovo Esercizio</div>
    <div class="fg"><label>Nome *</label><input class="inp" id="ne_name" placeholder="Es: Cable Fly"></div>
    <div class="fg"><label>Gruppo Muscolare *</label>
      <select class="inp" id="ne_muscle">
        ${window.MUSCLES.map(m=>`<option>${m}</option>`).join('')}
      </select>
    </div>
    <div class="fr2">
      <div class="fg"><label>Emoji</label><input class="inp" id="ne_emoji" value="🏋️" maxlength="4"></div>
      <div class="fg"><label>Descrizione</label><input class="inp" id="ne_desc" placeholder="Breve descrizione"></div>
    </div>
    <div class="fg"><label>Foto (URL o upload)</label>
      <div style="display:flex;gap:0.5rem">
        <input class="inp" id="ne_img" placeholder="https://... oppure carica" style="flex:1" oninput="previewNEImg()">
        <label class="btn-secondary btn-sm" style="cursor:pointer;display:flex;align-items:center">
          📷<input type="file" accept="image/*" style="display:none" onchange="uploadNEImg(this)">
        </label>
      </div>
      <div id="ne_img_prev" style="margin-top:0.4rem"></div>
    </div>
    <div class="fg"><label>Video YouTube (URL)</label>
      <input class="inp" id="ne_video" placeholder="https://youtube.com/watch?v=...">
    </div>
    <div style="display:flex;gap:0.6rem;margin-top:0.8rem">
      <button class="btn-primary" style="flex:1" onclick="saveNewExAndAdd()">Salva e Aggiungi</button>
      <button class="btn-secondary" onclick="renderPickerList('','')">Annulla</button>
    </div>
  </div>`;
}

function previewNEImg() {
  const url = document.getElementById('ne_img')?.value||'';
  const prev = document.getElementById('ne_img_prev');
  if (prev) prev.innerHTML = url ? `<img src="${url}" style="max-width:100%;max-height:100px;object-fit:cover;border:1px solid var(--border)">` : '';
}

function uploadNEImg(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const el = document.getElementById('ne_img');
    if (el) { el.value = e.target.result; previewNEImg(); }
  };
  reader.readAsDataURL(file);
}

async function saveNewExAndAdd() {
  const name = (document.getElementById('ne_name')?.value||'').trim();
  if (!name) { toast('Inserisci un nome', 'error'); return; }
  const muscle  = document.getElementById('ne_muscle')?.value||window.MUSCLES[0];
  const emoji   = document.getElementById('ne_emoji')?.value||'🏋️';
  const desc    = document.getElementById('ne_desc')?.value||'';
  const img     = document.getElementById('ne_img')?.value||'';
  const video   = document.getElementById('ne_video')?.value||'';

  const ex = await DB.createExercise({
    name, muscle_group: muscle, emoji, description: desc,
    image_url: img, video_url: video, is_default: false,
    created_by: window.CU?.id || null
  });

  _allExercises.push(ex);
  closeExPicker();
  if (window._pickerOnSelect) window._pickerOnSelect(ex.id, ex.name, ex.muscle_group, ex.emoji);
  toast(`${name} creato e aggiunto!`, 'success');
}

// ══════════════════════════════════════════════════════════════
// ALLENAMENTO LIBERO
// ══════════════════════════════════════════════════════════════
async function renderFreeWorkout() {
  const isActive = !!freeWorkout.sessionId;
  const todayStr = new Date().toISOString().split('T')[0];
  const fmtToday = new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  set(`
  <div class="flex-between">
    <div class="page-title">Allenamento Libero</div>
    ${isActive ? `<div id="fw_timer" style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:var(--accent)">00:00</div>` : ''}
  </div>

  ${!isActive ? `
  <!-- START CARD -->
  <div class="card" style="border-left:3px solid var(--accent)">
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.2rem">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:3rem;color:var(--accent);line-height:1">${new Date().getDate()}</div>
      <div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:1rem;font-weight:700;letter-spacing:2px;text-transform:uppercase">${fmtToday}</div>
        <div style="font-size:0.65rem;color:var(--muted);margin-top:0.1rem">La sessione verrà registrata per oggi</div>
      </div>
    </div>
    <button class="btn-primary btn-full" style="font-size:1rem" onclick="startFreeWorkout()">▶ Inizia Allenamento</button>
  </div>
  ` : `
  <!-- ACTIVE BAR -->
  <div class="card" style="border-left:3px solid var(--accent);margin-bottom:0.5rem">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.8rem">
      <div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent)">● In corso — ${fmtToday}</div>
        <div style="font-size:0.72rem;color:var(--muted);margin-top:0.2rem">${freeWorkout.exercises.length} esercizi</div>
      </div>
      <div class="flex-gap">
        <button class="btn-secondary btn-sm" onclick="openExPicker(addToFreeWorkout)">+ Esercizio</button>
        <button class="btn-primary btn-sm" onclick="saveFreeWorkout()">💾 Salva</button>
      </div>
    </div>
  </div>`}

  <div id="fw_exercises"></div>

  ${isActive ? `
  <div style="margin-top:0.3rem">
    <button class="btn-secondary btn-full" onclick="openExPicker(addToFreeWorkout)">+ Aggiungi Esercizio</button>
  </div>
  <div style="margin-top:0.5rem">
    <button class="btn-primary btn-full" onclick="saveFreeWorkout()">💾 Salva Sessione</button>
  </div>` : ''}`);

  if (isActive) {
    renderFWExercises();
    startTimer();
  }
}

function startFreeWorkout() {
  freeWorkout = {
    sessionId: 'pending', exercises: [],
    startTime: Date.now(),
    date: new Date().toISOString().split('T')[0]
  };
  renderFreeWorkout();
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

function addToFreeWorkout(exId, name, muscleGroup, emoji) {
  freeWorkout.exercises.push({
    id: uid(), exId, name, muscleGroup, emoji,
    serie: 3, reps: 10, weight: 0, done: false, comment: ''
  });
  renderFWExercises();
  toast(`${name} aggiunto`, 'success');
}

function renderFWExercises() {
  const container = document.getElementById('fw_exercises');
  if (!container) return;
  if (!freeWorkout.exercises.length) {
    container.innerHTML = `<div class="empty" style="margin:0.5rem 0">
      Nessun esercizio — premi <strong style="color:var(--accent)">+ Aggiungi Esercizio</strong>
    </div>`;
    return;
  }
  container.innerHTML = freeWorkout.exercises.map((e, idx) => `
  <div class="ex-log-card ${e.done?'done':''}" id="fwex_${e.id}">
    <div class="ex-log-header">
      <div class="ex-log-info">
        <div class="ex-mini-thumb" style="width:42px;height:42px;font-size:1.5rem;flex-shrink:0">${e.emoji||'🏋️'}</div>
        <div style="flex:1;min-width:0">
          <div class="ex-log-name">${esc(e.name)}</div>
          <div class="ex-log-meta"><span>${e.muscleGroup}</span></div>
          <div class="fw-set-row">
            <div class="fw-set-col">
              <span class="fw-set-label">Serie</span>
              <select class="dd" style="width:58px;padding:0.4rem" onchange="updateFWEx('${e.id}','serie',this.value)">
                ${window.SERIE_OPTS.map(s=>`<option ${e.serie==s?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="fw-set-col">
              <span class="fw-set-label">Reps</span>
              <select class="dd" style="width:62px;padding:0.4rem" onchange="updateFWEx('${e.id}','reps',this.value)">
                ${window.REPS_OPTS.map(r=>`<option ${e.reps==r?'selected':''}>${r}</option>`).join('')}
              </select>
            </div>
            <div class="fw-set-col">
              <span class="fw-set-label">Peso kg</span>
              <select class="dd" style="width:72px;padding:0.4rem" onchange="updateFWEx('${e.id}','weight',this.value)">
                ${window.WEIGHT_OPTS.map(w=>`<option value="${w}" ${e.weight==w?'selected':''}>${w}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="fg" style="margin-top:0.6rem;margin-bottom:0">
            <label>Note</label>
            <input class="inp" value="${esc(e.comment)}" placeholder="Note esercizio..."
              onchange="updateFWEx('${e.id}','comment',this.value)">
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.3rem;align-items:flex-end;flex-shrink:0">
        <div class="check-wrap" onclick="toggleFWDone('${e.id}')">
          <div class="check-box ${e.done?'checked':''}" id="fwcb_${e.id}"></div>
        </div>
        <button class="btn-icon" onclick="removeFWEx('${e.id}')" style="color:var(--red);border-color:rgba(255,61,61,0.3);min-width:40px;min-height:40px;font-size:0.85rem">✕</button>
      </div>
    </div>
  </div>`).join('');
}

function updateFWEx(id, field, value) {
  const ex = freeWorkout.exercises.find(e => e.id === id);
  if (!ex) return;
  if (field==='serie'||field==='reps') ex[field] = parseInt(value);
  else if (field==='weight') ex[field] = parseFloat(value);
  else ex[field] = value;
}

function toggleFWDone(id) {
  const ex = freeWorkout.exercises.find(e => e.id === id);
  if (!ex) return;
  ex.done = !ex.done;
  document.getElementById('fwex_'+id)?.classList.toggle('done', ex.done);
  document.getElementById('fwcb_'+id)?.classList.toggle('checked', ex.done);
}

function removeFWEx(id) {
  freeWorkout.exercises = freeWorkout.exercises.filter(e => e.id !== id);
  renderFWExercises();
}

async function saveFreeWorkout() {
  if (!freeWorkout.exercises.length) { toast('Aggiungi almeno un esercizio', 'error'); return; }
  const dur = freeWorkout.startTime ? Math.round((Date.now() - freeWorkout.startTime) / 60000) : 0;
  const dateStr = freeWorkout.date || new Date().toISOString().split('T')[0];
  try {
    const session = await DB.createSession({
      user_id: window.CU.id, pt_id: null,
      session_date: dateStr, session_note: '',
      is_free: true, template_name: 'Allenamento Libero', duration_min: dur,
      total_volume: freeWorkout.exercises.reduce((s,e)=>s+(e.done?e.serie*e.reps*e.weight:0),0)
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
    freeWorkout = { sessionId: null, exercises: [], startTime: null, date: null };
    toast('Sessione salvata!', 'success');
    router('history');
  } catch(err) { toast('Errore nel salvataggio', 'error'); console.error(err); }
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
  const fmtToday = new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});

  set(`<div class="flex-between">
    <div class="page-title">Oggi <span class="page-sub">${fmtToday}</span></div>
    ${exs.length ? `<span class="tag ${done===exs.length&&done?'accent':''}">${done}/${exs.length}</span>` : ''}
  </div>
  ${!asgn
    ? `<div class="info-box">Nessuna scheda assegnata.<br>Prova l'<a href="#" onclick="router('free_workout')" style="color:var(--accent)">Allenamento Libero</a>!</div>`
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
    <textarea class="inp" id="sessNote_${dateStr}" rows="2" placeholder="Come ti sei sentito oggi?">${esc(log?.session_note||'')}</textarea>
  </div>`;

  html += exs.map(e => {
    const key = e.exId||e.id;
    const le  = logExMap[key]||logExMap[e.name]||{done:false,comment:'',pt_reply:''};
    const exDef = exercises.find(x=>x.id===e.exId);
    const img = exDef?.image_url
      ? `<img src="${exDef.image_url}" style="width:100%;height:100%;object-fit:cover">`
      : (e.emoji||window.MUSCLES_EMOJI?.[e.muscleGroup]||'🏋️');
    const videoBtn = exDef?.video_url
      ? `<a href="${exDef.video_url}" target="_blank" style="font-size:0.65rem;color:var(--blue);margin-left:0.5rem">▶ Video</a>` : '';
    return `<div class="ex-log-card ${le.done?'done':''} ${le.comment?'commented':''}" id="elc_${e.id}">
      <div class="ex-log-header">
        <div class="ex-log-info">
          <div class="ex-mini-thumb" style="width:44px;height:44px">${img}</div>
          <div style="flex:1;min-width:0">
            <div class="ex-log-name">${esc(e.name)}${videoBtn}</div>
            <div class="ex-log-meta"><span>${e.muscleGroup}</span><span>${e.serie}×${e.reps}</span><span>${e.weight}kg</span></div>
            ${e.note?`<div class="pt-note-box">${esc(e.note)}</div>`:''}
          </div>
        </div>
        <div class="check-wrap" onclick="toggleAssignedDone('${e.id}','${e.exId||e.id}','${dateStr}','${dk}','${asgn.id}')">
          <div class="check-box ${le.done?'checked':''}" id="cb_${e.id}"></div>
        </div>
      </div>
      ${le.pt_reply?`<div class="pt-note-box"><div style="font-size:0.6rem;color:var(--accent);text-transform:uppercase;letter-spacing:2px;margin-bottom:0.2rem">PT</div>${esc(le.pt_reply)}</div>`:''}
      <div class="fg" style="margin-top:0.6rem;margin-bottom:0">
        <label>Commento al PT</label>
        <div style="display:flex;gap:0.5rem">
          <textarea class="inp" id="cmt_${e.id}" rows="1" placeholder="Scrivi...">${esc(le.comment||'')}</textarea>
          <button class="btn-secondary btn-sm" style="align-self:flex-end;white-space:nowrap"
            onclick="saveExComment('${e.id}','${e.exId||e.id}','${e.name}','${dateStr}','${dk}','${asgn.id}')">Invia</button>
        </div>
      </div>
    </div>`;
  }).join('');

  html += `<button class="btn-primary btn-full" style="margin-top:0.5rem"
    onclick="saveAssignedSessionNote('${dateStr}','${dk}','${asgn.id}')">💾 Salva Note</button>`;
  return html;
}

async function toggleAssignedDone(rowId, exKey, dateStr, dk, asgnId) {
  const asgn = await DB.getAssignments({userId:window.CU.id}).then(a=>a.find(x=>x.id===asgnId));
  if (!asgn) return;
  const exs = asgn.schedule[dk]||[];
  let session = await DB.getSessionByDate(window.CU.id, dateStr);
  if (!session) {
    session = await DB.createSession({user_id:window.CU.id,pt_id:asgn.pt_id,session_date:dateStr,session_note:'',is_free:false,template_name:asgn.template_name,duration_min:0,total_volume:0});
    for (let i=0;i<exs.length;i++) {
      const e=exs[i];
      await DB.upsertSessionExercise({session_id:session.id,exercise_id:e.exId||null,exercise_name:e.name,muscle_group:e.muscleGroup,serie:e.serie,reps:e.reps,weight:e.weight,done:false,comment:'',pt_reply:'',sort_order:i});
    }
    session = await DB.getSessionByDate(window.CU.id, dateStr);
  }
  const le = session.session_exercises.find(e=>(e.exercise_id===exKey)||(e.exercise_name===exKey));
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
  if (!session) session = await DB.createSession({user_id:window.CU.id,pt_id:asgn.pt_id,session_date:dateStr,session_note:'',is_free:false,template_name:asgn.template_name,duration_min:0,total_volume:0});
  const le = session.session_exercises?.find(e=>e.exercise_id===exKey||e.exercise_name===exName);
  if (le) await DB.upsertSessionExercise({...le,comment});
  else {
    const exData=(asgn.schedule[dk]||[]).find(e=>(e.exId||e.id)===exKey);
    if (exData) await DB.upsertSessionExercise({session_id:session.id,exercise_id:exData.exId||null,exercise_name:exData.name,muscle_group:exData.muscleGroup,serie:exData.serie,reps:exData.reps,weight:exData.weight,done:false,comment,pt_reply:'',sort_order:0});
  }
  document.getElementById('elc_'+rowId)?.classList.toggle('commented',!!comment);
  toast('Commento salvato','success');
}

async function saveAssignedSessionNote(dateStr, dk, asgnId) {
  const note = document.getElementById(`sessNote_${dateStr}`)?.value?.trim()||'';
  const asgn = await DB.getAssignments({userId:window.CU.id}).then(a=>a.find(x=>x.id===asgnId));
  if (!asgn) return;
  let session = await DB.getSessionByDate(window.CU.id, dateStr);
  if (!session) await DB.createSession({user_id:window.CU.id,pt_id:asgn.pt_id,session_date:dateStr,session_note:note,is_free:false,template_name:asgn.template_name,duration_min:0,total_volume:0});
  else await DB.updateSession(session.id,{session_note:note});
  toast('Note salvate','success');
}

// Exports
window.openExPicker=openExPicker;window.closeExPicker=closeExPicker;
window.setPickerMuscle=setPickerMuscle;window.renderPickerList=renderPickerList;
window.pickerSearch=pickerSearch;window.pickerSelect=pickerSelect;
window.openNewExerciseForm=openNewExerciseForm;window.previewNEImg=previewNEImg;
window.uploadNEImg=uploadNEImg;window.saveNewExAndAdd=saveNewExAndAdd;
window.renderFreeWorkout=renderFreeWorkout;window.startFreeWorkout=startFreeWorkout;
window.addToFreeWorkout=addToFreeWorkout;window.renderFWExercises=renderFWExercises;
window.updateFWEx=updateFWEx;window.toggleFWDone=toggleFWDone;
window.removeFWEx=removeFWEx;window.saveFreeWorkout=saveFreeWorkout;
window.renderToday=renderToday;window.buildAssignedDayContent=buildAssignedDayContent;
window.toggleAssignedDone=toggleAssignedDone;window.saveExComment=saveExComment;
window.saveAssignedSessionNote=saveAssignedSessionNote;
