-- Grace-window anchor scheduling: replaces "reanchor on every dose" (which let normal,
-- harmless variance silently accumulate into schedule drift over days/weeks) with a
-- persisted, deliberate anchor that only moves when a dose lands meaningfully outside
-- its tolerance window. anchor_date/anchor_time is the current "clock" for a
-- rolling-cadence medication; grace_minutes is how much variance to absorb before
-- reanchoring (null = use the app-wide default in schedule.ts — ask the prescribing
-- doctor for the real tolerance per medication before tightening/loosening this).

alter table medications add column if not exists anchor_date date;
alter table medications add column if not exists anchor_time text;
alter table medications add column if not exists grace_minutes numeric;

update medications
set anchor_date = case when active then '2026-07-22' else start_date end,
    anchor_time = coalesce(times[1], '08:00')
where schedule_type = 'fixed_times' and interval_hours is not null and anchor_date is null;
