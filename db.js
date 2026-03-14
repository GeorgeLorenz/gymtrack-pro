// ══════════════════════════════════════════════════════════════
// js/db.js — Data Layer (localStorage + Supabase adapter)
// L'app funziona offline con localStorage.
// Quando configuri Supabase in config.js, i dati vengono salvati nel cloud.
// ══════════════════════════════════════════════════════════════

const USE_SUPABASE = () =>
  window.SUPABASE_URL && window.SUPABASE_URL !== 'YOUR_SUPABASE_URL' && window.sbClient;

// ── INIZIALIZZA SUPABASE ─────────────────────────────────────
function initSupabase() {
  if (!window.SUPABASE_URL || window.SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    console.warn('⚠️ Supabase non configurato — uso localStorage');
    return;
  }
  if (!window.supabase) {
    console.error('❌ Libreria Supabase non caricata (CDN fallito?)');
    return;
  }
  try {
    window.sbClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
    console.log('✅ Supabase connesso a', window.SUPABASE_URL);
    // Test rapido di connessione
    window.sbClient.from('profiles').select('count', {count:'exact',head:true})
      .then(({error}) => {
        if (error) console.error('❌ Supabase errore DB:', error.message);
        else console.log('✅ Supabase DB raggiungibile');
      });
  } catch(e) {
    console.error('❌ Supabase createClient fallito:', e);
  }
}

// ── HELPERS localStorage ─────────────────────────────────────
const LS = {
  get: k => { try { return JSON.parse(localStorage.getItem('gtp_'+k) || 'null'); } catch(e){ return null; } },
  set: (k, v) => localStorage.setItem('gtp_'+k, JSON.stringify(v)),
  del: k => localStorage.removeItem('gtp_'+k),
};

function lsGet(table)        { return LS.get(table) || []; }
function lsSet(table, arr)   { LS.set(table, arr); }
function lsGym()             { return LS.get('gym') || {}; }
function lsSetGym(g)         { LS.set('gym', g); }

function uid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

// ── SEED DATI DEFAULT ────────────────────────────────────────
async function seedDefaultData() {
  let exs = lsGet('exercises');
  if (!exs.length) {
    exs = window.DEFAULT_EXERCISES.map(e => ({ ...e, id: uid(), created_at: new Date().toISOString() }));
    lsSet('exercises', exs);
  }
  if (!lsGym().name) {
    lsSetGym({ id: uid(), name: 'La Mia Palestra', logo_url:'', address:'', phone:'', email:'', vat_id:'', description:'' });
  }
}

