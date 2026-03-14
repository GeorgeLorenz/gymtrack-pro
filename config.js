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

// Esercizi di default (caricati se DB è vuoto)
window.DEFAULT_EXERCISES = [
  {name:'Panca Piana',muscle_group:'Petto',emoji:'🏋️',description:'Esercizio base per il petto',is_default:true},
  {name:'Panca Inclinata',muscle_group:'Petto',emoji:'📐',description:'Enfasi sul petto superiore',is_default:true},
  {name:'Panca Declinata',muscle_group:'Petto',emoji:'📉',description:'Enfasi sul petto inferiore',is_default:true},
  {name:'Croci con Manubri',muscle_group:'Petto',emoji:'✈️',description:'Isolamento petto',is_default:true},
  {name:'Push-up',muscle_group:'Petto',emoji:'💪',description:'A corpo libero',is_default:true},
  {name:'Dips',muscle_group:'Petto',emoji:'⬇️',description:'Parallele',is_default:true},
  {name:'Curl con Bilanciere',muscle_group:'Bicipiti',emoji:'🦾',description:'Mass builder',is_default:true},
  {name:'Curl con Manubri',muscle_group:'Bicipiti',emoji:'💪',description:'Alternato o simultaneo',is_default:true},
  {name:'Hammer Curl',muscle_group:'Bicipiti',emoji:'🔨',description:'Brachioradiale',is_default:true},
  {name:'Curl su Panca Scott',muscle_group:'Bicipiti',emoji:'📏',description:'Isolamento bicipiti',is_default:true},
  {name:'Curl Concentrato',muscle_group:'Bicipiti',emoji:'🎯',description:'Picco bicipite',is_default:true},
  {name:'Estensioni Tricipiti',muscle_group:'Tricipiti',emoji:'⬆️',description:'Cavo o bilanciere SZ',is_default:true},
  {name:'Skull Crusher',muscle_group:'Tricipiti',emoji:'💀',description:'Con bilanciere',is_default:true},
  {name:'French Press',muscle_group:'Tricipiti',emoji:'🇫🇷',description:'Mass builder tricipiti',is_default:true},
  {name:'Pushdown ai Cavi',muscle_group:'Tricipiti',emoji:'🔗',description:'Isolamento tricipiti',is_default:true},
  {name:'Lento Avanti',muscle_group:'Spalle',emoji:'🏔️',description:'Overhead press',is_default:true},
  {name:'Alzate Laterali',muscle_group:'Spalle',emoji:'↔️',description:'Deltoide laterale',is_default:true},
  {name:'Alzate Frontali',muscle_group:'Spalle',emoji:'⬆️',description:'Deltoide anteriore',is_default:true},
  {name:'Face Pull',muscle_group:'Spalle',emoji:'😤',description:'Deltoide posteriore',is_default:true},
  {name:'Arnold Press',muscle_group:'Spalle',emoji:'🤜',description:'Full range spalle',is_default:true},
  {name:'Trazioni',muscle_group:'Dorsali',emoji:'🔱',description:'Pull-up corpo libero',is_default:true},
  {name:'Lat Machine',muscle_group:'Dorsali',emoji:'🎰',description:'Lat pulldown',is_default:true},
  {name:'Rematore con Bilanciere',muscle_group:'Dorsali',emoji:'🚣',description:'Massa dorsali',is_default:true},
  {name:'Rematore con Manubrio',muscle_group:'Dorsali',emoji:'💪',description:'Unilaterale',is_default:true},
  {name:'Stacco da Terra',muscle_group:'Dorsali',emoji:'🏗️',description:'Compound totale',is_default:true},
  {name:'Squat',muscle_group:'Gambe',emoji:'🦵',description:'Re degli esercizi',is_default:true},
  {name:'Leg Press',muscle_group:'Gambe',emoji:'🦾',description:'Quadricipiti',is_default:true},
  {name:'Affondi',muscle_group:'Gambe',emoji:'🚶',description:'Quadricipiti e glutei',is_default:true},
  {name:'Romanian Deadlift',muscle_group:'Gambe',emoji:'🏋️',description:'Femorali e glutei',is_default:true},
  {name:'Hip Thrust',muscle_group:'Gambe',emoji:'🍑',description:'Glutei',is_default:true},
  {name:'Leg Extension',muscle_group:'Gambe',emoji:'⬆️',description:'Isolamento quadricipiti',is_default:true},
  {name:'Leg Curl',muscle_group:'Gambe',emoji:'🔄',description:'Isolamento femorali',is_default:true},
  {name:'Calf Raises',muscle_group:'Gambe',emoji:'👟',description:'Polpacci',is_default:true},
  {name:'Plank',muscle_group:'Addominali',emoji:'🔥',description:'Core stability',is_default:true},
  {name:'Crunch',muscle_group:'Addominali',emoji:'💥',description:'Retto addominale',is_default:true},
  {name:'Leg Raises',muscle_group:'Addominali',emoji:'⬆️',description:'Addominali bassi',is_default:true},
  {name:'Russian Twist',muscle_group:'Addominali',emoji:'🔄',description:'Obliqui',is_default:true},
  {name:'Ab Wheel',muscle_group:'Addominali',emoji:'☸️',description:'Core totale',is_default:true},
  {name:'Tapis Roulant',muscle_group:'Cardio',emoji:'🏃',description:'Corsa indoor',is_default:true},
  {name:'Cyclette',muscle_group:'Cardio',emoji:'🚴',description:'Bici cardio',is_default:true},
  {name:'Ellittica',muscle_group:'Cardio',emoji:'♾️',description:'Low impact',is_default:true},
  {name:'Corda',muscle_group:'Cardio',emoji:'💫',description:'Jump rope',is_default:true},
  {name:'HIIT',muscle_group:'Cardio',emoji:'⚡',description:'High Intensity Interval',is_default:true},
];
