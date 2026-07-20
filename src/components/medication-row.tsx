"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Medication, MedicationStatusEvent } from "@/lib/types";
import { MedicationForm } from "./medication-form";
import { MedicationActiveToggle } from "./medication-active-toggle";

function scheduleSummary(med: Medication): string {
  if (med.schedule_type === "prn") return "Por razon necesaria (PRN)";
  if (med.schedule_type === "weekly") {
    const days = med.weekly_interval_days ?? 7;
    return days === 7 ? "Semanal" : `Cada ${days} dias`;
  }
  if (med.times.length === 0) return "Sin horario";
  return med.times.join(", ");
}

export function MedicationRow({
  medication,
  statusEvents,
}: {
  medication: Medication;
  statusEvents: MedicationStatusEvent[];
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <div className={`rounded-2xl border bg-white p-4 ${medication.active ? "border-neutral-200" : "border-neutral-200 opacity-60"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-semibold text-neutral-900">{medication.name}</span>
              <span className="text-sm text-neutral-500">{medication.strength}</span>
            </div>
            <p className="text-sm text-neutral-600 mt-0.5">{medication.dose_description}</p>
            <p className="text-xs text-neutral-500 mt-1">{scheduleSummary(medication)}</p>
            {medication.units_on_hand != null && (
              <p className="text-xs text-neutral-400 mt-1">
                {medication.units_on_hand} {medication.units_label} disponibles
              </p>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            aria-label="Editar medicamento"
            className="flex items-center justify-center w-11 h-11 rounded-xl border border-neutral-300 text-neutral-500 active:bg-neutral-100 shrink-0"
          >
            <Pencil size={16} />
          </button>
        </div>

        <div className="mt-3">
          <MedicationActiveToggle medication={medication} statusEvents={statusEvents} />
        </div>
      </div>

      {editing && <MedicationForm medication={medication} onClose={() => setEditing(false)} />}
    </>
  );
}
