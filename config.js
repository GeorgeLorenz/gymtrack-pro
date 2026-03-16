// ══════════════════════════════════════════════════════════════
// js/config.js — Configurazione GymTrack PRO
// ══════════════════════════════════════════════════════════════

// ── SUPABASE CONFIG ──────────────────────────────────────────
// 1. Vai su https://supabase.com e crea un progetto gratuito
// 2. Project Settings → API → copia URL e anon key
// 3. Incollali qui sotto
// 4. Vai su SQL Editor e incolla il contenuto di supabase/schema.sql

window.SUPABASE_URL  = 'YOUR_SUPABASE_URL';   // es: https://xxxxx.supabase.co
window.SUPABASE_KEY  = 'YOUR_SUPABASE_ANON_KEY'; // chiave pubblica anon

// ── APP CONSTANTS ────────────────────────────────────────────
window.APP_VERSION = '2.0.0';
window.APP_NAME    = 'GymTrack PRO';

window.DAYS  = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
window.DKEYS = ['lun','mar','mer','gio','ven','sab','dom'];

window.MUSCLES = ['Petto','Bicipiti','Tricipiti','Spalle','Dorsali','Gambe','Addominali','Cardio'];

window.MUSCLES_EMOJI = {
  Petto:'💪', Bicipiti:'🦾', Tricipiti:'⚡', Spalle:'🏔️',
  Dorsali:'🔱', Gambe:'🦵', Addominali:'🔥', Cardio:'❤️'
};

window.ACTIVITIES = [
  'Pilates','Fit Boxe','Spinning','Kickboxe','Karate',
  'Corpo Libero','Aerobica','Zumba','GAG','CrossFit',
  'Yoga','TRX','Functional Training','Nuoto','Boxe'
];

window.WEIGHT_OPTS = [];
for(let w = 0; w <= 200; w += 0.5)
  window.WEIGHT_OPTS.push(Math.round(w * 10) / 10);

window.SERIE_OPTS = [1,2,3,4,5,6,7,8,10,12];
window.REPS_OPTS  = [1,2,3,4,5,6,7,8,9,10,11,12,15,20,25,30,40,50];

window.NAVS = {
  admin: [{id:'home',l:'Dashboard'},{id:'users',l:'Utenti'},{id:'pts',l:'PT'},{id:'exercises',l:'Esercizi'},{id:'gym',l:'Palestra'},{id:'profile',l:'Profilo'}],
  gym:   [{id:'home',l:'Dashboard'},{id:'rooms',l:'Sale'},{id:'room_cal',l:'Calendario'},{id:'pts',l:'PT'},{id:'gym',l:'Profilo Palestra'},{id:'profile',l:'Profilo'}],
  pt:    [{id:'home',l:'Dashboard'},{id:'clients',l:'Clienti'},{id:'exercises',l:'Esercizi'},{id:'templates',l:'Schede'},{id:'assign',l:'Assegna'},{id:'feedback',l:'Feedback'},{id:'profile',l:'Profilo'}],
  user:  [{id:'home',l:'Dashboard'},{id:'free_workout',l:'Allenamento Libero'},{id:'today',l:'Scheda Oggi'},{id:'calendar',l:'Calendario'},{id:'stats',l:'Statistiche'},{id:'history',l:'Storico'},{id:'profile',l:'Profilo'}],
};

