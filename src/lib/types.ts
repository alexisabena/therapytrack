export type ScheduleType = "fixed_times" | "weekly" | "prn";

export type Medication = {
  id: string;
  name: string;
  strength: string;
  form: string;
  dose_description: string;
  route: string;
  schedule_type: ScheduleType;
  times: string[]; // "HH:mm" local wall-clock, fixed_times only
  weekly_anchor_date: string | null; // YYYY-MM-DD
  weekly_interval_days: number | null;
  condition_note: string | null;
  duration_description: string | null;
  is_chronic: boolean;
  start_date: string; // YYYY-MM-DD
  course_end_date: string | null;
  units_per_dose: number | null; // null = not auto-decremented (manual tracking)
  units_on_hand: number | null;
  units_label: string;
  low_stock_threshold_days: number;
  notes: string | null;
  active: boolean;
  created_at: string;
};

export type DoseStatus = "taken" | "skipped";

export type DoseEvent = {
  id: string;
  medication_id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: DoseStatus;
  actual_at: string;
  caregiver_name: string;
  notes: string | null;
  created_at: string;
};

export type MedicationStatusEvent = {
  id: string;
  medication_id: string;
  active: boolean;
  changed_at: string;
  caregiver_name: string;
};

export type DueState =
  | "overdue"
  | "due_now"
  | "due_soon"
  | "upcoming"
  | "done_taken"
  | "done_skipped";

export type DueItem = {
  medication: Medication;
  scheduledDate: string;
  scheduledTime: string | null;
  state: DueState;
  doseEvent: DoseEvent | null;
};
