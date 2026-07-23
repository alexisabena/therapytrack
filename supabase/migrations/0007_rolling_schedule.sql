-- Rolling-cadence scheduling: fixed_times medications previously repeated the same
-- static clock times every day regardless of when a dose was actually given, which
-- doesn't match how meal-anchored dosing actually works (meal times shift day to day).
-- interval_hours captures the gap between doses for "every N hours" cadences; when set,
-- the next due time is computed from the most recent actual administration + interval_hours
-- instead of the static `times` array. NULL means "irregular custom schedule", unaffected.

alter table medications add column if not exists interval_hours numeric;

update medications
set interval_hours = 24.0 / array_length(times, 1)
where schedule_type = 'fixed_times' and array_length(times, 1) > 0 and interval_hours is null;
