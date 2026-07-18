-- therapytrack: core schema
-- One shared household/patient context for Fase 1 (no multi-tenant needed yet).

create extension if not exists "pgcrypto";

create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  strength text not null,                 -- e.g. "40mg", "100mg/ml"
  form text not null,                      -- tableta | capsula | parche | jarabe | gotas
  dose_description text not null,          -- e.g. "1 capsula", "10 ml", "1/2 tableta"
  route text not null,                     -- oral | transdermica
  schedule_type text not null check (schedule_type in ('fixed_times', 'weekly', 'prn')),
  times text[] not null default '{}',      -- fixed_times: ['10:00','16:00','21:00'] in local wall-clock
  weekly_anchor_date date,                 -- weekly: date of first/most recent application
  weekly_interval_days int default 7,
  condition_note text,                     -- e.g. "antes del desayuno", "solo si dolor intenso"
  duration_description text,               -- raw text from prescription, e.g. "5 dias", "sin suspencion"
  is_chronic boolean not null default false,
  start_date date not null,
  course_end_date date,                    -- computed where determinable; null = open-ended/unknown
  units_per_dose numeric not null default 1,
  units_on_hand numeric,                   -- null = unknown/untracked
  units_label text not null default 'unidades',
  low_stock_threshold_days numeric not null default 5,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists dose_events (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references medications(id) on delete cascade,
  scheduled_date date not null,            -- the calendar day this instance belongs to
  scheduled_time text,                     -- 'HH:mm' local, null for PRN/weekly logged ad-hoc
  status text not null check (status in ('taken', 'skipped')),
  actual_at timestamptz not null default now(),
  caregiver_name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists dose_events_med_date_idx on dose_events (medication_id, scheduled_date);
create index if not exists medications_active_idx on medications (active);

alter table medications enable row level security;
alter table dose_events enable row level security;

-- Fase 1: shared-household app gated by app-level PIN (middleware), not per-row auth.
-- Using anon key with permissive policies scoped to this single deployment.
create policy "medications readable" on medications for select using (true);
create policy "medications writable" on medications for all using (true) with check (true);
create policy "dose_events readable" on dose_events for select using (true);
create policy "dose_events writable" on dose_events for all using (true) with check (true);
