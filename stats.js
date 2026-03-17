// ══════════════════════════════════════════════════════════════
// js/stats.js — Statistiche e Grafici (Chart.js)
// ══════════════════════════════════════════════════════════════

const CHART_COLORS = {
  accent: '#c8f135', blue: '#3d9eff', red: '#ff3d3d', gold: '#ffd700',
  muted: '#555', bg2: '#111', bg3: '#1a1a1a', border: '#252525', text: '#e8e8e8',
  muscles: ['#c8f135','#3d9eff','#ff9f43','#ff3d3d','#a29bfe','#fd79a8','#00b894','#fdcb6e'],
};

function destroyChart(id) {
  const existing = Chart.getChart(id);
  if (existing) existing.destroy();
}

// ── RENDER PAGE STATISTICHE ───────────────────────────────────
async function renderStats() {
  set(`<div class="page-title">Statistiche <span class="page-sub">I tuoi progressi</span></div>
  <div id="statsLoading" style="text-align:center;padding:3rem;color:var(--muted);font-size:0.8rem">⏳ Caricamento dati...</div>
  <div id="statsBody" style="display:none"></div>`);

  const stats = await DB.getStats(window.CU.id);
  document.getElementById('statsLoading').style.display = 'none';
  const body = document.getElementById('statsBody');
  body.style.display = 'block';

  if (!stats.totalSessions) {
    body.innerHTML = '<div class="empty">Nessun allenamento registrato.<br>Inizia dalla sezione "Allenamento Libero"!</div>';
    return;
  }

  body.innerHTML = `
  <!-- KPI -->
  <div class="grid-4" style="margin-bottom:1.2rem">
    <div class="stat-box">
      <div class="stat-label">Sessioni</div>
      <div class="stat-val">${stats.totalSessions}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Tonnellate</div>
      <div class="stat-val" style="font-size:1.8rem">${(stats.totalVolume/1000).toFixed(1)}</div>
      <div class="stat-unit">volume totale</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Esercizi</div>
      <div class="stat-val">${stats.totalExercisesDone}</div>
      <div class="stat-unit">completati</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Media/Sett.</div>
      <div class="stat-val" style="font-size:1.6rem">${calcAvgWeeklyVolume(stats)}</div>
      <div class="stat-unit">kg volume</div>
    </div>
  </div>

  <!-- VOLUME + SESSIONI stacked su mobile -->
  <div class="card" style="margin-bottom:.8rem">
    <div class="card-title">Volume Settimanale (kg)</div>
    <div style="position:relative;height:180px"><canvas id="chartVolume"></canvas></div>
  </div>
  <div class="card" style="margin-bottom:.8rem">
    <div class="card-title">Sessioni per Settimana</div>
    <div style="position:relative;height:160px"><canvas id="chartSessions"></canvas></div>
  </div>

  <!-- MUSCOLI + PROGRESSIONE -->
  <div class="card" style="margin-bottom:.8rem">
    <div class="card-title">Gruppi Muscolari Allenati</div>
    <div style="position:relative;height:220px"><canvas id="chartMuscles"></canvas></div>
  </div>

  <div class="card" style="margin-bottom:1.2rem">
    <div class="card-title">Progressione Esercizio</div>
    <select class="dd" id="exProgressSel" onchange="renderExerciseProgress()" style="width:100%;margin-bottom:.8rem">
      ${Object.keys(stats.exerciseProgress).map(n => `<option>${n}</option>`).join('')}
    </select>
    <div style="position:relative;height:180px"><canvas id="chartProgress"></canvas></div>
  </div>

  <!-- SESSIONI RECENTI -->
  <div style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:3px;margin-bottom:.8rem">Sessioni Recenti</div>
  ${stats.recentSessions.map(s => recentSessionCard(s)).join('')}`;

  setTimeout(() => {
    renderVolumeChart(stats);
    renderSessionsChart(stats);
    renderMusclesChart(stats);
    window._statsData = stats;
    renderExerciseProgress();
  }, 50);
}

