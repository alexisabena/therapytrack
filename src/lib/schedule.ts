import type { DoseEvent, DueItem, DueState, Medication, MedicationStatusEvent } from "./types";

export const TIMEZONE = "America/Mexico_City";

export function nowInTz(referenceDate: Date = new Date()) {
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(referenceDate); // en-CA gives YYYY-MM-DD
  const timeStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(referenceDate); // HH:mm
  return { date: dateStr, time: timeStr };
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToHHMM(totalMinutes: number): string {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Fixed daily clock slots for "every N hours" dosing, starting at anchorTime and repeating through the day. */
export function generateIntervalTimes(intervalHours: number, anchorTime: string): string[] {
  const slotCount = Math.max(1, Math.round(24 / intervalHours));
  const start = toMinutes(anchorTime);
  const times: string[] = [];
  for (let i = 0; i < slotCount; i++) {
    times.push(minutesToHHMM(start + i * intervalHours * 60));
  }
  return times.sort();
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function daysBetween(fromStr: string, toStr: string): number {
  const [fy, fm, fd] = fromStr.split("-").map(Number);
  const [ty, tm, td] = toStr.split("-").map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86400000);
}

function localToEpochMinutes(dateStr: string, timeStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 60000 + toMinutes(timeStr);
}

/** Where a rolling-cadence medication's clock currently sits: the last real dose time if one
 * exists, otherwise its configured starting time — the anchor future slots step forward from. */
function rollingAnchor(med: Medication, lastTaken: DoseEvent | undefined): { date: string; time: string } {
  if (lastTaken) return nowInTz(new Date(lastTaken.actual_at));
  return { date: med.start_date, time: med.times[0] ?? "08:00" };
}

/** All rolling-cadence slot times landing on `dateStr`, stepping every `intervalHours` from `anchor`.
 * Because our intervals always divide 24h evenly, this always yields the same count per day —
 * a multi-day gap since the last dose doesn't create gaps or pile-ups, just keeps the same daily rhythm. */
function rollingSlotsForDate(anchor: { date: string; time: string }, intervalHours: number, dateStr: string): string[] {
  const intervalMinutes = intervalHours * 60;
  const anchorEpoch = localToEpochMinutes(anchor.date, anchor.time);
  const dayStartEpoch = localToEpochMinutes(dateStr, "00:00");
  const kStart = Math.ceil((dayStartEpoch - anchorEpoch) / intervalMinutes);
  const kEnd = Math.floor((dayStartEpoch + 1439 - anchorEpoch) / intervalMinutes);

  const times: string[] = [];
  for (let k = kStart; k <= kEnd; k++) {
    times.push(minutesToHHMM(anchorEpoch + k * intervalMinutes - dayStartEpoch));
  }
  return times.sort();
}

function isWithinCourse(med: Medication, dateStr: string): boolean {
  if (dateStr < med.start_date) return false;
  if (med.course_end_date && dateStr > med.course_end_date) return false;
  return true;
}

function classifyBySlotTime(scheduledTime: string, nowTime: string): DueState {
  const diff = toMinutes(nowTime) - toMinutes(scheduledTime);
  if (diff < -60) return "upcoming";
  if (diff < 0) return "due_soon";
  if (diff <= 30) return "due_now";
  return "overdue";
}

function findEvent(
  events: DoseEvent[],
  medicationId: string,
  scheduledDate: string,
  scheduledTime: string | null
): DoseEvent | null {
  return (
    events.find(
      (e) =>
        e.medication_id === medicationId &&
        e.scheduled_date === scheduledDate &&
        e.scheduled_time === scheduledTime
    ) ?? null
  );
}

/** Next weekly due date on/after `fromDate`, walking forward from the anchor. */
export function nextWeeklyDueDate(med: Medication, fromDate: string): string | null {
  if (!med.weekly_anchor_date) return null;
  const interval = med.weekly_interval_days ?? 7;
  const elapsed = daysBetween(med.weekly_anchor_date, fromDate);
  if (elapsed < 0) return med.weekly_anchor_date;
  const cyclesPassed = Math.floor(elapsed / interval);
  let candidate = addDays(med.weekly_anchor_date, cyclesPassed * interval);
  if (candidate < fromDate) candidate = addDays(candidate, interval);
  return candidate;
}

/** All due-today items for the "Ahora" dashboard: fixed_times slots + weekly-if-due-today. PRN excluded (shown separately). */
export function getDueItemsForToday(
  medications: Medication[],
  events: DoseEvent[],
  now: { date: string; time: string },
  latestTakenByMed: Record<string, DoseEvent> = {}
): DueItem[] {
  const items: DueItem[] = [];

  for (const med of medications) {
    if (!med.active) continue;

    if (med.schedule_type === "fixed_times") {
      if (!isWithinCourse(med, now.date)) continue;
      const slotTimes =
        med.interval_hours != null
          ? rollingSlotsForDate(rollingAnchor(med, latestTakenByMed[med.id]), med.interval_hours, now.date)
          : med.times;
      for (const time of slotTimes) {
        const event = findEvent(events, med.id, now.date, time);
        const state: DueState = event
          ? event.status === "taken"
            ? "done_taken"
            : "done_skipped"
          : classifyBySlotTime(time, now.time);
        items.push({ medication: med, scheduledDate: now.date, scheduledTime: time, state, doseEvent: event });
      }
    }

    if (med.schedule_type === "weekly") {
      const due = nextWeeklyDueDate(med, now.date);
      if (due !== now.date) continue;
      if (!isWithinCourse(med, now.date)) continue;
      const event = findEvent(events, med.id, now.date, null);
      const state: DueState = event ? (event.status === "taken" ? "done_taken" : "done_skipped") : "due_now";
      items.push({ medication: med, scheduledDate: now.date, scheduledTime: null, state, doseEvent: event });
    }
  }

  return items.sort((a, b) => {
    const order: Record<DueState, number> = {
      overdue: 0,
      due_now: 1,
      due_soon: 2,
      upcoming: 3,
      done_taken: 4,
      done_skipped: 4,
    };
    if (order[a.state] !== order[b.state]) return order[a.state] - order[b.state];
    return (a.scheduledTime ?? "00:00").localeCompare(b.scheduledTime ?? "00:00");
  });
}

export function activePrnMedications(medications: Medication[]): Medication[] {
  return medications.filter((m) => m.active && m.schedule_type === "prn");
}

/**
 * Whether a medication was active on a given calendar day, based on its toggle history
 * rather than its current `active` flag. The latest event at/before that date wins (so
 * several toggles on the same day resolve to whichever happened last); with no events
 * yet, it defaults to active, matching how a medication starts out when created.
 */
export function isActiveOnDate(statusEvents: MedicationStatusEvent[], medicationId: string, dateStr: string): boolean {
  const relevant = statusEvents
    .filter((e) => e.medication_id === medicationId && nowInTz(new Date(e.changed_at)).date <= dateStr)
    .sort((a, b) => a.changed_at.localeCompare(b.changed_at));
  if (relevant.length === 0) return true;
  return relevant[relevant.length - 1].active;
}

/** PRN meds in effect on a given date (date-aware version of activePrnMedications, for browsing past/other days). */
export function activePrnMedicationsOnDate(
  medications: Medication[],
  statusEvents: MedicationStatusEvent[],
  dateStr: string
): Medication[] {
  return medications.filter((m) => m.schedule_type === "prn" && isActiveOnDate(statusEvents, m.id, dateStr));
}

/** Full agenda for a given date, including meds outside today (for browsing other days) and weekly items even if not due.
 * `today`/`latestTakenByMed` enable rolling-cadence reanchoring (see `interval_hours`) for today/future dates only —
 * past days keep their originally-logged static times so history doesn't get silently rewritten by a later reanchor. */
export function getAgendaForDate(
  medications: Medication[],
  events: DoseEvent[],
  statusEvents: MedicationStatusEvent[],
  dateStr: string,
  today: string = dateStr,
  latestTakenByMed: Record<string, DoseEvent> = {}
): DueItem[] {
  const items: DueItem[] = [];
  for (const med of medications) {
    if (med.schedule_type === "prn" || !isActiveOnDate(statusEvents, med.id, dateStr)) continue;
    if (!isWithinCourse(med, dateStr)) continue;

    if (med.schedule_type === "fixed_times") {
      const slotTimes =
        med.interval_hours != null && dateStr >= today
          ? rollingSlotsForDate(rollingAnchor(med, latestTakenByMed[med.id]), med.interval_hours, dateStr)
          : med.times;
      for (const time of slotTimes) {
        const event = findEvent(events, med.id, dateStr, time);
        const state: DueState = event
          ? event.status === "taken"
            ? "done_taken"
            : "done_skipped"
          : "upcoming";
        items.push({ medication: med, scheduledDate: dateStr, scheduledTime: time, state, doseEvent: event });
      }
    } else if (med.schedule_type === "weekly") {
      const due = nextWeeklyDueDate(med, dateStr);
      if (due !== dateStr) continue;
      const event = findEvent(events, med.id, dateStr, null);
      const state: DueState = event ? (event.status === "taken" ? "done_taken" : "done_skipped") : "upcoming";
      items.push({ medication: med, scheduledDate: dateStr, scheduledTime: null, state, doseEvent: event });
    }
  }
  return items.sort((a, b) => (a.scheduledTime ?? "00:00").localeCompare(b.scheduledTime ?? "00:00"));
}

/** Doses/day used for inventory burn-rate; null when it can't be derived (prn or missing dose size). */
export function dosesPerDay(med: Medication): number | null {
  if (med.schedule_type === "fixed_times") return med.interval_hours != null ? 24 / med.interval_hours : med.times.length;
  if (med.schedule_type === "weekly") return 1 / (med.weekly_interval_days ?? 7);
  return null;
}

export function daysOfSupply(med: Medication): number | null {
  if (med.units_on_hand == null || med.units_per_dose == null) return null;
  const perDay = dosesPerDay(med);
  if (!perDay) return null;
  const dailyUnits = perDay * med.units_per_dose;
  if (dailyUnits <= 0) return null;
  return med.units_on_hand / dailyUnits;
}

export function courseRemainingDays(med: Medication, todayStr: string): number | null {
  if (!med.course_end_date) return null;
  const remaining = daysBetween(todayStr, med.course_end_date);
  return remaining < 0 ? 0 : remaining;
}

export type DaySummary = {
  date: string;
  administered: number;
  omitted: number;
  pending: number;
  total: number;
};

/** Administered/omitted/pending counts for a given day, for the "dias anteriores" lookback on the home screen. */
export function summarizeDay(
  medications: Medication[],
  events: DoseEvent[],
  statusEvents: MedicationStatusEvent[],
  dateStr: string,
  today: string = dateStr,
  latestTakenByMed: Record<string, DoseEvent> = {}
): DaySummary {
  const items = getAgendaForDate(medications, events, statusEvents, dateStr, today, latestTakenByMed);
  let administered = 0;
  let omitted = 0;
  let pending = 0;
  for (const item of items) {
    if (item.doseEvent?.status === "taken") administered++;
    else if (item.doseEvent?.status === "skipped") omitted++;
    else pending++;
  }
  return { date: dateStr, administered, omitted, pending, total: items.length };
}

export type StockFlag = { low: boolean; reason: string | null };

/** Flags when supply won't outlast the threshold window, or won't cover the rest of a finite course. */
export function stockFlag(med: Medication, todayStr: string): StockFlag {
  const supply = daysOfSupply(med);
  if (supply == null) return { low: false, reason: null };

  const remaining = courseRemainingDays(med, todayStr);
  if (remaining != null && supply < remaining) {
    return {
      low: true,
      reason: `Alcanza para ~${Math.floor(supply)} dias, pero el tratamiento continua ${remaining} dias mas`,
    };
  }
  if (supply < med.low_stock_threshold_days) {
    return { low: true, reason: `Alcanza para ~${Math.floor(supply)} dias` };
  }
  return { low: false, reason: null };
}