// Esercizi di default
window.DEFAULT_EXERCISES = [
  // ── PETTO ───────────────────────────────────────────────
  {name:'Spinte Panca Piana',       muscle_group:'Petto', emoji:'🏋️', description:'Spinte con manubri su panca piana',           is_default:true, image_url:'', video_url:''},
  {name:'Spinte Panca Inclinata',   muscle_group:'Petto', emoji:'📐', description:'Spinte con manubri su panca inclinata',       is_default:true, image_url:'', video_url:''},
  {name:'Bilancere Panca Piana',    muscle_group:'Petto', emoji:'🔩', description:'Panca piana con bilanciere',                  is_default:true, image_url:'', video_url:''},
  {name:'Bilancere Panca Inclinata',muscle_group:'Petto', emoji:'📏', description:'Panca inclinata con bilanciere',              is_default:true, image_url:'', video_url:''},
  {name:'Croci Panca Inclinata',    muscle_group:'Petto', emoji:'✈️', description:'Croci con manubri su panca inclinata',       is_default:true, image_url:'', video_url:''},
  {name:'Croci Panca Piana',        muscle_group:'Petto', emoji:'🕊️', description:'Croci con manubri su panca piana',           is_default:true, image_url:'', video_url:''},
  {name:'Multipower',               muscle_group:'Petto', emoji:'🔧', description:'Panca con Multipower / Smith Machine',       is_default:true, image_url:'', video_url:''},
  {name:'Pectoral Machine',         muscle_group:'Petto', emoji:'🤜', description:'Macchina per il petto',                      is_default:true, image_url:'', video_url:''},
  {name:'Cavi Petto',               muscle_group:'Petto', emoji:'🔗', description:'Croci ai cavi bassi o alti',                 is_default:true, image_url:'', video_url:''},
  // ── DORSALI ─────────────────────────────────────────────
  {name:'Lat Machine Avanti',       muscle_group:'Dorsali', emoji:'🎰', description:'Lat pulldown presa larga avanti',          is_default:true, image_url:'', video_url:''},
  {name:'Lat Machine Inversa',      muscle_group:'Dorsali', emoji:'🔄', description:'Lat pulldown presa inversa',               is_default:true, image_url:'', video_url:''},
  {name:'Pulley Basso Rematore',    muscle_group:'Dorsali', emoji:'🚣', description:'Rematore al pulley basso seduto',          is_default:true, image_url:'', video_url:''},
  {name:'Verticale Row',            muscle_group:'Dorsali', emoji:'⬆️', description:'Rematore verticale',                      is_default:true, image_url:'', video_url:''},
  {name:'Pull Over',                muscle_group:'Dorsali', emoji:'🌊', description:'Pull over con manubrio o bilanciere',      is_default:true, image_url:'', video_url:''},
  {name:'Trazioni alla Sbarra',     muscle_group:'Dorsali', emoji:'🏗️', description:'Pull-up a corpo libero',                  is_default:true, image_url:'', video_url:''},
  {name:'Low Row',                  muscle_group:'Dorsali', emoji:'🔱', description:'Rematore basso in macchina',               is_default:true, image_url:'', video_url:''},
  // ── SPALLE ──────────────────────────────────────────────
  {name:'Military Press',           muscle_group:'Spalle', emoji:'🪖', description:'Lento avanti con bilanciere',              is_default:true, image_url:'', video_url:''},
  {name:'Alzate Verticali',         muscle_group:'Spalle', emoji:'☝️', description:'Alzate con manubri sopra la testa',        is_default:true, image_url:'', video_url:''},
  {name:'Alzate Laterali',          muscle_group:'Spalle', emoji:'↔️', description:'Deltoide laterale con manubri',            is_default:true, image_url:'', video_url:''},
  {name:'Alzate Frontali',          muscle_group:'Spalle', emoji:'⬆️', description:'Deltoide anteriore con manubri',           is_default:true, image_url:'', video_url:''},
  {name:'Vertical Row Spalle',      muscle_group:'Spalle', emoji:'🔝', description:'Rematore verticale per le spalle',         is_default:true, image_url:'', video_url:''},
  {name:'Aperture Prono',           muscle_group:'Spalle', emoji:'🦅', description:'Alzate posteriori prono su panca',         is_default:true, image_url:'', video_url:''},
  {name:'Shoulder Press',           muscle_group:'Spalle', emoji:'🏔️', description:'Shoulder press in macchina',              is_default:true, image_url:'', video_url:''},
  {name:'Deltoid Machine',          muscle_group:'Spalle', emoji:'⚙️', description:'Macchina per i deltoidi',                  is_default:true, image_url:'', video_url:''},
  {name:'Trazioni al Mento',        muscle_group:'Spalle', emoji:'🧲', description:'Upright row con bilanciere o manubri',     is_default:true, image_url:'', video_url:''},
  // ── BICIPITI ─────────────────────────────────────────────
  {name:'Curl con Bilanciere',      muscle_group:'Bicipiti', emoji:'🦾', description:'Curl bilanciere in piedi',               is_default:true, image_url:'', video_url:''},
  {name:'Curl Manubri',             muscle_group:'Bicipiti', emoji:'💪', description:'Curl alternato con manubri',             is_default:true, image_url:'', video_url:''},
  {name:'Curl Larry Scott',         muscle_group:'Bicipiti', emoji:'📐', description:'Curl su panca Scott',                    is_default:true, image_url:'', video_url:''},
  {name:'Curl Pulley Basso',        muscle_group:'Bicipiti', emoji:'🔗', description:'Curl al cavo basso',                     is_default:true, image_url:'', video_url:''},
  {name:'Concentrate Manubrio',     muscle_group:'Bicipiti', emoji:'🎯', description:'Curl concentrato con manubrio',          is_default:true, image_url:'', video_url:''},
  // ── TRICIPITI ─────────────────────────────────────────────
  {name:'Spinte in Basso',          muscle_group:'Tricipiti', emoji:'⬇️', description:'Pushdown al cavo alto',                is_default:true, image_url:'', video_url:''},
  {name:'French Press',             muscle_group:'Tricipiti', emoji:'🇫🇷', description:'French press con bilanciere',          is_default:true, image_url:'', video_url:''},
  {name:'French Press Manubrio',    muscle_group:'Tricipiti', emoji:'🔨', description:'French press con manubrio',             is_default:true, image_url:'', video_url:''},
  {name:'Dips',                     muscle_group:'Tricipiti', emoji:'🔻', description:'Parallele a corpo libero',              is_default:true, image_url:'', video_url:''},
  // ── GAMBE ─────────────────────────────────────────────────
  {name:'Leg Press',                muscle_group:'Gambe', emoji:'🦾', description:'Leg press orizzontale',                    is_default:true, image_url:'', video_url:''},
  {name:'Pressa 45°',               muscle_group:'Gambe', emoji:'↗️', description:'Pressa a 45 gradi',                       is_default:true, image_url:'', video_url:''},
  {name:'Leg Extensions',           muscle_group:'Gambe', emoji:'⬆️', description:'Estensioni delle gambe in macchina',      is_default:true, image_url:'', video_url:''},
  {name:'Affondi',                  muscle_group:'Gambe', emoji:'🚶', description:'Affondi con manubri o bilanciere',         is_default:true, image_url:'', video_url:''},
  {name:'Squat',                    muscle_group:'Gambe', emoji:'🦵', description:'Squat con bilanciere',                    is_default:true, image_url:'', video_url:''},
  {name:'Hack Squat',               muscle_group:'Gambe', emoji:'🔩', description:'Squat in macchina Hack',                  is_default:true, image_url:'', video_url:''},
  {name:'Adduttori',                muscle_group:'Gambe', emoji:'🤸', description:'Macchina adduttori',                      is_default:true, image_url:'', video_url:''},
  {name:'Seated Leg Curl',          muscle_group:'Gambe', emoji:'🔄', description:'Leg curl seduto in macchina',             is_default:true, image_url:'', video_url:''},
  {name:'Calf Seduti',              muscle_group:'Gambe', emoji:'👣', description:'Calf raise seduto in macchina',           is_default:true, image_url:'', video_url:''},
  {name:'Calf in Piedi',            muscle_group:'Gambe', emoji:'👟', description:'Calf raise in piedi',                    is_default:true, image_url:'', video_url:''},
  {name:'Standing Gluteus',         muscle_group:'Gambe', emoji:'🍑', description:'Glutei in piedi al cavo',                is_default:true, image_url:'', video_url:''},
  // ── ADDOMINALI ────────────────────────────────────────────
  {name:'Sit Up',                   muscle_group:'Addominali', emoji:'💥', description:'Sit up classico',                    is_default:true, image_url:'', video_url:''},
  {name:'Crunch',                   muscle_group:'Addominali', emoji:'🔥', description:'Crunch a terra',                     is_default:true, image_url:'', video_url:''},
  {name:'Crunch Machine',           muscle_group:'Addominali', emoji:'⚙️', description:'Crunch in macchina',                 is_default:true, image_url:'', video_url:''},
  {name:'Crunch Parallele',         muscle_group:'Addominali', emoji:'🏗️', description:'Crunch alle parallele con ginocchia', is_default:true, image_url:'', video_url:''},
  {name:'Reverse Crunch',           muscle_group:'Addominali', emoji:'🔃', description:'Crunch inverso per addominali bassi', is_default:true, image_url:'', video_url:''},
  {name:'Hyperextension',           muscle_group:'Addominali', emoji:'🌉', description:'Iperestensioni per lombari',          is_default:true, image_url:'', video_url:''},
  // ── CARDIO ────────────────────────────────────────────────
  {name:'Cycle',                    muscle_group:'Cardio', emoji:'🚴', description:'Bici da spinning verticale',             is_default:true, image_url:'', video_url:''},
  {name:'Cycle Orizzontale',        muscle_group:'Cardio', emoji:'🛋️', description:'Bici reclinata orizzontale',             is_default:true, image_url:'', video_url:''},
  {name:'Ellittica',                muscle_group:'Cardio', emoji:'♾️', description:'Ellittica low impact',                   is_default:true, image_url:'', video_url:''},
  {name:'Tappeto',                  muscle_group:'Cardio', emoji:'🏃', description:'Tapis roulant',                          is_default:true, image_url:'', video_url:''},
  {name:'Corsa',                    muscle_group:'Cardio', emoji:'👟', description:'Corsa libera o su pista',                is_default:true, image_url:'', video_url:''},
  {name:'Camminata',                muscle_group:'Cardio', emoji:'🚶', description:'Camminata veloce',                       is_default:true, image_url:'', video_url:''},
];