function calcAvgWeeklyVolume(stats) {
  const weeks = Object.values(stats.weeklyData);
  if (!weeks.length) return 0;
  const total = weeks.reduce((s, w) => s + w.volume, 0);
  return Math.round(total / weeks.length).toLocaleString('it-IT');
}

function recentSessionCard(s) {
  const exs     = s.session_exercises || [];
  const done    = exs.filter(e => e.done).length;
  const vol     = exs.reduce((sum,e) => sum+(e.done?(e.serie||0)*(e.reps||0)*(e.weight||0):0), 0);
  const muscles = [...new Set(exs.filter(e=>e.done&&e.muscle_group).map(e=>e.muscle_group))].slice(0,3);
  const muscleColors = {
    'Petto':'#c8f135','Dorsali':'#3d9eff','Gambe':'#ff9f43','Spalle':'#a29bfe',
    'Bicipiti':'#fd79a8','Tricipiti':'#00b894','Addominali':'#ff3d3d','Cardio':'#fdcb6e'
  };
  const pct = exs.length ? Math.round(done/exs.length*100) : 0;
  return `<div class="session-row" onclick="openSessionDetail('${s.id}')">
    <div class="session-row-left">
      <div class="session-date-block">
        <div class="session-day">${new Date(s.session_date+'T00:00:00').getDate()}</div>
        <div class="session-month">${new Date(s.session_date+'T00:00:00').toLocaleDateString('it-IT',{month:'short'})}</div>
      </div>
      <div class="session-info">
        <div class="session-type">${s.is_free?'🆓 Libero':'📋 '+esc(s.template_name||'')}</div>
        <div class="session-muscles">
          ${muscles.map(m=>`<span class="muscle-pill" style="border-color:${muscleColors[m]||'var(--border)'};color:${muscleColors[m]||'var(--muted)'}">${m}</span>`).join('')}
        </div>
      </div>
    </div>
    <div class="session-row-right">
      <div class="session-pct ${pct===100?'done':''}">${pct}%</div>
      ${vol?`<div style="font-size:.6rem;color:var(--muted);text-align:right">${(vol/1000).toFixed(1)}t</div>`:''}
    </div>
  </div>`;
}

// ── VOLUME CHART ──────────────────────────────────────────────
function renderVolumeChart(stats) {
  destroyChart('chartVolume');
  const weeks = Object.keys(stats.weeklyData).sort().slice(-12);
  const data  = weeks.map(w => Math.round(stats.weeklyData[w].volume));
  const ctx   = document.getElementById('chartVolume');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: weeks.map(w => w.split('-W')[1] ? 'Sett. ' + w.split('-W')[1] : w),
      datasets: [{
        label: 'Volume (kg)', data,
        borderColor: CHART_COLORS.accent, backgroundColor: 'rgba(200,241,53,0.1)',
        borderWidth: 2, pointBackgroundColor: CHART_COLORS.accent,
        pointRadius: 4, tension: 0.3, fill: true,
      }]
    },
    options: chartOptions('Volume (kg)')
  });
}

// ── SESSIONS CHART ────────────────────────────────────────────
function renderSessionsChart(stats) {
  destroyChart('chartSessions');
  const weeks = Object.keys(stats.weeklyData).sort().slice(-12);
  const data  = weeks.map(w => stats.weeklyData[w].sessions);
  const ctx   = document.getElementById('chartSessions');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weeks.map(w => 'Sett. ' + (w.split('-W')[1] || w)),
      datasets: [{
        label: 'Sessioni', data,
        backgroundColor: 'rgba(61,158,255,0.5)', borderColor: CHART_COLORS.blue,
        borderWidth: 1, borderRadius: 2,
      }]
    },
    options: chartOptions('Sessioni')
  });
}

