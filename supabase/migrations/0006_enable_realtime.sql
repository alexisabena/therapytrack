-- Push-based freshness instead of client polling: caregivers were seeing stale data
-- across different phones. Adding these tables to the realtime publication lets the
-- client subscribe to changes and nudge the caregiver to refresh, without repeated polling.

alter publication supabase_realtime add table dose_events;
alter publication supabase_realtime add table medications;
alter publication supabase_realtime add table medication_status_events;
