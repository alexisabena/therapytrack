"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { nowInTz } from "@/lib/schedule";
import type { Medication } from "@/lib/types";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/agenda");
  revalidatePath("/inventario");
  revalidatePath("/historial");
  revalidatePath("/medicamentos");
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

export type MedicationInput = Omit<Medication, "id" | "created_at" | "active">;

export async function createMedicationAction(input: MedicationInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("medications").insert({ ...input, active: true });
  if (error) throw error;
  revalidateAll();
}

export async function updateMedicationAction(medicationId: string, input: MedicationInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("medications").update(input).eq("id", medicationId);
  if (error) throw error;
  revalidateAll();
}

/** Soft removal: takes a medication out of rotation (Ahora/Agenda) while keeping its dose history and stock on hand. Reversible. */
export async function setMedicationActiveAction(medicationId: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("medications").update({ active }).eq("id", medicationId);
  if (error) throw error;
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

/** Additive restock: caregiver enters how many NEW units they just bought, added to current stock.
 * No recounting the full stock by hand — the swipe-confirm before/after display already handles
 * dose-level accuracy, so this only needs to answer "how many did we add." */
export async function restockUnitsAction(medicationId: string, addedUnits: number) {
  const supabase = await createClient();
  const medication = await getMedication(medicationId);

  if (medication.units_on_hand == null) {
    // Nothing to add to yet (existence was never registered) — treat as first registration.
    const { error } = await supabase
      .from("medications")
      .update({ units_on_hand: addedUnits })
      .eq("id", medicationId);
    if (error) throw error;
  } else {
    const { error } = await supabase.rpc("increment_units", { med_id: medicationId, amount: addedUnits });
    if (error) throw error;
  }

  revalidateAll();
}
