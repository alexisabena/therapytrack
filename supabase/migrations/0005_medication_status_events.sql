-- Audit trail of medication active/inactive toggles. medications.active still holds
-- the current state (fast to query), but past-date views (Agenda, "Dias anteriores")
-- need to know what was active *on that day*, not what's active right now — otherwise
-- deactivating a medicine today makes its earlier, already-logged doses disappear from
-- those day views. This table lets the app reconstruct that.

create table if not exists medication_status_events (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references medications(id) on delete cascade,
  active boolean not null,
  changed_at timestamptz not null default now(),
  caregiver_name text not null
);

create index if not exists medication_status_events_med_idx on medication_status_events (medication_id, changed_at);

alter table medication_status_events enable row level security;
create policy "medication_status_events readable" on medication_status_events for select using (true);
create policy "medication_status_events writable" on medication_status_events for all using (true) with check (true);

-- Atomic: flips the current flag and logs the transition in one statement, so the two
-- never drift apart (e.g. on a failed follow-up request).
create or replace function set_medication_active(med_id uuid, new_active boolean, caregiver text)
returns void
language sql
set search_path = public
as $$
  update medications set active = new_active where id = med_id;
  insert into medication_status_events (medication_id, active, caregiver_name)
  values (med_id, new_active, caregiver);
$$;