// ── MUSCLES CHART ─────────────────────────────────────────────
function renderMusclesChart(stats) {
  destroyChart('chartMuscles');
  const labels = Object.keys(stats.muscleData);
  const data   = Object.values(stats.muscleData);
  const ctx    = document.getElementById('chartMuscles');
  if (!ctx || !labels.length) return;
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data, backgroundColor: CHART_COLORS.muscles,
        borderColor: CHART_COLORS.bg2, borderWidth: 2,
      }]
    },
    options: {
      ...chartOptions(),
      cutout: '60%',
      plugins: {
        legend: { display: true, position: 'right', labels: { color: CHART_COLORS.muted, font: { size: 10 }, boxWidth: 12 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} esercizi` } }
      }
    }
  });
}

// ── EXERCISE PROGRESS CHART ───────────────────────────────────
function renderExerciseProgress() {
  destroyChart('chartProgress');
  if (!window._statsData) return;
  const sel = document.getElementById('exProgressSel');
  if (!sel) return;
  const exName = sel.value;
  const points = (window._statsData.exerciseProgress[exName] || []).sort((a, b) => a.date.localeCompare(b.date));
  const ctx = document.getElementById('chartProgress');
  if (!ctx || !points.length) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: points.map(p => fmtDate(p.date)),
      datasets: [
        {
          label: 'Peso (kg)', data: points.map(p => p.weight),
          borderColor: CHART_COLORS.accent, backgroundColor: 'rgba(200,241,53,0.08)',
          borderWidth: 2, pointBackgroundColor: CHART_COLORS.accent, pointRadius: 4,
          tension: 0.3, fill: true, yAxisID: 'y',
        },
        {
          label: 'Volume (kg)', data: points.map(p => p.volume),
          borderColor: CHART_COLORS.blue, backgroundColor: 'transparent',
          borderWidth: 1.5, pointRadius: 3, borderDash: [4, 4],
          tension: 0.3, yAxisID: 'y1',
        }
      ]
    },
    options: {
      ...chartOptions(),
      scales: {
        x:  { ...chartScaleX() },
        y:  { ...chartScaleY('Peso (kg)', 'left') },
        y1: { ...chartScaleY('Volume', 'right'), grid: { display: false } }
      }
    }
  });
}

// ── CHART DEFAULT OPTIONS ─────────────────────────────────────
function chartOptions(yLabel = '') {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a1a', borderColor: '#252525', borderWidth: 1,
        titleColor: '#e8e8e8', bodyColor: '#555',
        titleFont: { family: "'Barlow Condensed', sans-serif", size: 13, weight: '700' },
        bodyFont:  { family: "'DM Mono', monospace", size: 11 },
      }
    },
    scales: {
      x: chartScaleX(),
      y: chartScaleY(yLabel),
    }
  };
}

function chartScaleX() {
  return {
    ticks: { color: CHART_COLORS.muted, font: { family: "'DM Mono',monospace", size: 9 }, maxRotation: 45 },
    grid:  { color: CHART_COLORS.border },
    border: { color: CHART_COLORS.border }
  };
}

function chartScaleY(label = '', position = 'left') {
  return {
    position, beginAtZero: true,
    ticks: { color: CHART_COLORS.muted, font: { family: "'DM Mono',monospace", size: 9 } },
    grid:  { color: CHART_COLORS.border },
    border: { color: CHART_COLORS.border },
    title: label ? { display: true, text: label, color: CHART_COLORS.muted, font: { size: 9 } } : {}
  };
}

// ── PT CAN SEE CLIENT STATS ───────────────────────────────────
async function renderClientStats(userId) {
  const u = await DB.getUserById(userId);
  if (!u) return;
  const stats = await DB.getStats(userId);
  openModal(`📊 Stats — ${u.nome} ${u.cognome}`, `
  <div class="grid-2" style="margin-bottom:1.2rem">
    <div class="stat-box" style="border:1px solid var(--border)"><div class="stat-label">Sessioni</div><div class="stat-val">${stats.totalSessions}</div></div>
    <div class="stat-box" style="border:1px solid var(--border)"><div class="stat-label">Volume Totale</div><div class="stat-val" style="font-size:1.6rem">${(stats.totalVolume/1000).toFixed(1)}</div><div class="stat-unit">t</div></div>
  </div>
  <div class="card-title">Ultimi allenamenti</div>
  ${stats.recentSessions.slice(0,5).map(s => recentSessionCard(s)).join('') || '<div class="empty">Nessuna sessione</div>'}`, '750px');
}

window.renderStats = renderStats;
window.renderExerciseProgress = renderExerciseProgress;
window.renderClientStats = renderClientStats;
