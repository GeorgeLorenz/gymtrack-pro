// ══════════════════════════════════════════════════════════════
// js/auth.js — Autenticazione
// ══════════════════════════════════════════════════════════════

window.CU = null; // Current User

function hashPwd(p) {
  let h = 0;
  for (let i = 0; i < p.length; i++) h = (h << 5) - h + p.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function genCode() { return String(Math.floor(100000 + Math.random() * 900000)); }

// ── SWITCH TABS ───────────────────────────────────────────────
function switchAuth(t) {
  document.getElementById('loginForm').style.display    = t === 'login'    ? 'block' : 'none';
  document.getElementById('registerForm').style.display = t === 'register' ? 'block' : 'none';
  document.getElementById('tabLogin').classList.toggle('active',    t === 'login');
  document.getElementById('tabRegister').classList.toggle('active', t === 'register');
}

// ── LOGIN ─────────────────────────────────────────────────────
async function login() {
  const email = document.getElementById('lEmail').value.trim().toLowerCase();
  const pwd   = document.getElementById('lPwd').value;
  if (!email || !pwd) { toast('Inserisci email e password', 'error'); return; }
  try {
    const u = await DB.getUserByEmail(email);
    if (!u || u.pwd_hash !== hashPwd(pwd)) { toast('Credenziali errate', 'error'); return; }
    doLogin(u);
  } catch(e) { toast('Errore di accesso', 'error'); console.error(e); }
}

function loginDemo(role) {
  const map  = { admin: 'admin@gym.it', gym: 'palestra@gym.it', pt: 'pt@gym.it', user: 'user@gym.it' };
  const pwds = { admin: 'admin123', gym: 'gym123', pt: 'pt123', user: 'user123' };
  if (!map[role]) return;
  document.getElementById('lEmail').value = map[role];
  document.getElementById('lPwd').value   = pwds[role];
  login();
}

// ── REGISTER ──────────────────────────────────────────────────
async function register() {
  const nome    = document.getElementById('rNome').value.trim();
  const cognome = document.getElementById('rCognome').value.trim();
  const email   = document.getElementById('rEmail').value.trim().toLowerCase();
  const pwd     = document.getElementById('rPwd').value;
  const tel     = document.getElementById('rTel').value.trim();
  const alt     = parseFloat(document.getElementById('rAlt').value)    || 0;
  const peso    = parseFloat(document.getElementById('rPeso').value)   || 0;
  const grasso  = parseFloat(document.getElementById('rGrasso').value) || 0;

  if (!nome || !cognome || !email || !pwd) { toast('Compila i campi obbligatori', 'error'); return; }
  if (pwd.length < 6) { toast('Password minimo 6 caratteri', 'error'); return; }

  try {
    const existing = await DB.getUserByEmail(email);
    if (existing) { toast('Email già registrata', 'error'); return; }
    const users = await DB.getUsers();
    const isFirst = users.length === 0;
    const u = await DB.createUser({
      nome, cognome, email, pwd_hash: hashPwd(pwd),
      ruolo: isFirst ? 'admin' : 'user',
      telefono: tel, altezza: alt, peso, grasso,
      photo_url: '', pt_id: null
    });
    doLogin(u);
    toast('Account creato!', 'success');
  } catch(e) { toast('Errore registrazione', 'error'); console.error(e); }
}

// ── DO LOGIN ──────────────────────────────────────────────────
function doLogin(u) {
  window.CU = u;
  sessionStorage.setItem('gtp_cu', u.id);

  // Set role class on body for CSS theming
  document.body.className = 'role-' + u.ruolo;

  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('landingPage') && (document.getElementById('landingPage').style.display = 'none');
  const app = document.getElementById('appShell');
  app.style.display = 'flex';
  app.style.flexDirection = 'column';

  // Header
  const av = document.getElementById('headerAvatar');
  if (u.photo_url) av.innerHTML = `<img src="${u.photo_url}" alt="">`;
  else av.textContent = (u.nome[0] || '?').toUpperCase();

  document.getElementById('headerName').textContent = u.nome + ' ' + u.cognome;
  const roleMap   = { admin:'🛡 Admin', gym:'🏢 Palestra', pt:'🏋️ PT', user:'👤 Utente' };
  const roleClass = { admin:'role-admin', gym:'role-gym', pt:'role-pt', user:'role-user' };
  document.getElementById('headerBadge').innerHTML =
    `<span class="role-badge ${roleClass[u.ruolo]}">${roleMap[u.ruolo]}</span>`;

  buildNav();
  router('home');
}

// ── LOGOUT ────────────────────────────────────────────────────
function logout() {
  window.CU = null;
  sessionStorage.removeItem('gtp_cu');
  document.getElementById('appShell').style.display = 'none';
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('lEmail').value = '';
  document.getElementById('lPwd').value = '';
}

// ── FORGOT PASSWORD ───────────────────────────────────────────
async function showForgotPassword() {
  openModal('Recupero Password', `
  <div class="fg"><label>La tua Email</label>
    <input class="inp" type="email" id="fpEmail" placeholder="tua@email.com">
  </div>
  <button class="btn-primary btn-full" onclick="sendReset()">Invia Email di Reset</button>`);
}

async function sendReset() {
  const email = (document.getElementById('fpEmail')?.value || '').trim().toLowerCase();
  if (!email) { toast('Inserisci email', 'error'); return; }
  const u = await DB.getUserByEmail(email);
  if (!u) { toast('Email non trovata', 'error'); return; }
  const code = genCode();
  await DB.saveReset(email, code);
  closeModal();
  setTimeout(() => {
    openModal('📧 Email Reset Password (Simulata)', `
    <div class="info-box">In un sistema reale questa email sarebbe inviata a <strong>${email}</strong><br>
    Integra SendGrid o Resend per email reali.</div>
    <div style="background:var(--bg3);border:1px solid var(--border);padding:1.5rem;margin:1rem 0;text-align:center">
      <div style="font-size:0.7rem;color:var(--muted);margin-bottom:0.5rem">Codice di reset · valido 30 minuti</div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:3rem;color:var(--accent);letter-spacing:8px">${code}</div>
    </div>
    <div class="fg"><label>Codice Ricevuto</label><input class="inp" id="resetCode" value="${code}"></div>
    <div class="fg"><label>Nuova Password</label><input class="inp" type="password" id="resetPwd1" placeholder="Min 6 caratteri"></div>
    <div class="fg"><label>Conferma Password</label><input class="inp" type="password" id="resetPwd2"></div>
    <button class="btn-primary btn-full" onclick="doReset('${email}')">Cambia Password</button>`);
  }, 200);
}

async function doReset(email) {
  const code = document.getElementById('resetCode')?.value?.trim();
  const p1   = document.getElementById('resetPwd1')?.value;
  const p2   = document.getElementById('resetPwd2')?.value;
  if (!code) { toast('Inserisci il codice', 'error'); return; }
  const valid = await DB.verifyReset(email, code);
  if (!valid) { toast('Codice non valido o scaduto', 'error'); return; }
  if (!p1 || p1.length < 6) { toast('Password minimo 6 caratteri', 'error'); return; }
  if (p1 !== p2) { toast('Le password non coincidono', 'error'); return; }
  const u = await DB.getUserByEmail(email);
  if (!u) return;
  await DB.updateUser(u.id, { pwd_hash: hashPwd(p1) });
  await DB.consumeReset(email);
  closeModal();
  toast('Password cambiata con successo', 'success');
}

// ── PROFILE PHOTO ─────────────────────────────────────────────
function uploadProfilePhoto(input) {
  const file = input.files[0]; if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('Immagine troppo grande (max 2MB)', 'error'); return; }
  const reader = new FileReader();
  reader.onload = async e => {
    const data = e.target.result;
    await DB.updateUser(window.CU.id, { photo_url: data });
    window.CU.photo_url = data;
    const av = document.getElementById('photoAvatar');
    if (av) av.innerHTML = `<img src="${data}" alt="">`;
    const hAv = document.getElementById('headerAvatar');
    if (hAv) hAv.innerHTML = `<img src="${data}" alt="">`;
    toast('Foto aggiornata', 'success');
  };
  reader.readAsDataURL(file);
}

async function removePhoto() {
  await DB.updateUser(window.CU.id, { photo_url: '' });
  window.CU.photo_url = '';
  const hAv = document.getElementById('headerAvatar');
  if (hAv) hAv.textContent = (window.CU.nome[0] || '?').toUpperCase();
  renderProfile();
  toast('Foto rimossa', 'success');
}

// ── AUTO-LOGIN ────────────────────────────────────────────────
async function tryAutoLogin() {
  const savedId = sessionStorage.getItem('gtp_cu');
  if (!savedId) return false;
  try {
    const u = await DB.getUserById(savedId);
    if (u) { doLogin(u); return true; }
  } catch(e) {}
  return false;
}

window.switchAuth = switchAuth;
window.login = login;
window.loginDemo = loginDemo;
window.register = register;
window.doLogin = doLogin;
window.logout = logout;
window.showForgotPassword = showForgotPassword;
window.sendReset = sendReset;
window.doReset = doReset;
window.uploadProfilePhoto = uploadProfilePhoto;
window.removePhoto = removePhoto;
window.tryAutoLogin = tryAutoLogin;
window.hashPwd = hashPwd;