// ══════════════════════════════════════════════════════════════
// PROFILES
// ══════════════════════════════════════════════════════════════
const DB = {

  // ── USERS ─────────────────────────────────────────────────
  async getUsers() {
    if (USE_SUPABASE()) {
      const { data } = await window.sbClient.from('profiles').select('*').order('created_at');
      return data || [];
    }
    return lsGet('profiles');
  },

  async getUserById(id) {
    const users = await this.getUsers();
    return users.find(u => u.id === id) || null;
  },

  async getUserByEmail(email) {
    const users = await this.getUsers();
    return users.find(u => u.email === email.toLowerCase()) || null;
  },

  async createUser(data) {
    if (USE_SUPABASE()) {
      const { data: row, error } = await window.sbClient.from('profiles').insert(data).select().single();
      if (error) throw error;
      return row;
    }
    const users = lsGet('profiles');
    const row = { ...data, id: uid(), created_at: new Date().toISOString() };
    users.push(row); lsSet('profiles', users);
    return row;
  },

  async updateUser(id, data) {
    if (USE_SUPABASE()) {
      const { data: row, error } = await window.sbClient.from('profiles').update(data).eq('id', id).select().single();
      if (error) throw error;
      return row;
    }
    const users = lsGet('profiles');
    const i = users.findIndex(u => u.id === id);
    if (i >= 0) { users[i] = { ...users[i], ...data }; lsSet('profiles', users); return users[i]; }
    return null;
  },

  async deleteUser(id) {
    if (USE_SUPABASE()) {
      await window.sbClient.from('profiles').delete().eq('id', id);
      return;
    }
    lsSet('profiles', lsGet('profiles').filter(u => u.id !== id));
  },

  // ── GYM ───────────────────────────────────────────────────
  async getGym() {
    if (USE_SUPABASE()) {
      const { data } = await window.sbClient.from('gym_profile').select('*').limit(1).single();
      return data || {};
    }
    return lsGym();
  },

  async saveGym(data) {
    if (USE_SUPABASE()) {
      const gym = await this.getGym();
      if (gym.id) {
        await window.sbClient.from('gym_profile').update(data).eq('id', gym.id);
      } else {
        await window.sbClient.from('gym_profile').insert(data);
      }
      return;
    }
    lsSetGym({ ...lsGym(), ...data });
  },

  // ── EXERCISES ─────────────────────────────────────────────
  async getExercises() {
    if (USE_SUPABASE()) {
      const { data } = await window.sbClient.from('exercises').select('*').order('muscle_group').order('name');
      return data || [];
    }
    return lsGet('exercises');
  },

  async createExercise(data) {
    if (USE_SUPABASE()) {
      const { data: row } = await window.sbClient.from('exercises').insert(data).select().single();
      return row;
    }
    const exs = lsGet('exercises');
    const row = { ...data, id: uid(), created_at: new Date().toISOString() };
    exs.push(row); lsSet('exercises', exs); return row;
  },

  async updateExercise(id, data) {
    if (USE_SUPABASE()) {
      await window.sbClient.from('exercises').update(data).eq('id', id);
      return;
    }
    const exs = lsGet('exercises');
    const i = exs.findIndex(e => e.id === id);
    if (i >= 0) { exs[i] = { ...exs[i], ...data }; lsSet('exercises', exs); }
  },

  async deleteExercise(id) {
    if (USE_SUPABASE()) {
      await window.sbClient.from('exercises').delete().eq('id', id);
      return;
    }
    lsSet('exercises', lsGet('exercises').filter(e => e.id !== id));
  },

  // ── TEMPLATES ─────────────────────────────────────────────
  async getTemplates(ptId) {
    if (USE_SUPABASE()) {
      let q = window.sbClient.from('workout_templates').select('*');
      if (ptId) q = q.eq('pt_id', ptId);
      const { data } = await q.order('created_at', { ascending: false });
      return data || [];
    }
    const all = lsGet('templates');
    return ptId ? all.filter(t => t.pt_id === ptId) : all;
  },

  async createTemplate(data) {
    if (USE_SUPABASE()) {
      const { data: row } = await window.sbClient.from('workout_templates').insert(data).select().single();
      return row;
    }
    const tpls = lsGet('templates');
    const row = { ...data, id: uid(), created_at: new Date().toISOString() };
    tpls.push(row); lsSet('templates', tpls); return row;
  },

  async updateTemplate(id, data) {
    if (USE_SUPABASE()) {
      await window.sbClient.from('workout_templates').update(data).eq('id', id);
      return;
    }
    const tpls = lsGet('templates');
    const i = tpls.findIndex(t => t.id === id);
    if (i >= 0) { tpls[i] = { ...tpls[i], ...data }; lsSet('templates', tpls); }
  },

  async deleteTemplate(id) {
    if (USE_SUPABASE()) {
      await window.sbClient.from('workout_templates').delete().eq('id', id);
      return;
    }
    lsSet('templates', lsGet('templates').filter(t => t.id !== id));
  },

  // ── ASSIGNMENTS ───────────────────────────────────────────
  async getAssignments(filter = {}) {
    if (USE_SUPABASE()) {
      let q = window.sbClient.from('workout_assignments').select('*');
      if (filter.userId) q = q.eq('user_id', filter.userId);
      if (filter.ptId)   q = q.eq('pt_id', filter.ptId);
      const { data } = await q;
      return data || [];
    }
    let all = lsGet('assignments');
    if (filter.userId) all = all.filter(a => a.user_id === filter.userId);
    if (filter.ptId)   all = all.filter(a => a.pt_id   === filter.ptId);
    return all;
  },

  async upsertAssignment(data) {
    if (USE_SUPABASE()) {
      const existing = await this.getAssignments({ userId: data.user_id, ptId: data.pt_id });
      if (existing.length) {
        await window.sbClient.from('workout_assignments').update(data).eq('id', existing[0].id);
        return { ...existing[0], ...data };
      }
      const { data: row } = await window.sbClient.from('workout_assignments').insert(data).select().single();
      return row;
    }
    const all = lsGet('assignments');
    const i = all.findIndex(a => a.user_id === data.user_id && a.pt_id === data.pt_id);
    if (i >= 0) { all[i] = { ...all[i], ...data }; lsSet('assignments', all); return all[i]; }
    const row = { ...data, id: uid(), created_at: new Date().toISOString() };
    all.push(row); lsSet('assignments', all); return row;
  },

  async deleteAssignment(id) {
    if (USE_SUPABASE()) {
      await window.sbClient.from('workout_assignments').delete().eq('id', id);
      return;
    }
    lsSet('assignments', lsGet('assignments').filter(a => a.id !== id));
  },

  // ── SESSIONS ──────────────────────────────────────────────
  async getSessions(userId, limit = 100) {
    if (USE_SUPABASE()) {
      const { data } = await window.sbClient
        .from('workout_sessions')
        .select('*, session_exercises(*)')
        .eq('user_id', userId)
        .order('session_date', { ascending: false })
        .limit(limit);
      return data || [];
    }
    const sessions = lsGet('sessions').filter(s => s.user_id === userId)
      .sort((a, b) => b.session_date.localeCompare(a.session_date))
      .slice(0, limit);
    const exs = lsGet('session_exercises');
    return sessions.map(s => ({ ...s, session_exercises: exs.filter(e => e.session_id === s.id) }));
  },

  async getSessionByDate(userId, date) {
    if (USE_SUPABASE()) {
      const { data } = await window.sbClient
        .from('workout_sessions')
        .select('*, session_exercises(*)')
        .eq('user_id', userId)
        .eq('session_date', date)
        .maybeSingle();
      return data;
    }
    const s = lsGet('sessions').find(s => s.user_id === userId && s.session_date === date);
    if (!s) return null;
    const exs = lsGet('session_exercises').filter(e => e.session_id === s.id);
    return { ...s, session_exercises: exs };
  },

  async createSession(data) {
    if (USE_SUPABASE()) {
      const { data: row } = await window.sbClient.from('workout_sessions').insert(data).select().single();
      return row;
    }
    const sessions = lsGet('sessions');
    const row = { ...data, id: uid(), created_at: new Date().toISOString() };
    sessions.push(row); lsSet('sessions', sessions); return row;
  },

  async updateSession(id, data) {
    if (USE_SUPABASE()) {
      await window.sbClient.from('workout_sessions').update(data).eq('id', id);
      return;
    }
    const sessions = lsGet('sessions');
    const i = sessions.findIndex(s => s.id === id);
    if (i >= 0) { sessions[i] = { ...sessions[i], ...data }; lsSet('sessions', sessions); }
  },

  async deleteSession(id) {
    if (USE_SUPABASE()) {
      await window.sbClient.from('workout_sessions').delete().eq('id', id);
      return;
    }
    lsSet('sessions', lsGet('sessions').filter(s => s.id !== id));
    lsSet('session_exercises', lsGet('session_exercises').filter(e => e.session_id !== id));
  },

  // ── SESSION EXERCISES ─────────────────────────────────────
  async getSessionExercises(sessionId) {
    if (USE_SUPABASE()) {
      const { data } = await window.sbClient
        .from('session_exercises').select('*').eq('session_id', sessionId).order('sort_order');
      return data || [];
    }
    return lsGet('session_exercises').filter(e => e.session_id === sessionId);
  },

  async upsertSessionExercise(data) {
    if (USE_SUPABASE()) {
      if (data.id) {
        await window.sbClient.from('session_exercises').update(data).eq('id', data.id);
        return data;
      }
      const { data: row } = await window.sbClient.from('session_exercises').insert(data).select().single();
      return row;
    }
    const exs = lsGet('session_exercises');
    if (data.id) {
      const i = exs.findIndex(e => e.id === data.id);
      if (i >= 0) { exs[i] = { ...exs[i], ...data }; lsSet('session_exercises', exs); return exs[i]; }
    }
    const row = { ...data, id: uid() };
    exs.push(row); lsSet('session_exercises', exs); return row;
  },

  async deleteSessionExercise(id) {
    if (USE_SUPABASE()) {
      await window.sbClient.from('session_exercises').delete().eq('id', id);
      return;
    }
    lsSet('session_exercises', lsGet('session_exercises').filter(e => e.id !== id));
  },

  // ── ROOMS ─────────────────────────────────────────────────
  async getRooms() {
    if (USE_SUPABASE()) {
      const { data } = await window.sbClient.from('rooms').select('*').order('name');
      return data || [];
    }
    return lsGet('rooms');
  },

  async createRoom(data) {
    if (USE_SUPABASE()) {
      const { data: row } = await window.sbClient.from('rooms').insert(data).select().single();
      return row;
    }
    const rooms = lsGet('rooms');
    const row = { ...data, id: uid(), created_at: new Date().toISOString() };
    rooms.push(row); lsSet('rooms', rooms); return row;
  },

  async updateRoom(id, data) {
    if (USE_SUPABASE()) {
      await window.sbClient.from('rooms').update(data).eq('id', id);
      return;
    }
    const rooms = lsGet('rooms');
    const i = rooms.findIndex(r => r.id === id);
    if (i >= 0) { rooms[i] = { ...rooms[i], ...data }; lsSet('rooms', rooms); }
  },

  async deleteRoom(id) {
    if (USE_SUPABASE()) {
      await window.sbClient.from('rooms').delete().eq('id', id);
      return;
    }
    lsSet('rooms', lsGet('rooms').filter(r => r.id !== id));
    const rs = LS.get('room_sched') || {};
    delete rs[id]; LS.set('room_sched', rs);
  },

  // ── ROOM SCHEDULE ─────────────────────────────────────────
  async getRoomSched(roomId) {
    if (USE_SUPABASE()) {
      const { data } = await window.sbClient.from('room_events').select('*').eq('room_id', roomId).order('event_time');
      const sched = { lun:[], mar:[], mer:[], gio:[], ven:[], sab:[], dom:[] };
      (data || []).forEach(e => { if (sched[e.day_key]) sched[e.day_key].push(e); });
      return sched;
    }
    const rs = LS.get('room_sched') || {};
    return rs[roomId] || { lun:[], mar:[], mer:[], gio:[], ven:[], sab:[], dom:[] };
  },

  async addRoomEvent(data) {
    if (USE_SUPABASE()) {
      const { data: row } = await window.sbClient.from('room_events').insert(data).select().single();
      return row;
    }
    const rs = LS.get('room_sched') || {};
    if (!rs[data.room_id]) rs[data.room_id] = { lun:[], mar:[], mer:[], gio:[], ven:[], sab:[], dom:[] };
    const row = { ...data, id: uid() };
    rs[data.room_id][data.day_key].push(row);
    LS.set('room_sched', rs); return row;
  },

  async deleteRoomEvent(roomId, eventId) {
    if (USE_SUPABASE()) {
      await window.sbClient.from('room_events').delete().eq('id', eventId);
      return;
    }
    const rs = LS.get('room_sched') || {};
    if (rs[roomId]) {
      window.DKEYS.forEach(dk => {
        if (rs[roomId][dk]) rs[roomId][dk] = rs[roomId][dk].filter(e => e.id !== eventId);
      });
      LS.set('room_sched', rs);
    }
  },

  // ── STATISTICHE ───────────────────────────────────────────
  async getStats(userId) {
    const sessions = await this.getSessions(userId, 365);
    const now = new Date();
    const stats = {
      totalSessions: sessions.length,
      totalVolume: 0,
      totalExercisesDone: 0,
      weeklyData: {},    // {week: {volume, sessions, exercises}}
      muscleData: {},    // {muscle: count}
      exerciseProgress: {}, // {name: [{date, weight, volume}]}
      recentSessions: sessions.slice(0, 10),
    };

    sessions.forEach(s => {
      const exs = s.session_exercises || [];
      const week = getWeekKey(s.session_date);
      if (!stats.weeklyData[week]) stats.weeklyData[week] = { volume: 0, sessions: 0, exercises: 0 };
      stats.weeklyData[week].sessions++;

      exs.forEach(e => {
        if (!e.done) return;
        stats.totalExercisesDone++;
        const vol = (e.serie||0) * (e.reps||0) * (e.weight||0);
        stats.totalVolume += vol;
        stats.weeklyData[week].volume += vol;
        stats.weeklyData[week].exercises++;

        const mg = e.muscle_group || 'Altro';
        stats.muscleData[mg] = (stats.muscleData[mg] || 0) + 1;

        const ename = e.exercise_name;
        if (!stats.exerciseProgress[ename]) stats.exerciseProgress[ename] = [];
        stats.exerciseProgress[ename].push({ date: s.session_date, weight: e.weight, volume: vol });
      });
    });

    return stats;
  },

  // ── PASSWORD RESET ────────────────────────────────────────
  async saveReset(email, code) {
    if (USE_SUPABASE()) {
      await window.sbClient.from('password_resets').insert({
        email, code, expires_at: new Date(Date.now() + 30 * 60000).toISOString()
      });
      return;
    }
    const r = LS.get('resets') || {};
    r[email] = { code, exp: Date.now() + 30 * 60000 };
    LS.set('resets', r);
  },

  async verifyReset(email, code) {
    if (USE_SUPABASE()) {
      const { data } = await window.sbClient.from('password_resets')
        .select('*').eq('email', email).eq('code', code).eq('used', false)
        .gte('expires_at', new Date().toISOString()).single();
      return !!data;
    }
    const r = LS.get('resets') || {};
    return r[email] && r[email].code === code && Date.now() < r[email].exp;
  },

  async consumeReset(email) {
    if (USE_SUPABASE()) {
      await window.sbClient.from('password_resets').update({ used: true }).eq('email', email);
      return;
    }
    const r = LS.get('resets') || {};
    delete r[email]; LS.set('resets', r);
  },
};

// ── UTILS ─────────────────────────────────────────────────────
function getWeekKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return d.getFullYear() + '-W' + Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

window.DB = DB;
window.uid = uid;
window.lsGet = lsGet;
window.lsSet = lsSet;
window.initSupabase = initSupabase;
window.seedDefaultData = seedDefaultData;
window.getWeekKey = getWeekKey;
