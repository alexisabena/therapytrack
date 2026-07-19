import { createClient } from "@/lib/supabase/server";
import type { DoseEvent, Medication } from "./types";

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
