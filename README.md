# 🏋️ GymTrack PRO

App web completa per la gestione di palestre, personal trainer e allenamenti personali.

---

## ✨ Funzionalità

- **4 ruoli**: Admin · Palestra · Personal Trainer · Utente
- **🆓 Allenamento Libero** — senza scheda assegnata, scegli tu gli esercizi
- **📋 Scheda Assegnata** — dal tuo PT, con check esercizi e commenti
- **📊 Statistiche & Grafici** — volume settimanale, progressione esercizi, gruppi muscolari
- **🗓 Calendario** settimanale allenamenti
- **📚 Libreria esercizi** — 43 esercizi default + creazione custom
- **🏢 Gestione Sale** + calendario corsi
- **📱 QR Code** per condividere schede
- **🔐 Autenticazione** email/password + recupero password

---

## 🚀 Deploy rapido (GitHub Pages)

```bash
# 1. Crea repo su GitHub
# 2. Carica tutti i file
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/TUO_USERNAME/gymtrack-pro.git
git push -u origin main

# 3. GitHub → Settings → Pages → Branch: main → Save
```

L'app sarà disponibile su `https://TUO_USERNAME.github.io/gymtrack-pro/`

---

## 🗄 Database — Supabase (opzionale)

Di default l'app usa **localStorage** del browser (dati locali, no sincronizzazione multi-device).

Per un database cloud reale con **Supabase** (gratuito):

### 1. Crea progetto Supabase
1. Vai su [supabase.com](https://supabase.com) → New Project
2. **SQL Editor** → Incolla il contenuto di `supabase/schema.sql` → Run

### 2. Configura le chiavi
Apri `js/config.js` e sostituisci:
```js
window.SUPABASE_URL = 'https://xxxxx.supabase.co';     // Project URL
window.SUPABASE_KEY = 'eyJ...';                         // anon/public key
```

Le chiavi si trovano in: **Project Settings → API**

### 3. (Opzionale) Storage per le foto
In Supabase: **Storage → New bucket → "photos"** (public)  
Poi aggiorna la logica di upload in `js/auth.js` per usare `supabase.storage`.

---

## 📁 Struttura File

```
gymtrack-pro/
├── index.html          # Entry point — HTML + bootstrap
├── css/
│   └── style.css       # Tutti gli stili
├── js/
│   ├── config.js       # Costanti, esercizi default, config Supabase
│   ├── db.js           # Data layer (localStorage + Supabase adapter)
│   ├── ui.js           # Router, modal, toast, helpers
│   ├── auth.js         # Login, register, password recovery
│   ├── workout.js      # Allenamento libero + scheda assegnata
│   ├── stats.js        # Grafici Chart.js e statistiche
│   └── pages.js        # Tutti i renderer di pagina
└── supabase/
    └── schema.sql      # Schema DB per Supabase
```

---

## 👥 Account Demo

| Ruolo | Email | Password |
|-------|-------|----------|
| 🛡 Admin | admin@gym.it | admin123 |
| 🏢 Palestra | palestra@gym.it | gym123 |
| 🏋️ Personal Trainer | pt@gym.it | pt123 |
| 👤 Utente | user@gym.it | user123 |

> Il primo account registrato diventa automaticamente Admin.

---

## 📊 Grafici Statistiche

- **Volume Settimanale** — kg sollevati per settimana (line chart)
- **Sessioni per Settimana** — frequenza allenamenti (bar chart)
- **Gruppi Muscolari** — distribuzione (doughnut chart)
- **Progressione Esercizio** — peso e volume nel tempo per ogni esercizio (line chart)

---

## 🔧 Personalizzazione

### Aggiungere esercizi di default
In `js/config.js` → array `DEFAULT_EXERCISES`.

### Aggiungere ruoli o sezioni nav
In `js/config.js` → oggetto `NAVS`.

### Email reali per recupero password
Integra [Resend](https://resend.com) o [SendGrid](https://sendgrid.com) nel backend (es. Supabase Edge Functions).

---

## 🛠 Tech Stack

- **Vanilla JS** — nessun framework frontend
- **Chart.js 4** — grafici
- **Supabase JS v2** — database cloud (opzionale)
- **QRCode.js** — generazione QR
- **Google Fonts** — Bebas Neue, DM Mono, Barlow Condensed

---

## 📄 Licenza

MIT — libero uso personale e commerciale.
