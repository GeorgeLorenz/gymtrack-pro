-- ══════════════════════════════════════════════════════════════
-- GYMTRACK PRO — Supabase Schema
-- Esegui questo script nel SQL Editor di Supabase
-- ══════════════════════════════════════════════════════════════

-- Abilita l'estensione UUID
create extension if not exists "uuid-ossp";

-- ── PROFILI UTENTE ──────────────────────────────────────────
create table public.profiles (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  cognome     text not null,
  email       text not null unique,
  pwd_hash    text not null,
  ruolo       text not null default 'user' check (ruolo in ('admin','gym','pt','user')),
  telefono    text,
  altezza     numeric(5,1),
  peso        numeric(5,1),
  grasso      numeric(4,1),
  photo_url   text,
  pt_id       uuid references public.profiles(id) on delete set null,
  gym_id      uuid,
  created_at  timestamptz default now()
);

-- ── PALESTRA ────────────────────────────────────────────────
create table public.gym_profile (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  logo_url    text,
  address     text,
  phone       text,
  email       text,
  vat_id      text,
  description text,
  updated_at  timestamptz default now()
);

-- ── LIBRERIA ESERCIZI ───────────────────────────────────────
create table public.exercises (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  muscle_group  text not null,
  emoji         text default '🏋️',
  description   text,
  image_url     text,
  is_default    boolean default false,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz default now()
);

-- ── SCHEDE ALLENAMENTO ──────────────────────────────────────
create table public.workout_templates (
  id          uuid primary key default uuid_generate_v4(),
  pt_id       uuid references public.profiles(id) on delete cascade,
  nome        text not null,
  description text,
  schedule    jsonb not null default '{}',
  created_at  timestamptz default now()
);

-- ── ASSEGNAZIONI ────────────────────────────────────────────
create table public.workout_assignments (
  id            uuid primary key default uuid_generate_v4(),
  pt_id         uuid references public.profiles(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete cascade,
  template_id   uuid references public.workout_templates(id) on delete set null,
  template_name text,
  start_date    date default current_date,
  schedule      jsonb not null default '{}',
  created_at    timestamptz default now(),
  unique(user_id, pt_id)
);

-- ── SESSIONI DI ALLENAMENTO ─────────────────────────────────
create table public.workout_sessions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references public.profiles(id) on delete cascade,
  pt_id          uuid references public.profiles(id) on delete set null,
  session_date   date not null default current_date,
  session_note   text,
  is_free        boolean default false,
  template_name  text,
  duration_min   integer,
  total_volume   numeric(10,1) default 0,
  created_at     timestamptz default now()
);

-- ── ESERCIZI PER SESSIONE ───────────────────────────────────
create table public.session_exercises (
  id             uuid primary key default uuid_generate_v4(),
  session_id     uuid references public.workout_sessions(id) on delete cascade,
  exercise_id    uuid references public.exercises(id) on delete set null,
  exercise_name  text not null,
  muscle_group   text,
  serie          integer default 3,
  reps           integer default 10,
  weight         numeric(5,1) default 0,
  done           boolean default false,
  comment        text,
  pt_reply       text,
  sort_order     integer default 0
);

-- ── SALE ────────────────────────────────────────────────────
create table public.rooms (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  activity    text,
  capacity    integer default 10,
  description text,
  image_url   text,
  created_at  timestamptz default now()
);

-- ── CALENDARIO SALE ─────────────────────────────────────────
create table public.room_events (
  id               uuid primary key default uuid_generate_v4(),
  room_id          uuid references public.rooms(id) on delete cascade,
  day_key          text not null check (day_key in ('lun','mar','mer','gio','ven','sab','dom')),
  event_time       time not null,
  duration_min     integer default 60,
  activity         text,
  pt_id            uuid references public.profiles(id) on delete set null,
  max_participants integer default 10,
  notes            text,
  created_at       timestamptz default now()
);

-- ── RESET PASSWORD ──────────────────────────────────────────
create table public.password_resets (
  id         uuid primary key default uuid_generate_v4(),
  email      text not null,
  code       text not null,
  expires_at timestamptz not null,
  used       boolean default false,
  created_at timestamptz default now()
);

-- ── INDICI ──────────────────────────────────────────────────
create index on public.workout_sessions(user_id, session_date);
create index on public.session_exercises(session_id);
create index on public.exercises(muscle_group);
create index on public.workout_assignments(user_id);
create index on public.room_events(room_id, day_key);

-- ── RLS (Row Level Security) ─────────────────────────────────
-- Disabilita RLS per semplicità iniziale (gestione permessi lato app)
-- In produzione abilitare RLS con policies appropriate
alter table public.profiles disable row level security;
alter table public.exercises disable row level security;
alter table public.workout_sessions disable row level security;
alter table public.session_exercises disable row level security;
alter table public.workout_templates disable row level security;
alter table public.workout_assignments disable row level security;
alter table public.rooms disable row level security;
alter table public.room_events disable row level security;
alter table public.gym_profile disable row level security;
alter table public.password_resets disable row level security;

-- ── FUNZIONE: calcola volume sessione ───────────────────────
create or replace function update_session_volume(p_session_id uuid)
returns void language plpgsql as $$
begin
  update public.workout_sessions
  set total_volume = (
    select coalesce(sum(serie * reps * weight), 0)
    from public.session_exercises
    where session_id = p_session_id and done = true
  )
  where id = p_session_id;
end;
$$;
