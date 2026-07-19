"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import type { Medication } from "@/lib/types";
import { setMedicationActiveAction } from "@/app/(app)/actions";
import { MedicationForm } from "./medication-form";

function scheduleSummary(med: Medication): string {
  if (med.schedule_type === "prn") return "Por razon necesaria (PRN)";
  if (med.schedule_type === "weekly") {
    const days = med.weekly_interval_days ?? 7;
    return days === 7 ? "Semanal" : `Cada ${days} dias`;
  }
  if (med.times.length === 0) return "Sin horario";
  return med.times.join(", ");
}

export function MedicationRow({ medication }: { medication: Medication }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(() => setMedicationActiveAction(medication.id, !medication.active));
  }

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

        <div className="mt-3 flex items-center justify-between">
          <span className={`text-xs font-semibold ${medication.active ? "text-green-700" : "text-neutral-500"}`}>
            {medication.active ? "En rotacion" : "Fuera de rotacion"}
          </span>
          <button
            onClick={toggleActive}
            disabled={pending}
            className={`text-xs font-medium rounded-lg px-3 py-2 min-h-[44px] disabled:opacity-50 ${
              medication.active
                ? "text-red-700 border border-red-200 active:bg-red-50"
                : "text-blue-700 border border-blue-200 active:bg-blue-50"
            }`}
          >
            {medication.active ? "Quitar del horario" : "Reactivar en el horario"}
          </button>
        </div>
      </div>

      {editing && <MedicationForm medication={medication} onClose={() => setEditing(false)} />}
    </>
  );
}
