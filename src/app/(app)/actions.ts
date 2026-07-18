"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { nowInTz } from "@/lib/schedule";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/agenda");
  revalidatePath("/inventario");
  revalidatePath("/historial");
}

async function getMedication(medicationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .eq("id", medicationId)
    .single();
  if (error) throw error;
  return data;
}

export async function logDoseAction(input: {
  medicationId: string;
  scheduledDate: string;
  scheduledTime: string | null;
  status: "taken" | "skipped";
  caregiverName: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const medication = await getMedication(input.medicationId);

  const { error } = await supabase.from("dose_events").insert({
    medication_id: input.medicationId,
    scheduled_date: input.scheduledDate,
    scheduled_time: input.scheduledTime,
    status: input.status,
    caregiver_name: input.caregiverName || "Sin nombre",
    notes: input.notes ?? null,
  });
  if (error) throw error;

  if (input.status === "taken" && medication.units_per_dose != null) {
    const { error: decError } = await supabase.rpc("decrement_units", {
      med_id: input.medicationId,
      amount: medication.units_per_dose,
    });
    if (decError) throw decError;
  }

  revalidateAll();
}

export async function logPrnDoseAction(input: { medicationId: string; caregiverName: string; notes?: string }) {
  const { date } = nowInTz();
  await logDoseAction({
    medicationId: input.medicationId,
    scheduledDate: date,
    scheduledTime: null,
    status: "taken",
    caregiverName: input.caregiverName,
    notes: input.notes,
  });
}

export async function undoDoseAction(eventId: string) {
  const supabase = await createClient();
  const { data: event, error: fetchError } = await supabase
    .from("dose_events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (fetchError) throw fetchError;

  const { error: deleteError } = await supabase.from("dose_events").delete().eq("id", eventId);
  if (deleteError) throw deleteError;

  if (event.status === "taken") {
    const medication = await getMedication(event.medication_id);
    if (medication.units_per_dose != null) {
      const { error: incError } = await supabase.rpc("increment_units", {
        med_id: event.medication_id,
        amount: medication.units_per_dose,
      });
      if (incError) throw incError;
    }
  }

  revalidateAll();
}

export async function adjustUnitsAction(medicationId: string, newUnits: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("medications")
    .update({ units_on_hand: newUnits })
    .eq("id", medicationId);
  if (error) throw error;
  revalidateAll();
}
