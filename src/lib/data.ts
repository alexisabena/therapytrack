import { createClient } from "@/lib/supabase/server";
import type { DoseEvent, Medication, MedicationStatusEvent } from "./types";

export async function getActiveMedications(): Promise<Medication[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data as Medication[];
}

export async function getAllMedications(): Promise<Medication[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("medications").select("*").order("name");
  if (error) throw error;
  return data as Medication[];
}

export async function getEventsForDate(dateStr: string): Promise<DoseEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dose_events")
    .select("*")
    .eq("scheduled_date", dateStr);
  if (error) throw error;
  return data as DoseEvent[];
}

export async function getEventsForDateRange(fromDate: string, toDate: string): Promise<DoseEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dose_events")
    .select("*")
    .gte("scheduled_date", fromDate)
    .lte("scheduled_date", toDate);
  if (error) throw error;
  return data as DoseEvent[];
}

/** Full toggle history for all medications — small table, no pagination needed for a household tracker. */
export async function getMedicationStatusEvents(): Promise<MedicationStatusEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medication_status_events")
    .select("*")
    .order("changed_at", { ascending: true });
  if (error) throw error;
  return data as MedicationStatusEvent[];
}

/** Every distinct caregiver name that's actually logged something, so the "who are you" picker is
 * shared across devices instead of hardcoded — the app-wide fix for names not carrying over between
 * phones and typo'd names silently fragmenting the same person into separate entries. */
export async function getKnownCaregivers(): Promise<string[]> {
  const supabase = await createClient();
  const [doseRes, statusRes] = await Promise.all([
    supabase.from("dose_events").select("caregiver_name"),
    supabase.from("medication_status_events").select("caregiver_name"),
  ]);
  if (doseRes.error) throw doseRes.error;
  if (statusRes.error) throw statusRes.error;

  const seen = new Map<string, string>();
  for (const row of [...doseRes.data, ...statusRes.data]) {
    const name = (row.caregiver_name as string | null)?.trim();
    if (!name || name === "Sin nombre") continue;
    const key = name.toLowerCase();
    if (!seen.has(key)) seen.set(key, name);
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "es"));
}

export async function getRecentEvents(limit = 100): Promise<(DoseEvent & { medication: Medication })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dose_events")
    .select("*, medication:medications(*)")
    .order("actual_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as unknown as (DoseEvent & { medication: Medication })[];
}
